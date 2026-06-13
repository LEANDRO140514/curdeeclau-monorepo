// ── Canonical Embedding Provider Contract ──────────────────
//
// Authority: ADR-LLM-1
// Location: packages/shared/src/llm/EmbeddingProvider.ts
//
// This contract defines the provider-agnostic interface for
// text embedding generation in CURDEECLAU. It is intentionally
// SEPARATE from LLMProvider — a provider may implement one,
// both, or neither.
//
// Design principles:
//   - Provider-agnostic: no vendor-specific model names or fields
//   - v1 scope: single-text and batch embedding only
//   - Mockable: any test can provide an InMemory implementation

// ── Types ──────────────────────────────────────────────────

export interface EmbeddingVector {
  /** Zero-based index matching the input array position */
  index: number;
  /** Float vector */
  embedding: number[];
  /** Token count if reported by provider */
  tokensUsed?: number;
}

export interface EmbeddingRequest {
  /** Single text to embed */
  input: string;
  /** Model identifier. Optional — provider picks default. */
  model?: string;
  /** Desired vector dimension. Optional — provider picks default. */
  dimensions?: number;
  /** Extension metadata */
  metadata?: Record<string, unknown>;
}

export interface EmbeddingBatchRequest {
  /** Multiple texts to embed */
  inputs: string[];
  /** Model identifier. Optional. */
  model?: string;
  /** Desired vector dimension. Optional. */
  dimensions?: number;
  /** Extension metadata */
  metadata?: Record<string, unknown>;
}

export interface EmbeddingResponse {
  /** Provider used */
  provider: string;
  /** Model used */
  model: string;
  /** Embedding vector */
  vector: EmbeddingVector;
}

export interface EmbeddingBatchResponse {
  /** Provider used */
  provider: string;
  /** Model used */
  model: string;
  /** Embedding vectors, one per input */
  vectors: EmbeddingVector[];
  /** Total tokens used across all inputs */
  totalTokensUsed?: number;
}

// ── Provider Interface ─────────────────────────────────────

export interface EmbeddingProvider {
  /** Unique provider identifier */
  readonly providerId: string;

  /** Embed a single text */
  embedText(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  /** Embed multiple texts in one batch */
  embedBatch(request: EmbeddingBatchRequest): Promise<EmbeddingBatchResponse>;
}

// ── Error ──────────────────────────────────────────────────

export class EmbeddingProviderError extends Error {
  providerId: string;
  statusCode?: number;
  retryable: boolean;

  constructor(
    message: string,
    providerId: string,
    opts: { statusCode?: number; retryable?: boolean } = {},
  ) {
    super(message);
    this.name = 'EmbeddingProviderError';
    this.providerId = providerId;
    this.statusCode = opts.statusCode;
    this.retryable = opts.retryable ?? false;
  }
}
