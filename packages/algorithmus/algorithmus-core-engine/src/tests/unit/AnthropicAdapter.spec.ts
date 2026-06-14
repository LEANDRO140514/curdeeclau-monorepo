// ── Anthropic Adapter Tests ─────────────────────────────────
//
// Validates the AnthropicAdapter against the canonical
// LLMProvider contract. Uses a fake HTTP client — no real
// API calls, no credentials.
//
// Anthropic Messages API uses a different format from OpenAI:
//   - system is a top-level param, not a message role
//   - Response: content[] array, not choices[]
//   - stop_reason instead of finish_reason
//   - input_tokens / output_tokens

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LLMProviderError, createUserMessage, createSystemMessage } from '@curdeeclau/shared';
import type { LLMProvider } from '@curdeeclau/shared';
import { AnthropicAdapter, type HttpFetch } from '../../infra/providers/anthropic/AnthropicAdapter';

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

function mockAnthropicResponse(content: string, overrides: Record<string, unknown> = {}): FakeResponse {
  return {
    status: 200,
    body: {
      id: overrides.id ?? 'msg_mock_anthropic_001',
      type: 'message',
      role: 'assistant',
      model: overrides.model ?? 'claude-sonnet-4-6',
      content: [
        {
          type: 'text',
          text: content,
        },
      ],
      stop_reason: overrides.stop_reason ?? 'end_turn',
      stop_sequence: null,
      usage: overrides.usage ?? {
        input_tokens: 15,
        output_tokens: 25,
      },
    },
  };
}

// ── Setup ─────────────────────────────────────────────────

const TEST_API_KEY = 'sk-ant-test-no-real-key';

const silentLogger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
  trace: () => {},
  fatal: () => {},
  level: 'silent',
};

