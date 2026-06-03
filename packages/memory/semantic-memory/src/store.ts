import type {
  MemoryFact,
  MessageSearchResult,
  SemanticMemoryConfig,
  UpsertFactParams,
  SearchFactsParams,
} from "./types";

function rowToFact(row: Record<string, unknown>): MemoryFact {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    contextId: (row.context_id as string) ?? null,
    sessionId: (row.session_id as string) ?? null,
    factText: row.fact_text as string,
    factType: row.fact_type as string,
    trustScore: (row.trust_score as number) ?? 1,
    sourceMessageId: (row.source_message_id as string) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function buildStore(config: SemanticMemoryConfig) {
  const supabase = config.supabase;
  const lang = config.ftsLanguage ?? "spanish";

  async function upsertFact(params: UpsertFactParams): Promise<MemoryFact> {
    const { data, error } = await supabase.rpc("sm_upsert_memory_fact", {
      p_user_id: params.userId,
      p_context_id: params.contextId ?? null,
      p_session_id: params.sessionId ?? null,
      p_fact_text: params.factText.trim(),
      p_fact_type: params.factType,
      p_source_message_id: params.sourceMessageId ?? null,
      p_metadata: params.metadata ?? {},
    });
    if (error) throw new Error(error.message);
    return rowToFact(data as Record<string, unknown>);
  }

  async function searchFacts(params: SearchFactsParams): Promise<MemoryFact[]> {
    const { data, error } = await supabase.rpc("sm_search_memory_facts", {
      p_user_id: params.userId,
      p_context_id: params.contextId ?? null,
      p_query: params.query,
      p_exclude_session_id: params.excludeSessionId ?? null,
      p_limit: params.limit ?? 5,
      p_min_trust_score: params.minTrustScore ?? 1,
      p_language: lang,
    });

    if (error) {
      // Fallback: ILIKE when RPC not deployed yet
      return fallbackSearch(params);
    }

    return ((data ?? []) as Record<string, unknown>[]).map(rowToFact);
  }

  async function fallbackSearch(
    params: SearchFactsParams,
  ): Promise<MemoryFact[]> {
    let q = supabase
      .from("sm_memory_facts")
      .select("*")
      .eq("user_id", params.userId)
      .gte("trust_score", params.minTrustScore ?? 1)
      .order("trust_score", { ascending: false })
      .limit(params.limit ?? 5);

    if (params.contextId) q = q.eq("context_id", params.contextId);
    if (params.excludeSessionId)
      q = q.neq("session_id", params.excludeSessionId);

    if (params.query) {
      const keywords = params.query.split(/\s+/).filter(Boolean);
      if (keywords.length > 0) {
        q = q.or(keywords.map((k) => `fact_text.ilike.%${k}%`).join(","));
      }
    }

    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, unknown>[]).map(rowToFact);
  }

  async function searchConversations(params: {
    userId: string;
    contextId?: string | null;
    query: string;
    limit?: number;
  }): Promise<MessageSearchResult[]> {
    const { data, error } = await supabase.rpc("sm_search_chat_messages", {
      p_user_id: params.userId,
      p_context_id: params.contextId ?? null,
      p_query: params.query,
      p_limit: params.limit ?? 10,
      p_language: lang,
    });
    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, unknown>[]).map(
      (row): MessageSearchResult => ({
        messageId: row.message_id as string,
        sessionId: row.session_id as string,
        sessionTitle: row.session_title as string,
        role: row.role as "user" | "assistant",
        content: row.content as string,
        snippet: row.snippet as string,
        createdAt: row.created_at as string,
      }),
    );
  }

  return { upsertFact, searchFacts, searchConversations };
}
