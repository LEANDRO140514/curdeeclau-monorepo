import { buildExtractor, DEFAULT_FACT_TYPES } from "./extractor";
import { buildStore } from "./store";
import type {
  SemanticMemoryConfig,
  CrossSessionContextParams,
  ExtractAndSaveParams,
  MemoryFact,
  MemoryFactType,
  MessageSearchResult,
  UpsertFactParams,
  SearchFactsParams,
} from "./types";

export { DEFAULT_FACT_TYPES };

export type {
  SemanticMemoryConfig,
  MemoryFact,
  MemoryFactType,
  MessageSearchResult,
  ExtractAndSaveParams,
  CrossSessionContextParams,
  UpsertFactParams,
  SearchFactsParams,
};

export interface SemanticMemory {
  /**
   * Fire-and-forget: extract facts from a conversation turn and persist them.
   * Never throws — errors are silently swallowed to avoid blocking the chat.
   */
  extractAndSave(params: ExtractAndSaveParams): void;

  /**
   * Get cross-session context to inject into the system prompt.
   * Always fetches top facts by trust score (empty query = no FTS filter).
   * Also runs FTS for specific (non-generic) queries.
   * Returns empty string on any error (fail-open).
   */
  getCrossSessionContext(params: CrossSessionContextParams): Promise<string>;

  /**
   * Direct access to the underlying store for custom queries.
   */
  store: ReturnType<typeof buildStore>;
}

/**
 * Adapter for verticals using sm_chat_messages (migration 002).
 * Only needed if you store messages in the sm_chat_messages table.
 * Verticals with their own messages table should write their own adapter.
 */
export interface ChatMessagesAdapter {
  searchConversations(params: {
    userId: string;
    contextId?: string | null;
    query: string;
    limit?: number;
  }): Promise<MessageSearchResult[]>;
}

const GENERIC_MEMORY_QUERY =
  /^(que|qué|recuerdas|recuerda|memoria|sabes|anteriormente|sesión anterior|me conoces|what do you remember|remember)/i;

export function createSemanticMemory(
  config: SemanticMemoryConfig,
): SemanticMemory {
  const store = buildStore(config);
  const extractFacts = buildExtractor(config);

  function extractAndSave(params: ExtractAndSaveParams): void {
    extractFacts({
      userMessage: params.userMessage,
      aiResponse: params.aiResponse,
    })
      .then((facts) => {
        if (facts.length === 0) return;
        void Promise.allSettled(
          facts.map((f) =>
            store
              .upsertFact({
                userId: params.userId,
                contextId: params.contextId,
                sessionId: params.sessionId,
                factText: f.factText,
                factType: f.factType,
                metadata: { confidence: f.confidence },
              })
              .catch(() => {}),
          ),
        );
      })
      .catch(() => {});
  }

  async function getCrossSessionContext(
    params: CrossSessionContextParams,
  ): Promise<string> {
    try {
      const userQuery = params.userQuery?.trim() ?? "";
      const base = {
        userId: params.userId,
        contextId: params.contextId,
        excludeSessionId: params.sessionId,
        minTrustScore: 1,
      };

      const isSpecific =
        userQuery.length >= 3 && !GENERIC_MEMORY_QUERY.test(userQuery);

      const searches = [store.searchFacts({ ...base, query: "", limit: 5 })];
      if (isSpecific) {
        searches.push(
          store.searchFacts({ ...base, query: userQuery, limit: 3 }),
        );
      }

      const results = await Promise.all(searches);
      const seen = new Set<string>();
      const facts = results
        .flat()
        .filter((f) => (seen.has(f.id) ? false : (seen.add(f.id), true)));

      if (facts.length === 0) return "";

      const block = facts
        .map(
          (f) =>
            `  • [${f.factType}] ${f.factText} (trust: ${f.trustScore}/10)`,
        )
        .join("\n");

      return `\n=== Memory from previous sessions ===\n${block}\n=== End memory ===\n`;
    } catch {
      return "";
    }
  }

  return { extractAndSave, getCrossSessionContext, store };
}

/**
 * Build the optional chat messages adapter (requires migration 002).
 */
export function createChatMessagesAdapter(
  config: SemanticMemoryConfig,
): ChatMessagesAdapter {
  const store = buildStore(config);

  return {
    async searchConversations(params) {
      try {
        return await store.searchConversations(params);
      } catch {
        return [];
      }
    },
  };
}
