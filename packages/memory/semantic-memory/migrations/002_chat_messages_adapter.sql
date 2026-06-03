-- ============================================================
-- @curdeeclau/semantic-memory — Migration 002 (OPTIONAL)
-- Reference adapter: sm_chat_messages + sm_search_chat_messages RPC
--
-- Apply this ONLY if your vertical does not have its own messages table.
-- If you already store chat messages elsewhere, write an adapter that
-- calls sm_search_chat_messages against your existing table instead.
--
-- Depends on: 001_semantic_memory.sql
-- ============================================================

-- ─── 1. Chat Messages Table ──────────────────────────────────

create table if not exists public.sm_chat_messages (
  id            uuid        default gen_random_uuid() primary key,
  user_id       uuid        references auth.users(id) on delete cascade not null,
  context_id    text,                         -- mirrors sm_memory_facts.context_id
  session_id    text        not null,
  session_title text        not null default 'New conversation',
  role          text        not null check (role in ('user', 'assistant', 'tool')),
  content       text        not null,
  metadata      jsonb       not null default '{}',
  search_vector tsvector,
  created_at    timestamptz not null default now()
);

-- RLS
alter table public.sm_chat_messages enable row level security;

create policy "sm_chat_messages_own" on public.sm_chat_messages
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists sm_chat_messages_session_idx
  on public.sm_chat_messages(session_id, created_at desc);

create index if not exists sm_chat_messages_user_ctx_idx
  on public.sm_chat_messages(user_id, context_id, created_at desc);

-- ─── 2. FTS trigger ──────────────────────────────────────────
-- Language is resolved at write time via a session variable.
-- Default: 'spanish'. Override per transaction:
--   set local semantic_memory.fts_language = 'english';

create or replace function public.sm_chat_messages_search_vector()
returns trigger language plpgsql as $$
declare
  v_lang text;
begin
  begin
    v_lang := current_setting('semantic_memory.fts_language', true);
  exception when others then
    v_lang := null;
  end;
  if v_lang is null or v_lang = '' then
    v_lang := 'spanish';
  end if;

  new.search_vector :=
    setweight(to_tsvector(v_lang::regconfig, coalesce(new.content, '')), 'A');
  return new;
end;
$$;

drop trigger if exists trg_sm_chat_messages_fts on public.sm_chat_messages;
create trigger trg_sm_chat_messages_fts
  before insert or update of content on public.sm_chat_messages
  for each row execute function public.sm_chat_messages_search_vector();

create index if not exists sm_chat_messages_fts_es_idx
  on public.sm_chat_messages using gin(search_vector);

-- ─── 3. RPC: sm_search_chat_messages ─────────────────────────
-- Full-text search with highlighted snippets.
-- p_context_id = null → search across all contexts for the user.
-- p_query = '' → returns nothing (FTS required for message search).

create or replace function public.sm_search_chat_messages(
  p_user_id    uuid,
  p_context_id text,
  p_query      text,
  p_language   text default 'spanish',
  p_limit      int  default 10
)
returns table (
  message_id    uuid,
  session_id    text,
  session_title text,
  role          text,
  content       text,
  snippet       text,
  created_at    timestamptz
)
language plpgsql stable
as $$
declare
  v_tsquery tsquery;
begin
  if p_query is null or p_query = '' then
    return;
  end if;

  v_tsquery := plainto_tsquery(p_language::regconfig, p_query);

  return query
  select
    cm.id,
    cm.session_id,
    cm.session_title,
    cm.role,
    cm.content,
    ts_headline(
      p_language::regconfig,
      cm.content,
      v_tsquery,
      'StartSel=<mark>, StopSel=</mark>, MaxWords=30, MinWords=10, ShortWord=3'
    ) as snippet,
    cm.created_at
  from public.sm_chat_messages cm
  where cm.user_id = p_user_id
    and (p_context_id is null or cm.context_id = p_context_id)
    and cm.search_vector @@ v_tsquery
  order by ts_rank(cm.search_vector, v_tsquery) desc, cm.created_at desc
  limit p_limit;
end;
$$;
