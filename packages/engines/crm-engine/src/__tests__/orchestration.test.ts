// ── CRM Engine: Orchestration Tests ────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { CRMEngine } from '../engine/CRMEngine';
import { InMemoryCRMProvider } from '../providers/memory/InMemoryCRMProvider';
import type { CRMEngineContext, CRMError } from '../types';
import { isCRMError } from '../types';

function seedOwnership(engine: CRMEngine, owner: 'AI' | 'HUMAN' | 'SHARED' | 'LOCKED', conversationId = 'conv_test'): void {
  engine.handleOwnershipChanged({
    conversationId,
    owner,
    previousOwner: null,
    sequence: 1,
    cause: 'system_init',
    changedAt: Date.now(),
  });
}

describe('CRMEngine Orchestration', () => {
  let engine: CRMEngine;
  let provider: InMemoryCRMProvider;

  beforeEach(async () => {
    provider = new InMemoryCRMProvider();
    engine = new CRMEngine({ provider });
    await engine.start();
    seedOwnership(engine, 'HUMAN');
  });

  it('should implement Engine contract with engineName', () => {
    expect(engine.engineName).toBe('crm-engine');
  });

  it('should implement execute(action, context) returning Record<string, unknown>', async () => {
    const result = await engine.execute('create_contact', {
      ...{} as CRMEngineContext,
      name: 'Engine Contract Test',
    });
    expect(typeof result).toBe('object');
  });

  it('should return CRMError for unknown actions', async () => {
    const result = await engine.execute('unknown_action', {});
    expect(isCRMError(result)).toBe(true);
    expect((result as unknown as CRMError).error).toBe('VALIDATION_ERROR');
  });

  it('should carry correlationId and causationId on events (I21, I22)', async () => {
    const ctx: CRMEngineContext = {
      conversationId: 'conv_123',
      tenantId: 'tnt_abc',
      correlationId: 'corr_xyz',
      causationId: 'cause_prev_event',
      actorId: 'usr_test',
      workflowId: 'wfl_main',
    };

    const result = await engine.execute('create_contact', { ...ctx, name: 'Event Context Test' });
    expect(result).toHaveProperty('contact');

    const events = engine.getEvents().getEmitted();
    expect(events).toHaveLength(1);
    const event = events[0];

    expect(event.correlationId).toBe('corr_xyz');
    expect(event.causationId).toBe('cause_prev_event');
    expect(event.actorId).toBe('usr_test');
    expect(event.workflowId).toBe('wfl_main');
    expect(event.tenantId).toBe('tnt_abc');
    expect(event.conversationId).toBe('conv_123');
  });

  it('should emit exactly one event per mutation', async () => {
    engine.getEvents().clear();
    expect(engine.getEvents().getEmitted()).toHaveLength(0);

    await engine.execute('create_contact', { ...{} as CRMEngineContext, name: 'Single Event' });
    expect(engine.getEvents().getEmitted()).toHaveLength(1);

    await engine.execute('add_tag', {
      ...{} as CRMEngineContext,
      contactId: (engine.getEvents().getEmitted()[0].payload as any).contact.id,
      tag: 'test',
    });
    expect(engine.getEvents().getEmitted()).toHaveLength(2);
  });

  it('should not emit events on failed operations', async () => {
    engine.getEvents().clear();

    await engine.execute('create_contact', { ...{} as CRMEngineContext }); // Missing name = validation error
    expect(engine.getEvents().getEmitted()).toHaveLength(0);

    await engine.execute('update_contact', {
      ...{} as CRMEngineContext,
      contactId: 'cnt_nonexistent',
      changes: { name: 'No' },
    });
    expect(engine.getEvents().getEmitted()).toHaveLength(0);
  });

  it('should support external event handlers', async () => {
    const received: string[] = [];
    engine.getEvents().onEvent((event) => {
      received.push(event.type);
    });

    await engine.execute('create_contact', { ...{} as CRMEngineContext, name: 'Handler Test' });
    await engine.execute('add_tag', {
      ...{} as CRMEngineContext,
      contactId: (engine.getEvents().getEmitted()[0].payload as any).contact.id,
      tag: 'handler',
    });

    expect(received).toEqual(['ContactCreated', 'TagAdded']);
  });

  it('should reject execute() before start()', async () => {
    const cold = new CRMEngine({ provider: new InMemoryCRMProvider() });
    const result = await cold.execute('create_contact', { name: 'Test' });
    expect(result).toHaveProperty('error', 'engine_not_ready');
  });

  it('should transition lifecycle states correctly', async () => {
    const e = new CRMEngine({ provider: new InMemoryCRMProvider() });
    expect(e.lifecycleState).toBe('UNINITIALIZED');

    await e.start();
    expect(e.lifecycleState).toBe('READY');

    await e.stop();
    expect(e.lifecycleState).toBe('STOPPED');

    // stop() is idempotent
    await e.stop();
    expect(e.lifecycleState).toBe('STOPPED');
  });
});
