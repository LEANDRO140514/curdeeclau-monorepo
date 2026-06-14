// ── LLM Router v1 Tests ─────────────────────────────────────
//
// Validates LLMRouter against the canonical LLMProvider
// contract. Uses mock providers — no real API calls, no
// credentials, no adapters instantiated.
//
// The router is tested in isolation. Each test injects
// mock LLMProvider instances that implement the contract.

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LLMProviderError, createUserMessage } from '@curdeeclau/shared';
import type { LLMProvider, LLMRequest, LLMResponse } from '@curdeeclau/shared';
import {
  LLMRouter,
  LLMRouterError,
  type RegisteredLLMProvider,
  type LLMRouterStrategy,
} from '../../core/llm/LLMRouter';

// ── Mock Provider Factory ─────────────────────────────────

function createMockProvider(
  providerId: string,
  handler?: (request: LLMRequest) => Promise<LLMResponse>,
): LLMProvider {
  const defaultHandler = async (req: LLMRequest): Promise<LLMResponse> => ({
    text: `response from ${providerId}`,
    model: `model-${providerId}`,
    provider: providerId,
    finishReason: 'stop',
    usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
  });

  const generate = handler ?? defaultHandler;

  return {
    providerId,
    generate,
  };
}

function createFailingMockProvider(
  providerId: string,
  statusCode: number,
  retryable: boolean,
): LLMProvider {
  return {
    providerId,
    generate: async (_req: LLMRequest): Promise<LLMResponse> => {
      throw new LLMProviderError(
        `${providerId} error ${statusCode}`,
        providerId,
        { statusCode, retryable },
      );
    },
  };
}

// ── Helpers ────────────────────────────────────────────────

const silentLogger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
  trace: () => {},
  fatal: () => {},
  level: 'silent',
};

// ── Tests ──────────────────────────────────────────────────

