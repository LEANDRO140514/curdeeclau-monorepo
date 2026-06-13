// ── LLM Contract Tests ─────────────────────────────────────
//
// These tests validate that the canonical LLMProvider and
// EmbeddingProvider contracts are structurally correct and
// mockable. They do not connect to any external API.

import { describe, it, expect } from 'vitest';
import {
  LLMProviderError,
  createUserMessage,
  createSystemMessage,
  createAssistantMessage,
} from '../llm/LLMProvider';
import type { LLMProvider, LLMRequest, LLMResponse } from '../llm/LLMProvider';
import {
  EmbeddingProviderError,
} from '../llm/EmbeddingProvider';
import type { EmbeddingProvider, EmbeddingRequest, EmbeddingResponse, EmbeddingBatchRequest, EmbeddingBatchResponse } from '../llm/EmbeddingProvider';

// ── Mock LLMProvider ──────────────────────────────────────

class MockLLMProvider implements LLMProvider {
  readonly providerId = 'mock';

  async generate(_request: LLMRequest): Promise<LLMResponse> {
    return {
      text: 'mock response',
      model: 'mock-model',
      provider: 'mock',
    };
  }
}

// ── Mock EmbeddingProvider ────────────────────────────────

class MockEmbeddingProvider implements EmbeddingProvider {
  readonly providerId = 'mock';

  async embedText(_request: EmbeddingRequest): Promise<EmbeddingResponse> {
    return {
      provider: 'mock',
      model: 'mock-model',
      vector: { index: 0, embedding: [0.1, 0.2], tokensUsed: 3 },
    };
  }

  async embedBatch(request: EmbeddingBatchRequest): Promise<EmbeddingBatchResponse> {
    return {
      provider: 'mock',
      model: 'mock-model',
      vectors: request.inputs.map((_, i) => ({
        index: i,
        embedding: [0.1, 0.2],
        tokensUsed: 2,
      })),
      totalTokensUsed: request.inputs.length * 2,
    };
  }
}

// ── Tests ─────────────────────────────────────────────────

describe('LLMProvider contract', () => {
  it('mock provider satisfies LLMProvider interface', async () => {
    const provider = new MockLLMProvider();
    const response = await provider.generate({
      messages: [
        createUserMessage('Hola'),
      ],
    });

    expect(response.text).toBe('mock response');
    expect(response.model).toBe('mock-model');
    expect(response.provider).toBe('mock');
  });

  it('LLMProviderError carries provider metadata', () => {
    const err = new LLMProviderError('timeout', 'test-provider', {
      statusCode: 429,
      retryable: true,
    });

    expect(err).toBeInstanceOf(Error);
    expect(err.providerId).toBe('test-provider');
    expect(err.statusCode).toBe(429);
    expect(err.retryable).toBe(true);
    expect(err.name).toBe('LLMProviderError');
  });

  it('createUserMessage returns correct shape', () => {
    const msg = createUserMessage('Hola');
    expect(msg).toEqual({ role: 'user', content: 'Hola' });
  });

  it('createSystemMessage returns correct shape', () => {
    const msg = createSystemMessage('Eres util');
    expect(msg).toEqual({ role: 'system', content: 'Eres util' });
  });

  it('createAssistantMessage returns correct shape', () => {
    const msg = createAssistantMessage('Claro');
    expect(msg).toEqual({ role: 'assistant', content: 'Claro' });
  });

  it('LLMRequest accepts temperature, maxTokens, model', () => {
    const request: LLMRequest = {
      messages: [createUserMessage('test')],
      model: 'mock-model',
      temperature: 0.7,
      maxTokens: 256,
      metadata: { tenantId: 'ten_123', traceId: 'trace_abc' },
    };

    expect(request.model).toBe('mock-model');
    expect(request.temperature).toBe(0.7);
    expect(request.maxTokens).toBe(256);
    expect(request.metadata?.tenantId).toBe('ten_123');
  });
});

describe('EmbeddingProvider contract', () => {
  it('mock embedText satisfies EmbeddingProvider interface', async () => {
    const provider = new MockEmbeddingProvider();
    const response = await provider.embedText({ input: 'test text' });

    expect(response.provider).toBe('mock');
    expect(response.model).toBe('mock-model');
    expect(response.vector.embedding).toEqual([0.1, 0.2]);
  });

  it('mock embedBatch satisfies EmbeddingProvider interface', async () => {
    const provider = new MockEmbeddingProvider();
    const response = await provider.embedBatch({ inputs: ['a', 'b'] });

    expect(response.vectors).toHaveLength(2);
    expect(response.vectors[0].index).toBe(0);
    expect(response.vectors[1].index).toBe(1);
    expect(response.totalTokensUsed).toBe(4);
  });

 it('EmbeddingProviderError carries provider metadata', () => {
    const err = new EmbeddingProviderError('dimension error', 'test-provider', {
      statusCode: 400,
      retryable: false,
    });

    expect(err).toBeInstanceOf(Error);
    expect(err.providerId).toBe('test-provider');
    expect(err.statusCode).toBe(400);
    expect(err.retryable).toBe(false);
  });
});