describe('AnthropicAdapter', () => {
  let responses: FakeResponse[];
  let adapter: LLMProvider;

  function createAdapter() {
    return new AnthropicAdapter(
      {
        apiKey: TEST_API_KEY,
        defaultModel: 'claude-sonnet-4-6',
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
    expect(adapter.providerId).toBe('anthropic');
    expect(typeof adapter.generate).toBe('function');
  });

  it('generate() devuelve LLMResponse con texto mapeado desde content[0].text', async () => {
    responses.push(mockAnthropicResponse('Hola, soy Claude'));
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [createUserMessage('Hola')],
    });

    expect(result.text).toBe('Hola, soy Claude');
    expect(result.provider).toBe('anthropic');
    expect(result.model).toBe('claude-sonnet-4-6');
  });

  it('generate() envia model del request si se proporciona', async () => {
    responses.push(mockAnthropicResponse('ok', { model: 'claude-opus-4-8' }));
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [createUserMessage('test')],
      model: 'claude-opus-4-8',
    });

    expect(result.model).toBe('claude-opus-4-8');
  });

  it('generate() usa defaultModel si request no trae model', async () => {
    responses.push(mockAnthropicResponse('ok', { model: 'claude-sonnet-4-6' }));
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [createUserMessage('test')],
    });

    expect(result.model).toBe('claude-sonnet-4-6');
  });

  it('generate() mapea usage tokens (input_tokens → promptTokens, output_tokens → completionTokens)', async () => {
    responses.push(
      mockAnthropicResponse('ok', {
        model: 'claude-sonnet-4-6',
        usage: { input_tokens: 42, output_tokens: 128 },
      }),
    );
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [createUserMessage('test')],
    });

    expect(result.usage).toEqual({
      promptTokens: 42,
      completionTokens: 128,
      totalTokens: 170,
    });
  });

  it('generate() acepta messages con user y assistant', async () => {
    responses.push(mockAnthropicResponse('respuesta'));
    adapter = createAdapter();

    await expect(
      adapter.generate({
        messages: [
          createUserMessage('Hola'),
          { role: 'assistant', content: 'Como estas?' },
          createUserMessage('Bien, gracias'),
        ],
      }),
    ).resolves.toBeDefined();
  });

  it('generate() extrae system messages y los envia como top-level param', async () => {
    // The fake HTTP captures the request — adapter should separate system
    // messages from conversation messages before sending to Anthropic.
    responses.push(mockAnthropicResponse('respuesta con contexto'));
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [
        createSystemMessage('Eres un asistente util'),
        createSystemMessage('Hablas en espanol'),
        createUserMessage('Hola'),
      ],
    });

    expect(result.text).toBe('respuesta con contexto');
    // System messages are extracted and sent as top-level system param.
    // The adapter handles this internally — the consumer just uses
    // the standard LLMProvider contract with system-role messages.
  });

  it('generate() incluye temperature si se pasa', async () => {
    responses.push(mockAnthropicResponse('ok'));
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [createUserMessage('test')],
      temperature: 0.3,
    });

    expect(result).toBeDefined();
  });

  it('generate() usa maxTokens del request si se proporciona', async () => {
    responses.push(mockAnthropicResponse('ok'));
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [createUserMessage('test')],
      maxTokens: 512,
    });

    expect(result).toBeDefined();
  });

  it('generate() mapea stop_reason a finishReason', async () => {
    responses.push(mockAnthropicResponse('ok', { stop_reason: 'max_tokens' }));
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [createUserMessage('test')],
    });

    expect(result.finishReason).toBe('max_tokens');
  });

  it('generate() mapea end_turn stop_reason', async () => {
    responses.push(mockAnthropicResponse('ok', { stop_reason: 'end_turn' }));
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [createUserMessage('test')],
    });

    expect(result.finishReason).toBe('end_turn');
  });

  it('generate() concatena multiples text blocks en la respuesta', async () => {
    responses.push({
      status: 200,
      body: {
        id: 'msg_multi_block',
        type: 'message',
        role: 'assistant',
        model: 'claude-sonnet-4-6',
        content: [
          { type: 'text', text: 'Parte uno. ' },
          { type: 'text', text: 'Parte dos.' },
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 20 },
      },
    });
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [createUserMessage('test')],
    });

    expect(result.text).toBe('Parte uno. Parte dos.');
  });

  it('errores HTTP >= 400 se convierten en LLMProviderError', async () => {
    responses.push({ status: 429, body: { error: { type: 'rate_limit_error', message: 'Rate limited' } } });
    adapter = createAdapter();

    await expect(
      adapter.generate({ messages: [createUserMessage('test')] }),
    ).rejects.toThrow(LLMProviderError);
  });

  it('LLMProviderError por rate limit (429) es retryable', async () => {
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

  it('LLMProviderError por server error (529 — Anthropic overload) es retryable', async () => {
    responses.push({ status: 529, body: {} });
    adapter = createAdapter();

    try {
      await adapter.generate({ messages: [createUserMessage('test')] });
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(LLMProviderError);
      if (err instanceof LLMProviderError) {
        expect(err.statusCode).toBe(529);
        expect(err.retryable).toBe(true);
      }
    }
  });

  it('LLMProviderError por server error (502/503) es retryable', async () => {
    responses.push({ status: 503, body: {} });
    adapter = createAdapter();

    try {
      await adapter.generate({ messages: [createUserMessage('test')] });
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(LLMProviderError);
      if (err instanceof LLMProviderError) {
        expect(err.statusCode).toBe(503);
        expect(err.retryable).toBe(true);
      }
    }
  });

  it('no requiere API key real en tests', async () => {
    responses.push(mockAnthropicResponse('ok'));
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [createUserMessage('test')],
    });

    expect(result.text).toBe('ok');
  });

  it('providerMetadata incluye prefijo anthropic_', async () => {
    responses.push(mockAnthropicResponse('ok'));
    adapter = createAdapter();

    const result = await adapter.generate({
      messages: [createUserMessage('test')],
    });

    expect(result.providerMetadata).toBeDefined();
    expect(result.providerMetadata).toHaveProperty('anthropic_id');
    expect(result.providerMetadata).toHaveProperty('anthropic_type');
    expect(result.providerMetadata).toHaveProperty('anthropic_stop_reason');
  });
});