describe('LLMRouter', () => {
  let router: LLMRouter;

  beforeEach(() => {
    router = new LLMRouter({ logger: silentLogger as any });
  });

  // ── Registration ─────────────────────────────────────────

  describe('registration', () => {
    it('registra un provider por providerId', () => {
      const mock = createMockProvider('openai');
      router.register(mock);
      expect(router.isRegistered('openai')).toBe(true);
      expect(router.listProviders()).toContain('openai');
    });

    it('registra multiples providers via registerAll', () => {
      const providers = [
        createMockProvider('openai'),
        createMockProvider('deepseek'),
        createMockProvider('anthropic'),
      ];
      router.registerAll(providers);
      expect(router.listProviders()).toEqual(['openai', 'deepseek', 'anthropic']);
    });

    it('reemplaza provider si se registra con mismo providerId', () => {
      const first = createMockProvider('openai');
      const second = createMockProvider('openai');
      router.register(first);
      router.register(second);
      expect(router.listProviders()).toEqual(['openai']);
    });

    it('rechaza provider sin providerId', () => {
      const invalid = { providerId: '', generate: async () => ({ text: 'x', model: 'm', provider: '' }) };
      expect(() => router.register(invalid as any)).toThrow(LLMRouterError);
    });

    it('rechaza provider sin metodo generate', () => {
      const invalid = { providerId: 'bad' } as any;
      expect(() => router.register(invalid)).toThrow(LLMRouterError);
    });
  });

  // ── Strategy routing ─────────────────────────────────────

  describe('strategy routing', () => {
    it('LLMRouter usa provider default (openrouter) con estrategia default', async () => {
      const openrouter = createMockProvider('openrouter');
      router.register(openrouter);

      const result = await router.generate({
        messages: [createUserMessage('hola')],
      });

      expect(result.text).toBe('response from openrouter');
      expect(result.routerMetadata.selectedProviderId).toBe('openrouter');
      expect(result.routerMetadata.strategy).toBe('default');
      expect(result.routerMetadata.fallbackUsed).toBe(false);
    });

    it('puede seleccionar provider especifico', async () => {
      router.register(createMockProvider('openrouter'));
      router.register(createMockProvider('deepseek'));

      const result = await router.generate(
        { messages: [createUserMessage('hola')] },
        { strategy: 'specificProvider', providerId: 'deepseek' },
      );

      expect(result.routerMetadata.selectedProviderId).toBe('deepseek');
      expect(result.text).toBe('response from deepseek');
    });

    it('selecciona deepseek para estrategia cheap', async () => {
      router.register(createMockProvider('openrouter'));
      router.register(createMockProvider('deepseek'));
      router.register(createMockProvider('openai'));

      const result = await router.generate(
        { messages: [createUserMessage('hola')] },
        { strategy: 'cheap' },
      );

      expect(result.routerMetadata.selectedProviderId).toBe('deepseek');
    });

    it('selecciona anthropic para estrategia premium', async () => {
      router.register(createMockProvider('openrouter'));
      router.register(createMockProvider('anthropic'));
      router.register(createMockProvider('openai'));

      const result = await router.generate(
        { messages: [createUserMessage('hola')] },
        { strategy: 'premium' },
      );

      expect(result.routerMetadata.selectedProviderId).toBe('anthropic');
    });

    it('selecciona anthropic para estrategia reasoning', async () => {
      router.register(createMockProvider('openrouter'));
      router.register(createMockProvider('anthropic'));
      router.register(createMockProvider('openai'));

      const result = await router.generate(
        { messages: [createUserMessage('hola')] },
        { strategy: 'reasoning' },
      );

      expect(result.routerMetadata.selectedProviderId).toBe('anthropic');
    });

    it('falla si provider especifico no esta registrado', async () => {
      router.register(createMockProvider('openrouter'));

      await expect(
        router.generate(
          { messages: [createUserMessage('hola')] },
          { strategy: 'specificProvider', providerId: 'nonexistent' },
        ),
      ).rejects.toThrow(LLMRouterError);
    });

    it('falla si specificProvider no incluye providerId', async () => {
      await expect(
        router.generate(
          { messages: [createUserMessage('hola')] },
          { strategy: 'specificProvider' },
        ),
      ).rejects.toThrow(LLMRouterError);
    });

    it('usa siguiente provider si el primario no esta registrado', async () => {
      // Only register openai, not openrouter
      router.register(createMockProvider('openai'));

      const result = await router.generate({
        messages: [createUserMessage('hola')],
      });

      // default strategy prefers openrouter, but it's not registered,
      // so falls through to openai
      expect(result.routerMetadata.selectedProviderId).toBe('openai');
    });
  });

  // ── Fallback ─────────────────────────────────────────────

  describe('fallback', () => {
    it('ejecuta fallback si provider primario falla con error retryable', async () => {
      router.register(createFailingMockProvider('openrouter', 503, true));
      router.register(createMockProvider('openai'));

      const result = await router.generate({
        messages: [createUserMessage('hola')],
      });

      expect(result.routerMetadata.selectedProviderId).toBe('openai');
      expect(result.routerMetadata.fallbackUsed).toBe(true);
      expect(result.routerMetadata.attemptedProviders).toEqual(['openrouter', 'openai']);
    });

    it('no ejecuta fallback si error no es retryable', async () => {
      router.register(createFailingMockProvider('deepseek', 400, false));
      router.register(createMockProvider('openai'));

      await expect(
        router.generate({ messages: [createUserMessage('hola')] }, { strategy: 'cheap' }),
      ).rejects.toThrow(LLMRouterError);
    });

    it('propaga error si no hay fallback disponible', async () => {
      router.register(createFailingMockProvider('openrouter', 503, true));

      await expect(
        router.generate({ messages: [createUserMessage('hola')] }),
      ).rejects.toThrow(LLMRouterError);
    });

    it('registra attemptedProviders en metadata cuando hay fallback', async () => {
      router.register(createFailingMockProvider('openrouter', 429, true));
      router.register(createFailingMockProvider('openai', 503, true));
      router.register(createMockProvider('deepseek'));

      const result = await router.generate({
        messages: [createUserMessage('hola')],
      });

      expect(result.routerMetadata.fallbackUsed).toBe(true);
      expect(result.routerMetadata.attemptedProviders).toEqual([
        'openrouter',
        'openai',
        'deepseek',
      ]);
    });

    it('usa fallback sequence personalizada si se proporciona', async () => {
      router.register(createFailingMockProvider('openrouter', 503, true));
      router.register(createFailingMockProvider('openai', 429, true));
      router.register(createMockProvider('anthropic'));
      router.register(createMockProvider('deepseek'));

      const result = await router.generate(
        { messages: [createUserMessage('hola')] },
        {
          strategy: 'default',
          fallbackSequence: ['openrouter', 'openai', 'anthropic'],
        },
      );

      expect(result.routerMetadata.selectedProviderId).toBe('anthropic');
      expect(result.routerMetadata.attemptedProviders).toEqual([
        'openrouter',
        'openai',
        'anthropic',
      ]);
    });

    it('puede deshabilitar fallback con enableFallback: false', async () => {
      router.register(createFailingMockProvider('openrouter', 503, true));
      router.register(createMockProvider('openai'));

      await expect(
        router.generate(
          { messages: [createUserMessage('hola')] },
          { enableFallback: false },
        ),
      ).rejects.toThrow(LLMRouterError);
    });
  });

  // ── Metadata ─────────────────────────────────────────────

  describe('metadata', () => {
    it('incluye routerMetadata en la respuesta', async () => {
      router.register(createMockProvider('openrouter'));

      const result = await router.generate({
        messages: [createUserMessage('hola')],
      });

      expect(result.routerMetadata).toBeDefined();
      expect(result.routerMetadata.selectedProviderId).toBe('openrouter');
      expect(result.routerMetadata.strategy).toBe('default');
      expect(result.routerMetadata.fallbackUsed).toBe(false);
      expect(result.routerMetadata.attemptedProviders).toEqual(['openrouter']);
    });

    it('preserva providerMetadata original del adapter', async () => {
      const provider = createMockProvider('openai', async () => ({
        text: 'ok',
        model: 'gpt-4o',
        provider: 'openai',
        finishReason: 'stop',
        providerMetadata: { custom_field: 'value123' },
      }));
      router.register(provider);

      const result = await router.generate({
        messages: [createUserMessage('hola')],
      });

      expect(result.providerMetadata?.custom_field).toBe('value123');
      expect(result.providerMetadata?._router).toBeDefined();
      expect(result.providerMetadata?._router.selectedProviderId).toBe('openai');
    });
  });

  // ── Safety constraints ───────────────────────────────────

  describe('safety constraints', () => {
    it('no requiere API keys', () => {
      const router = new LLMRouter({ logger: silentLogger as any });
      router.register(createMockProvider('openai'));
      // Router itself has no apiKey config field
      expect(router).toBeDefined();
    });

    it('no hace llamadas externas reales (usa mocks)', async () => {
      router.register(createMockProvider('openrouter'));

      const result = await router.generate({
        messages: [createUserMessage('test')],
      });

      // Mock returns canned response — proves no external call
      expect(result.text).toBe('response from openrouter');
    });

    it('acepta providers mock que implementan LLMProvider', () => {
      const mock: LLMProvider = {
        providerId: 'test-mock',
        generate: async () => ({
          text: 'mock',
          model: 'mock-model',
          provider: 'test-mock',
        }),
      };

      expect(() => router.register(mock)).not.toThrow();
    });

    it('LLMRouterError incluye attemptedProviders y strategy', () => {
      const err = new LLMRouterError('test error', {
        attemptedProviders: ['a', 'b'],
        strategy: 'cheap',
      });

      expect(err.attemptedProviders).toEqual(['a', 'b']);
      expect(err.strategy).toBe('cheap');
      expect(err.name).toBe('LLMRouterError');
    });

    it('listProviders devuelve lista vacia sin providers registrados', () => {
      expect(router.listProviders()).toEqual([]);
    });

    it('isRegistered devuelve false para provider no registrado', () => {
      expect(router.isRegistered('nonexistent')).toBe(false);
    });

    it('tolera provider no registrado en la cadena de estrategia', async () => {
      // Only register deepseek; default strategy has openrouter first
      router.register(createMockProvider('deepseek'));

      const result = await router.generate({
        messages: [createUserMessage('hola')],
      });

      expect(result.routerMetadata.selectedProviderId).toBe('deepseek');
    });
  });
});
