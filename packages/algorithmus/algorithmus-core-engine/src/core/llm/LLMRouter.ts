// ── LLM Router v1 ──────────────────────────────────────────
//
// Internal provider-agnostic routing layer for LLM model
// selection across registered LLMProvider adapters.
//
// Authority: ADR-LLM-2 — OpenRouter-first, not OpenRouter-only
// Contract: packages/shared/src/llm/LLMProvider.ts (LLM-1)
//
// LLMRouter is the INTERNAL authority for provider selection.
// It does NOT:
//   - Call external APIs directly
//   - Replace LLMProvider (it wraps it)
//   - Replace individual adapters
//   - Read environment variables
//   - Manage API keys or credentials
//   - Implement streaming, tool calling, or structured outputs
//   - Route embeddings (EmbeddingProvider is separate)
//
// Design principles:
//   - Providers are injected (testable with mocks)
//   - Strategy-based selection (simple enum, no scoring engine)
//   - Fallback on retryable errors
//   - Provider-agnostic metadata in response
//   - No vendor-specific logic

import type { LLMProvider, LLMRequest, LLMResponse } from '@curdeeclau/shared';
import { LLMProviderError } from '@curdeeclau/shared';
import pino, { type Logger } from 'pino';

// ── Types ──────────────────────────────────────────────────

/** Pre-registered provider entry with its adapter instance */
export interface RegisteredLLMProvider {
  providerId: string;
  provider: LLMProvider;
}

/** Routing strategies available in v1 */
export type LLMRouterStrategy =
  | 'default'
  | 'cheap'
  | 'premium'
  | 'reasoning'
  | 'specificProvider';

/** Options passed to generate() to control routing */
export interface LLMRouterOptions {
  /** Strategy for provider selection */
  strategy?: LLMRouterStrategy;
  /** Explicit providerId when strategy is 'specificProvider' */
  providerId?: string;
  /** Enable fallback to next provider on retryable errors */
  enableFallback?: boolean;
  /** Custom fallback sequence (providerIds). Overrides strategy defaults. */
  fallbackSequence?: string[];
}

/** Extended response metadata injected by the router */
export interface LLMRouterMetadata {
  selectedProviderId: string;
  fallbackUsed: boolean;
  attemptedProviders: string[];
  strategy: LLMRouterStrategy;
}

/** Configuration for LLMRouter */
export type LLMRouterConfig = {
  /** Routing strategy defaults — maps strategy to preferred providerIds */
  strategyDefaults?: Partial<Record<LLMRouterStrategy, string[]>>;
  /** Logger instance */
  logger?: Logger;
};

// ── Constants ──────────────────────────────────────────────

const DEFAULT_STRATEGY_MAP: Record<LLMRouterStrategy, string[]> = {
  default: ['openrouter', 'openai', 'deepseek', 'anthropic'],
  cheap: ['deepseek', 'openrouter', 'openai', 'anthropic'],
  premium: ['anthropic', 'openai', 'openrouter', 'deepseek'],
  reasoning: ['anthropic', 'openai', 'openrouter', 'deepseek'],
  specificProvider: [], // filled at runtime
};

const DEFAULT_STRATEGY: LLMRouterStrategy = 'default';

// ── Router Error ───────────────────────────────────────────

export class LLMRouterError extends Error {
  attemptedProviders: string[];
  strategy: LLMRouterStrategy;
  lastError?: LLMProviderError;

  constructor(
    message: string,
    opts: {
      attemptedProviders: string[];
      strategy: LLMRouterStrategy;
      lastError?: LLMProviderError;
    },
  ) {
    super(message);
    this.name = 'LLMRouterError';
    this.attemptedProviders = opts.attemptedProviders;
    this.strategy = opts.strategy;
    this.lastError = opts.lastError;
  }
}

// ── Router ─────────────────────────────────────────────────

export class LLMRouter {
  private readonly providers: Map<string, LLMProvider>;
  private readonly strategyMap: Record<LLMRouterStrategy, string[]>;
  private readonly logger: Logger;

  constructor(config?: LLMRouterConfig) {
    this.providers = new Map();
    this.strategyMap = {
      ...DEFAULT_STRATEGY_MAP,
      ...config?.strategyDefaults,
    };
    this.logger = config?.logger ?? pino({ level: process.env.LOG_LEVEL ?? 'info', name: 'llm-router' });
  }

  // ── Provider registration ───────────────────────────────

