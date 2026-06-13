// ── OpenRouter LLM Provider Adapter ─────────────────────────
//
// Implements the canonical LLMProvider contract from
// @curdeeclau/shared behind the OpenRouter multi-model gateway.
//
// Authority: ADR-LLM-2 — OpenRouter-first, not OpenRouter-only
// Contract: packages/shared/src/llm/LLMProvider.ts (LLM-1)
//
// Design principles:
//   - Injectable HTTP client (testable without real API calls)
//   - Injectable config (no env reads inside core adapter logic)
//   - Provider-agnostic output types (LLMResponse, not OpenRouter types)
//   - Errors wrapped in LLMProviderError (shared contract)
//   - No streaming, no tool calling, no structured outputs (v1)

import type {
  LLMProvider,
  LLMRequest,
  LLMResponse,
  LLMUsage,
} from '@curdeeclau/shared';
import { LLMProviderError } from '@curdeeclau/shared';
import pino, { type Logger } from 'pino';

// ── Config ─────────────────────────────────────────────────

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'openai/gpt-4o';
const DEFAULT_TIMEOUT_MS = 30_000;
const RESPONSE_PREVIEW_MAX = 500;

export type OpenRouterAdapterConfig = {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  timeoutMs?: number;
  appReferer?: string;
  appTitle?: string;
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

// ── Adapter ────────────────────────────────────────────────

export class OpenRouterAdapter implements LLMProvider {
  readonly providerId = 'openrouter';

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly timeoutMs: number;
  private readonly appReferer?: string;
  private readonly appTitle?: string;
  private readonly logger: Logger;
  private readonly fetch: HttpFetch;

  constructor(config: OpenRouterAdapterConfig, httpFetch?: HttpFetch) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.defaultModel = config.defaultModel ?? DEFAULT_MODEL;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.appReferer = config.appReferer;
    this.appTitle = config.appTitle;
    this.logger = config.logger ?? pino({ level: process.env.LOG_LEVEL ?? 'info', name: 'openrouter-adapter' });
    this.fetch = httpFetch ?? defaultFetch();
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model ?? this.defaultModel;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      };
      if (this.appReferer) headers['HTTP-Referer'] = this.appReferer;
      if (this.appTitle) headers['X-Title'] = this.appTitle;

      const body = JSON.stringify({
        model,
        messages: request.messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
        ...(request.maxTokens !== undefined ? { max_tokens: request.maxTokens } : {}),
      });

      const url = `${this.baseUrl}/chat/completions`;

      const httpResponse = await this.fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!httpResponse || httpResponse.status >= 400) {
        const statusCode = httpResponse?.status;
        const retryable = statusCode === 429 || statusCode === 503 || statusCode === 502;
        throw new LLMProviderError(
          `OpenRouter HTTP ${statusCode}`,
          this.providerId,
          { statusCode, retryable },
        );
      }

      const data = (await httpResponse.json()) as Record<string, unknown>;

      if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        const preview = JSON.stringify(data).slice(0, RESPONSE_PREVIEW_MAX);
        this.logger.error({ preview }, 'OpenRouter returned unexpected response shape');
        throw new LLMProviderError(
          'OpenRouter returned unexpected response shape',
          this.providerId,
          { retryable: false },
        );
      }

      const choice = data.choices[0] as Record<string, unknown>;
      const content: string = (choice.message as Record<string, unknown>)?.content as string ?? '';

      const usage: LLMUsage | undefined = data.usage
        ? {
            promptTokens: (data.usage as Record<string, number>).prompt_tokens ?? 0,
            completionTokens: (data.usage as Record<string, number>).completion_tokens ?? 0,
            totalTokens: (data.usage as Record<string, number>).total_tokens ?? 0,
          }
        : undefined;

      return {
        text: content,
        model: (data.model as string) ?? model,
        provider: this.providerId,
        usage,
        finishReason: (choice.finish_reason as string) ?? undefined,
        providerMetadata: {
          openrouter_id: data.id,
          openrouter_created: data.created,
        },
      };
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof LLMProviderError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new LLMProviderError(
          `OpenRouter request timed out after ${this.timeoutMs}ms`,
          this.providerId,
          { retryable: true },
        );
      }
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error({ err: message }, 'OpenRouter adapter error');
      throw new LLMProviderError(
        `OpenRouter adapter error: ${message}`,
        this.providerId,
        { retryable: true },
      );
    }
  }
}
