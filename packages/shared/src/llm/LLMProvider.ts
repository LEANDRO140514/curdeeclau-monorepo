// ── Canonical LLM Provider Contract ────────────────────────
//
// Authority: ADR-LLM-1
// Location: packages/shared/src/llm/LLMProvider.ts
//
// This contract defines the provider-agnostic interface for
// language model interactions in CURDEECLAU. Every LLM
// provider (OpenAI, DeepSeek, Anthropic, local models) must
// be wrapped behind this interface.
//
// Design principles:
//   - Provider-agnostic: no vendor-specific fields
//   - v1 scope: chat completion only (no streaming, no tool calling)
//   - Mockable: any test can provide an InMemory implementation

// ── Types ──────────────────────────────────────────────────

export type LLMRole = 'system' | 'user' | 'assistant';

export interface LLMMessage {
  role: LLMRole;
  content: string;
}

export interface LLMMetadata {
  /** Tenant scope (Prometheus multitenant, free-form for v1) */
  tenantId?: string;
  /** Tracing correlation ID */
  traceId?: string;
  /** Arbitrary extension for providers, observability, etc. */
  [key: string]: unknown;
}

export interface LLMRequest {
  messages: LLMMessage[];
  /** Model identifier. Provider-specific. Optional — provider picks default. */
  model?: string;
  /** Sampling temperature 0..2. Optional — provider picks default. */
  temperature?: number;
  /** Maximum completion tokens. Optional — provider picks default. */
  maxTokens?: number;
  /** Extension metadata (tenantId, traceId, etc.) */
  metadata?: LLMMetadata;
}

export interface LLMResponse {
  /** Generated text content */
  text: string;
  /** Model used for this completion */
  model: string;
  /** Provider identifier (e.g. 'openai', 'deepseek', 'anthropic') */
  provider: string;
  /** Token usage (optional for providers that don't expose it) */
  usage?: LLMUsage;
  /** Reason completion finished ('stop', 'length', etc.) */
  finishReason?: string;
  /** Provider-specific metadata. Never required for core logic. */
  providerMetadata?: Record<string, unknown>;
}

export interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// ── Provider Interface ─────────────────────────────────────

export interface LLMProvider {
  /** Unique provider identifier (e.g. 'openai', 'deepseek') */
  readonly providerId: string;

  /** Generate a completion from a sequence of messages */
  generate(request: LLMRequest): Promise<LLMResponse>;
}

// ── Error ──────────────────────────────────────────────────

export class LLMProviderError extends Error {
  providerId: string;
  /** HTTP status or equivalent (undefined for non-HTTP providers) */
  statusCode?: number;
  /** Whether a retry is likely to succeed */
  retryable: boolean;

  constructor(
    message: string,
    providerId: string,
    opts: { statusCode?: number; retryable?: boolean } = {},
  ) {
    super(message);
    this.name = 'LLMProviderError';
    this.providerId = providerId;
    this.statusCode = opts.statusCode;
    this.retryable = opts.retryable ?? false;
  }
}

// ── Helpers ────────────────────────────────────────────────

export function createUserMessage(content: string): LLMMessage {
  return { role: 'user', content };
}

export function createSystemMessage(content: string): LLMMessage {
  return { role: 'system', content };
}

export function createAssistantMessage(content: string): LLMMessage {
  return { role: 'assistant', content };
}