  /** Register a provider adapter under its providerId */
  register(provider: LLMProvider): void {
    if (!provider.providerId || typeof provider.providerId !== 'string') {
      throw new LLMRouterError(
        'Provider must have a valid providerId',
        { attemptedProviders: [], strategy: 'specificProvider' },
      );
    }

    if (typeof provider.generate !== 'function') {
      throw new LLMRouterError(
        `Provider '${provider.providerId}' does not implement generate()`,
        { attemptedProviders: [provider.providerId], strategy: 'specificProvider' },
      );
    }

    const existing = this.providers.get(provider.providerId);
    if (existing) {
      this.logger.warn({ providerId: provider.providerId }, 'Replacing previously registered provider');
    }

    this.providers.set(provider.providerId, provider);
    this.logger.info({ providerId: provider.providerId }, 'Provider registered');
  }

  /** Register multiple providers at once */
  registerAll(providers: LLMProvider[]): void {
    for (const p of providers) {
      this.register(p);
    }
  }

  /** Check if a provider is registered */
  isRegistered(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  /** List all registered provider IDs */
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  // ── Routing ──────────────────────────────────────────────

  /**
   * Generate a completion by routing to the appropriate provider
   * based on the selected strategy.
   */
  async generate(
    request: LLMRequest,
    options?: LLMRouterOptions,
  ): Promise<LLMResponse & { routerMetadata: LLMRouterMetadata }> {
    const strategy = options?.strategy ?? DEFAULT_STRATEGY;
    const enableFallback = options?.enableFallback ?? true;

    // Resolve ordered provider list
    let orderedProviderIds: string[];

    if (strategy === 'specificProvider') {
      if (!options?.providerId) {
        throw new LLMRouterError(
          'strategy "specificProvider" requires providerId in options',
          { attemptedProviders: [], strategy },
        );
      }
      orderedProviderIds = [options.providerId];
    } else if (options?.fallbackSequence && options.fallbackSequence.length > 0) {
      orderedProviderIds = options.fallbackSequence;
    } else {
      orderedProviderIds = this.strategyMap[strategy] ?? this.strategyMap.default;
    }

    // Filter to registered providers only
    const available = orderedProviderIds.filter((id) => this.providers.has(id));

    if (available.length === 0) {
      const registered = this.listProviders();
      throw new LLMRouterError(
        `No registered providers match strategy '${strategy}'. ` +
        `Requested: [${orderedProviderIds.join(', ')}]. ` +
        `Registered: [${registered.join(', ')}]`,
        { attemptedProviders: [], strategy },
      );
    }

    const attemptedProviders: string[] = [];
    let lastError: LLMProviderError | undefined;

    for (const providerId of available) {
      attemptedProviders.push(providerId);
      const provider = this.providers.get(providerId)!;

      try {
        const response = await provider.generate(request);

        // Attach router metadata
        const routerMetadata: LLMRouterMetadata = {
          selectedProviderId: providerId,
          fallbackUsed: attemptedProviders.length > 1,
          attemptedProviders: [...attemptedProviders],
          strategy,
        };

        return {
          ...response,
          routerMetadata,
          providerMetadata: {
            ...response.providerMetadata,
            _router: routerMetadata,
          },
        } as LLMResponse & { routerMetadata: LLMRouterMetadata };
      } catch (err: unknown) {
        const isRetryable =
          err instanceof LLMProviderError ? (err as LLMProviderError).retryable : false;

        if (err instanceof LLMProviderError) {
          lastError = err;
        } else if (err instanceof Error) {
          lastError = new LLMProviderError(err.message, providerId, { retryable: false });
        } else {
          lastError = new LLMProviderError(String(err), providerId, { retryable: false });
        }

        this.logger.warn(
          {
            providerId,
            strategy,
            attempt: attemptedProviders.length,
            retryable: isRetryable,
            error: lastError.message,
          },
          `Provider '${providerId}' failed`,
        );

        // Stop fallback chain if:
        // 1. Fallback is disabled entirely, OR
        // 2. Error is non-retryable (don't retry known-bad requests)
        if (!enableFallback) {
          this.logger.info({ providerId, strategy }, 'Fallback disabled, stopping');
          break;
        }

        if (!isRetryable) {
          this.logger.info({ providerId, strategy }, 'Non-retryable error, stopping fallback chain');
          break;
        }

        // Continue to next provider in the fallback chain
      }
    }

    // All providers exhausted
    throw new LLMRouterError(
      `All providers exhausted for strategy '${strategy}'. ` +
      `Attempted: [${attemptedProviders.join(', ')}]. ` +
      `Last error: ${lastError?.message ?? 'unknown'}`,
      {
        attemptedProviders,
        strategy,
        lastError,
      },
    );
  }
}
