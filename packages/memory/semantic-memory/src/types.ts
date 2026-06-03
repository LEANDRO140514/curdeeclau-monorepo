import type { SupabaseClient } from "@supabase/supabase-js";

export type MemoryFactType = string;

export interface MemoryFact {
  id: string;
  userId: string;
  contextId: string | null;
  sessionId: string | null;
  factText: string;
  factType: MemoryFactType;
  trustScore: number;
  sourceMessageId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedFact {
  factText: string;
  factType: MemoryFactType;
  confidence: number;
}

export interface MessageSearchResult {
  messageId: string;
  sessionId: string;
  sessionTitle: string;
  role: "user" | "assistant";
  content: string;
  snippet: string;
  createdAt: string;
}

export interface SemanticMemoryConfig {
  supabase: SupabaseClient;
  ai: {
    apiKey: string;
    model?: string;
    baseURL?: string;
  };
  /**
   * Fact types for this vertical.
   * @default ["preference", "rule", "entity", "task", "general"]
   */
  factTypes?: string[];
  /**
   * PostgreSQL FTS language dictionary.
   * @default "spanish"
   */
  ftsLanguage?: string;
  /**
   * Custom extraction prompt. Use {{userMessage}} and {{aiResponse}} as placeholders.
   * If omitted, a generic prompt is used.
   */
  extractionPrompt?: string;
}

export interface UpsertFactParams {
  userId: string;
  contextId?: string | null;
  sessionId?: string | null;
  factText: string;
  factType: MemoryFactType;
  sourceMessageId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface SearchFactsParams {
  userId: string;
  contextId?: string | null;
  query: string;
  excludeSessionId?: string | null;
  limit?: number;
  minTrustScore?: number;
}

export interface CrossSessionContextParams {
  userId: string;
  contextId?: string | null;
  sessionId: string;
  userQuery?: string;
}

export interface ExtractAndSaveParams {
  userId: string;
  contextId?: string | null;
  sessionId?: string | null;
  userMessage: string;
  aiResponse: string;
}
