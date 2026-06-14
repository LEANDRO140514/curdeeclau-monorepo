// ── Anthropic Direct LLM Provider Adapter ───────────────────
//
// Implements the canonical LLMProvider contract from
// @curdeeclau/shared behind the Anthropic Messages API.
//
// Authority: ADR-LLM-2 — Anthropic as premium fallback (LLM-5)
// Contract: packages/shared/src/llm/LLMProvider.ts (LLM-1)
//
// Anthropic uses its own Messages API format (non-OpenAI-compatible).
// Key differences from OpenAI-compatible adapters:
//   - x-api-key header instead of Authorization: Bearer
//   - anthropic-version header required
//   - system is a top-level param, not a message role
//   - Response: content[0].text instead of choices[0].message.content
//   - stop_reason instead of finish_reason
//   - input_tokens / output_tokens instead of prompt_tokens / completion_tokens
//   - max_tokens is REQUIRED by the API
//
// Design principles:
//   - Injectable HTTP client (testable without real API calls)
//   - Injectable config (no env reads inside core adapter logic)
//   - Provider-agnostic output types (LLMResponse, not Anthropic types)
//   - Errors wrapped in LLMProviderError (shared contract)
//   - No streaming, no tool calling, no structured outputs (v1)

import type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  LLMUsage,
  LLMMessage,
} from '@curdeeclau/shared';
import { LLMProviderError } from '@curdeeclau/shared';
import pino, { type Logger } from 'pino';

// ── Config ─────────────────────────────────────────────────

const DEFAULT_BASE_URL = 'https://api.anthropic.com/v1';
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_TOKENS = 1024;
const ANTHROPIC_VERSION = '2023-06-01';
const RESPONSE_PREVIEW_MAX = 500;

export type AnthropicAdapterConfig = {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeoutMs?: number;
  defaultMaxTokens?: number;
  anthropicVersion?: string;
  logger?: Logger;
};

// ── HTTP fetch type (injectable for testing) ───────────────

export type HttpFetch = (
  url: string,
  options: { method: string; headers: Record<string, string>; body?: string; signal?: AbortSignal },
) => Promise<{ status: number; json(): Promise<unknown> }>;

function defaultFetch(): HttpFetch {
  return async (url, options) => {
    const controller = new AbortController();
    const signal = options.signal ?? controller.signal;
    const response = await fetch(url, {
      method: options.method,
      headers: options.headers,
      body: options.body,
      signal,
    });
    return {
      status: response.status,
      json: () => response.json(),
    };
  };
}

// ── Anthropic API types (internal) ─────────────────────────

type AnthropicContentBlock =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> };

type AnthropicMessage = {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[];
};

type AnthropicResponse = {
  id: string;
  type: 'message';
  role: 'assistant';
  model: string;
  content: AnthropicContentBlock[];
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
};

// ── Adapter ────────────────────────────────────────────────

export class AnthropicAdapter implements LLMProvider {
  readonly providerId = 'anthropic';

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly timeoutMs: number;
  private readonly defaultMaxTokens: number;
  private readonly anthropicVersion: string;
  private readonly logger: Logger;
  private readonly fetch: HttpFetch;

  constructor(config: AnthropicAdapterConfig, httpFetch?: HttpFetch) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.defaultModel = config.defaultModel ?? DEFAULT_MODEL;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.defaultMaxTokens = config.defaultMaxTokens ?? DEFAULT_MAX_TOKENS;
    this.anthropicVersion = config.anthropicVersion ?? ANTHROPIC_VERSION;
    this.logger = config.logger ?? pino({ level: process.env.LOG_LEVEL ?? 'info', name: 'anthropic-adapter' });
    this.fetch = httpFetch ?? defaultFetch();
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model ?? this.defaultModel;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      // ── Separate system messages from conversation ──────────
      // Anthropic Messages API: system is a top-level param.
      // Only user and assistant roles are allowed in messages[].

      const systemMessages = request.messages
        .filter((m: LLMMessage) => m.role === 'system')
        .map((m: LLMMessage) => m.content);

      const conversationMessages: AnthropicMessage[] = request.messages
        .filter((m: LLMMessage) => m.role === 'user' || m.role === 'assistant')
        .map((m: LLMMessage) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const headers: Record<string, string> = {
        'x-api-key': this.apiKey,
        'anthropic-version': this.anthropicVersion,
        'Content-Type': 'application/json',
      };

      const body: Record<string, unknown> = {
        model,
        max_tokens: request.maxTokens ?? this.defaultMaxTokens,
        messages: conversationMessages,
      };

      // System prompt: concatenate if multiple, or use single string
      if (systemMessages.length > 0) {
        body.system = systemMessages.join('\n\n');
      }

      if (request.temperature !== undefined) {
        body.temperature = request.temperature;
      }

      const url = `${this.baseUrl}/messages`;

      const httpResponse = await this.fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!httpResponse || httpResponse.status >= 400) {
        const statusCode = httpResponse?.status;
        const retryable = statusCode === 429 || statusCode === 503 || statusCode === 502 || statusCode === 529;
        throw new LLMProviderError(
          `Anthropic HTTP ${statusCode}`,
          this.providerId,
          { statusCode, retryable },
        );
      }

      const data = (await httpResponse.json()) as Record<string, unknown>;

      if (!data || !data.content || !Array.isArray(data.content) || data.content.length === 0) {
        const preview = JSON.stringify(data).slice(0, RESPONSE_PREVIEW_MAX);
        this.logger.error({ preview }, 'Anthropic returned unexpected response shape');
        throw new LLMProviderError(
          'Anthropic returned unexpected response shape',
          this.providerId,
          { retryable: false },
        );
      }

      // Extract text from content blocks
      const textBlocks = (data.content as AnthropicContentBlock[])
        .filter((block) => block.type === 'text')
        .map((block) => (block as { type: 'text'; text: string }).text);

      const content = textBlocks.join('');

      const usage: LLMUsage | undefined = data.usage
        ? {
            promptTokens: (data.usage as Record<string, number>).input_tokens ?? 0,
            completionTokens: (data.usage as Record<string, number>).output_tokens ?? 0,
            totalTokens:
              ((data.usage as Record<string, number>).input_tokens ?? 0) +
              ((data.usage as Record<string, number>).output_tokens ?? 0),
          }
        : undefined;

      return {
        text: content,
        model: (data.model as string) ?? model,
        provider: this.providerId,
        usage,
        finishReason: (data.stop_reason as string) ?? undefined,
        providerMetadata: {
          anthropic_id: data.id,
          anthropic_type: data.type,
          anthropic_stop_reason: data.stop_reason,
        },
      };
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof LLMProviderError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new LLMProviderError(
          `Anthropic request timed out after ${this.timeoutMs}ms`,
          this.providerId,
          { retryable: true },
        );
      }
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error({ err: message }, 'Anthropic adapter error');
      throw new LLMProviderError(
        `Anthropic adapter error: ${message}`,
        this.providerId,
        { retryable: true },
      );
    }
  }
}
