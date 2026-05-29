// ── CRM Engine: Pipeline Tests ─────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { CRMEngine } from '../engine/CRMEngine';
import { InMemoryCRMProvider } from '../providers/memory/InMemoryCRMProvider';
import type { CRMEngineContext } from '../types';

function makeContext(overrides: Partial<CRMEngineContext> = {}): CRMEngineContext {
  return {
    conversationId: 'conv_test',
    tenantId: 'tnt_test',
    correlationId: 'corr_test',
    actorId: 'usr_test',
    ...overrides,
  };
}

describe('PipelineManager', () => {
  let engine: CRMEngine;
  let provider: InMemoryCRMProvider;

  beforeEach(async () => {
    provider = new InMemoryCRMProvider();
    engine = new CRMEngine({ provider });
    await engine.start();
    engine.handleOwnershipChanged({
      conversationId: 'conv_test', owner: 'HUMAN', previousOwner: null,
      sequence: 1, cause: 'system_init', changedAt: Date.now(),
    });
  });

  it('should create a pipeline with valid stages', async () => {
    const ctx = makeContext();
    const result = await engine.execute('create_pipeline', {
      ...ctx,
      name: 'Ventas Dental',
      stages: [
        { id: 'stage_consulta', name: 'Consulta Inicial', order: 1 },
        { id: 'stage_tratamiento', name: 'Plan de Tratamiento', order: 2 },
        { id: 'stage_cierre', name: 'Cierre', order: 3 },
      ],
    });

    expect(result).toHaveProperty('pipeline');
    const pipeline = (result as any).pipeline;
    expect(pipeline.name).toBe('Ventas Dental');
    expect(pipeline.stages).toHaveLength(3);
    expect(pipeline.id).toMatch(/^pip_/);
    expect(pipeline.active).toBe(true);

    // Event emitted
    const events = engine.getEvents().getEmitted();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('PipelineCreated');
  });

  it('should reject pipeline with zero stages (I5)', async () => {
    const result = await engine.execute('create_pipeline', {
      ...makeContext(),
      name: 'Empty Pipeline',
      stages: [],
    });

    expect(result).toHaveProperty('error', 'INVALID_STAGES');
    expect((result as any).message).toContain('at least 1 stage');
  });

  it('should reject pipeline with duplicate stage orders (I6)', async () => {
    const result = await engine.execute('create_pipeline', {
      ...makeContext(),
      name: 'Duplicate Orders',
      stages: [
        { id: 's1', name: 'Stage 1', order: 1 },
        { id: 's2', name: 'Stage 2', order: 1 },
      ],
    });

    expect(result).toHaveProperty('error', 'INVALID_STAGES');
    expect((result as any).message).toContain('unique');
  });

  it('should reject pipeline with missing stage fields', async () => {
    const result = await engine.execute('create_pipeline', {
      ...makeContext(),
      name: 'Bad Stages',
      stages: [{ name: 'No ID', order: 1 } as any],
    });

    expect(result).toHaveProperty('error', 'INVALID_STAGES');
  });
});
