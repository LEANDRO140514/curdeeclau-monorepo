// ── LLM Factory for Admissions Runners ─────────────────────
//
// Instantiates a real LLMProvider from environment variables
// when available, falls back to mock provider otherwise.
//
// Autoridad: ADR-LLM-2 (OpenRouter-first, not OpenRouter-only)
// Contrato: packages/shared/src/llm/LLMProvider.ts (LLM-1)
//
// Env vars checked (in priority order):
//   OPENAI_API_KEY      → OpenAIAdapter (direct)
//   OPENROUTER_API_KEY  → OpenRouterAdapter (gateway)
//   DEEPSEEK_API_KEY    → DeepSeekAdapter (cheap)
//   ANTHROPIC_API_KEY   → AnthropicAdapter (premium)
//
// If none set → returns null (caller should use mock).

import type { LLMProvider } from '@curdeeclau/shared';
import { OpenRouterAdapter } from '../../infra/providers/openrouter/OpenRouterAdapter';
import { OpenAIAdapter } from '../../infra/providers/openai/OpenAIAdapter';
import { DeepSeekAdapter } from '../../infra/providers/deepseek/DeepSeekAdapter';
import { AnthropicAdapter } from '../../infra/providers/anthropic/AnthropicAdapter';

/** Cached provider instance */
let _cachedProvider: LLMProvider | null = null;
let _initialized = false;

/** Create a real LLM provider from env vars, or null if none configured */
function createRealProvider(): LLMProvider | null {
  // Priority 1: OpenAI direct (key already configured in .env)
  if (process.env.OPENAI_API_KEY) {
    console.log('[llm-factory] Creating OpenAIAdapter (OPENAI_API_KEY)');
    return new OpenAIAdapter({
      apiKey: process.env.OPENAI_API_KEY,
      defaultModel: 'gpt-4o',
    });
  }

  // Priority 2: OpenRouter gateway
  if (process.env.OPENROUTER_API_KEY) {
    console.log('[llm-factory] Creating OpenRouterAdapter (OPENROUTER_API_KEY)');
    return new OpenRouterAdapter({
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultModel: 'openai/gpt-4o',
    });
  }

  // Priority 3: DeepSeek (cheap)
  if (process.env.DEEPSEEK_API_KEY) {
    console.log('[llm-factory] Creating DeepSeekAdapter (DEEPSEEK_API_KEY)');
    return new DeepSeekAdapter({
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
  }

  // Priority 4: Anthropic (premium)
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('[llm-factory] Creating AnthropicAdapter (ANTHROPIC_API_KEY)');
    return new AnthropicAdapter({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  return null;
}

/**
 * Get the LLM provider for admissions runners.
 * Returns real OpenAI/OpenRouter/DeepSeek/Anthropic if configured,
 * otherwise returns null (caller should use a mock).
 */
export function getLLMProvider(): LLMProvider | null {
  if (!_initialized) {
    _cachedProvider = createRealProvider();
    _initialized = true;
  }
  return _cachedProvider;
}

/** Clear the cached provider (for tests) */
export function clearLLMCache(): void {
  _cachedProvider = null;
  _initialized = false;
}
