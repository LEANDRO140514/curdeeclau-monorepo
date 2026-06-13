// ── LLM Module Barrel ──────────────────────────────────────

export {
  // Provider interface
  type LLMProvider,
  // Types
  type LLMRole,
  type LLMMessage,
  type LLMMetadata,
  type LLMRequest,
  type LLMResponse,
  type LLMUsage,
  // Error
  LLMProviderError,
  // Helpers
  createUserMessage,
  createSystemMessage,
  createAssistantMessage,
} from './LLMProvider';

export {
  // Provider interface
  type EmbeddingProvider,
  // Types
  type EmbeddingVector,
  type EmbeddingRequest,
  type EmbeddingBatchRequest,
  type EmbeddingResponse,
  type EmbeddingBatchResponse,
  // Error
  EmbeddingProviderError,
} from './EmbeddingProvider';
