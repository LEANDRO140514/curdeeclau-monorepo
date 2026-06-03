-- ============================================================
-- @curdeeclau/semantic-memory — Migration 001
-- Generic cross-session memory: FTS, trust scoring, auto-extraction
--
-- Prefix: sm_ (semantic-memory) to avoid collisions in shared DBs
-- context_id: optional second tenant dimension (org, workspace, subaccount, etc.)
-- ============================================================

-- ─── 1. Memory Facts Table ──────────────────────────────────

create table if not exists public.sm_memory_facts (
  id                uuid default gen_random_uuid() primary key,
  user_id           uuid references auth.users(id) on delete cascade not null,
  context_id        text,                          -- vertical-defined: org_id, subaccount_id, workspace_id, etc.
  session_id        text,                          -- chat session reference (loose — no FK to stay portable)
  fact_text         text not null,
  fact_type         text not null default 'general',
  trust_score       integer not null default 1
                    check (trust_score between 1 and 10),
  source_message_id text,
  metadata          jsonb default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Dedup: same user + context + text = same fact (increments trust on conflict)
create unique index if not exists sm_memory_facts_text_uniq
  on public.sm_memory_facts(user_id, coalesce(context_id, ''), fact_text);

-- RLS
alter table public.sm_memory_facts enable row level security;

create policy "sm_memory_facts_own" on public.sm_memory_facts
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Performance indexes
create index if not exists sm_memory_facts_user_ctx_idx
  on public.sm_memory_facts(user_id, context_id, trust_score desc);

create index if not exists sm_memory_facts_session_idx
  on public.sm_memory_facts(session_id);

create index if not exists sm_memory_facts_created_at_idx
  on public.sm_memory_facts(created_at desc);

-- ─── 2. updated_at trigger ──────────────────────────────────

create or replace function public.sm_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sm_memory_facts_updated_at on public.sm_memory_facts;
create trigger trg_sm_memory_facts_updated_at
  before update on public.sm_memory_facts
  for each row execute function public.sm_touch_updated_at();

-- ─── 3. RPC: sm_upsert_memory_fact ──────────────────────────
-- Atomic upsert: increments trust_score on conflict (cap 10).

create or replace function public.sm_upsert_memory_fact(
  p_user_id           uuid,
  p_context_id        text,
  p_session_id        text,
  p_fact_text         text,
  p_fact_type         text,
  p_source_message_id text,
  p_metadata          jsonb default '{}'
)
returns public.sm_memory_facts
language plpgsql
as $$
declare
  v_fact public.sm_memory_facts;
begin
  insert into public.sm_memory_facts (
    user_id, context_id, session_id,
    fact_text, fact_type, trust_score,
    source_message_id, metadata
  ) values (
    p_user_id, p_context_id, p_session_id,
    p_fact_text, p_fact_type, 1,
    p_source_message_id, p_metadata
  )
  on conflict (user_id, coalesce(context_id, ''), fact_text) do update
  set
    trust_score = least(sm_memory_facts.trust_score + 1, 10),
    metadata    = sm_memory_facts.metadata
                  || jsonb_build_object(
                       'mentionCount',
                       coalesce((sm_memory_facts.metadata->>'mentionCount')::int, 0) + 1
                     ),
    session_id  = coalesce(p_session_id, sm_memory_facts.session_id),
    updated_at  = now()
  returning * into v_fact;

  return v_fact;
end;
$$;

-- ─── 4. RPC: sm_search_memory_facts ─────────────────────────
-- FTS search with configurable language.
-- p_query = '' → returns top facts by trust_score (no FTS filter).

create or replace function public.sm_search_memory_facts(
  p_user_id          uuid,
  p_context_id       text,
  p_query            text,
  p_language         text    default 'spanish',
  p_exclude_session_id text  default null,
  p_limit            int     default 5,
  p_min_trust_score  int     default 1
)
returns table (
  id                uuid,
  user_id           uuid,
  context_id        text,
  session_id        text,
  fact_text         text,
  fact_type         text,
  trust_score       int,
  source_message_id text,
  metadata          jsonb,
  created_at        timestamptz,
  updated_at        timestamptz,
  relevance         real
)
language plpgsql stable
as $$
declare
  v_tsquery tsquery;
begin
  if p_query <> '' then
    v_tsquery := plainto_tsquery(p_language::regconfig, p_query);
  end if;

  return query
  select
    mf.id, mf.user_id, mf.context_id, mf.session_id,
    mf.fact_text, mf.fact_type, mf.trust_score,
    mf.source_message_id, mf.metadata, mf.created_at, mf.updated_at,
    case
      when p_query = '' then 0.0::real
      else ts_rank(
             to_tsvector(p_language::regconfig, coalesce(mf.fact_text, '')),
             v_tsquery
           )
    end as relevance
  from public.sm_memory_facts mf
  where mf.user_id = p_user_id
    and (p_context_id is null or mf.context_id = p_context_id)
    and mf.trust_score >= p_min_trust_score
    and (p_exclude_session_id is null or mf.session_id != p_exclude_session_id)
    and (
      p_query = ''
      or to_tsvector(p_language::regconfig, coalesce(mf.fact_text, '')) @@ v_tsquery
    )
  order by mf.trust_score desc, relevance desc, mf.updated_at desc
  limit p_limit;
end;
$$;

-- ─── 5. FTS indexes on sm_memory_facts ──────────────────────
-- Default indexes for 'spanish'. Add more per vertical if needed:
--   create index sm_memory_facts_fts_en_idx on public.sm_memory_facts
--   using gin(to_tsvector('english', coalesce(fact_text, '')));

create index if not exists sm_memory_facts_fts_es_idx
  on public.sm_memory_facts
  using gin(to_tsvector('spanish', coalesce(fact_text, '')));
