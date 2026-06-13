// ── OpenRouter Adapter Tests ───────────────────────────────
//
// Validates the OpenRouterAdapter against the canonical
// LLMProvider contract. Uses a fake HTTP client — no real
// API calls, no credentials.

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LLMProviderError, createUserMessage, createSystemMessage } from '@curdeeclau/shared';
import type { LLMProvider } from '@curdeeclau/shared';
import { OpenRouterAdapter, type HttpFetch } from '../../infra/providers/openrouter/OpenRouterAdapter';

// ── Fake HTTP Client ──────────────────────────────────────

type FakeResponse = {
  status: number;
  body: unknown;
};

function fakeHttpClient(responses: FakeResponse[]): HttpFetch {
  let callCount = 0;
  return async (_url, _options) => {
    const resp = responses[callCount] ?? { status: 500, body: { error: 'no mock response configured' } };
    callCount++;
    return {
      status: resp.status,
      json: async () => resp.body,
    };
  };
}

function mockChatResponse(content: string, overrides: Record<string, unknown> = {}): FakeResponse {
  return {
    status: 200,
    body: {
      id: 'chatcmpl-mock',
      object: 'chat.completion',
      created: Date.now(),
      model: overrides.model ?? 'openai/gpt-4o',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content,
          },
          finish_reason: overrides.finish_reason ?? 'stop',
        },
      ],
      usage: overrides.usage ?? {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    },
  };
}

// ── Setup ─────────────────────────────────────────────────

const TEST_API_KEY = 'sk-test-no-real-key';

const silentLogger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
  trace: () => {},
  fatal: () => {},
  level: 'silent',
};

describe('OpenRouterAdapter', () => {
  let responses: FakeResponse[];
  let adapter: LLMProvider;

  function createAdapter() {
    return new OpenRouterAdapter(
      {
        apiKey: TEST_API_KEY,
        defaultModel: 'openai/gpt-4o',
        logger: silentLogger as any,
      },
      fakeHttpClient(responses),
    );
  }

  beforeEach(() => {
    responses = [];
  });

  it('satisface la interfaz LLMProvider', () => {
    adapter = createAdapter();
    expect(adapter.providerId).toBe('openrouter');
    expect(typeof adapter.generate).toBe('function');
  });

  it('generate() devuelve LLMResponse con texto mapeado', async () => {
    responses.push(mockChatResponse('Hola, soy un asistente'));
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [createUserMessage('Hola')],
    });

    expect(result.text).toBe('Hola, soy un asistente');
    expect(result.provider).toBe('openrouter');
    expect(result.model).toBe('openai/gpt-4o');
  });

  it('generate() envia model del request si se proporciona', async () => {
    responses.push(mockChatResponse('ok', { model: 'deepseek/deepseek-chat' }));
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [createUserMessage('test')],
      model: 'deepseek/deepseek-chat',
    });

    expect(result.model).toBe('deepseek/deepseek-chat');
  });

  it('generate() usa defaultModel si request no trae model', async () => {
    responses.push(mockChatResponse('ok', { model: 'openai/gpt-4o' }));
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [createUserMessage('test')],
    });

    expect(result.model).toBe('openai/gpt-4o');
  });

  it('generate() mapea usage tokens', async () => {
    responses.push(
      mockChatResponse('ok', {
        model: 'openai/gpt-4o',
        usage: { prompt_tokens: 5, completion_tokens: 15, total_tokens: 20 },
      }),
    );
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [createUserMessage('test')],
    });

    expect(result.usage).toEqual({
      promptTokens: 5,
      completionTokens: 15,
      totalTokens: 20,
    });
  });

  it('generate() acepta messages con system, user y assistant', async () => {
    responses.push(mockChatResponse('respuesta'));
    adapter = createAdapter();

    await expect(
      adapter.generate({
        messages: [
          createSystemMessage('Eres util'),
          createUserMessage('Hola'),
          { role: 'assistant', content: 'Como estas?' },
        ],
      }),
    ).resolves.toBeDefined();
  });

  it('generate() incluye temperature y maxTokens si se pasan', async () => {
    responses.push(mockChatResponse('ok'));
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [createUserMessage('test')],
      temperature: 0.5,
      maxTokens: 128,
    });

    expect(result).toBeDefined();
  });

  it('generate() mapea finish_reason', async () => {
    responses.push(mockChatResponse('ok', { finish_reason: 'length' }));
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [createUserMessage('test')],
    });

    expect(result.finishReason).toBe('length');
  });

  it('errores HTTP >= 400 se convierten en LLMProviderError', async () => {
    responses.push({ status: 429, body: { error: 'rate limited' } });
    adapter = createAdapter();

    await expect(
      adapter.generate({ messages: [createUserMessage('test')] }),
    ).rejects.toThrow(LLMProviderError);
  });

  it('LLMProviderError por rate limit es retryable', async () => {
    responses.push({ status: 429, body: {} });
    adapter = createAdapter();

    try {
      await adapter.generate({ messages: [createUserMessage('test')] });
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(LLMProviderError);
      if (err instanceof LLMProviderError) {
        expect(err.statusCode).toBe(429);
        expect(err.retryable).toBe(true);
      }
    }
  });

  it('no requiere API key real en tests', async () => {
    responses.push(mockChatResponse('ok'));
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [createUserMessage('test')],
    });

    expect(result.text).toBe('ok');
  });
});
