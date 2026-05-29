// ── CRM Engine: Ownership Tests ────────────────────────────

import { describe, it, expect, beforeEach } from 'vitest';
import { CRMEngine } from '../engine/CRMEngine';
import { InMemoryCRMProvider } from '../providers/memory/InMemoryCRMProvider';
import type { CRMEngineContext, ConversationOwner } from '../types';

function makeContext(overrides: Partial<CRMEngineContext> = {}): CRMEngineContext {
  return {
    conversationId: 'conv_test',
    tenantId: 'tnt_test',
    correlationId: 'corr_test',
    actorId: 'usr_test',
    ...overrides,
  };
}

function seedOwnership(engine: CRMEngine, owner: ConversationOwner, conversationId = 'conv_test'): void {
  engine.handleOwnershipChanged({
    conversationId,
    owner,
    previousOwner: null,
    sequence: 1,
    cause: 'system_init',
    changedAt: Date.now(),
  });
}

describe('OwnershipGuard', () => {
  it('should block all write operations under LOCKED ownership (I17)', async () => {
    const provider = new InMemoryCRMProvider();
    const engine = new CRMEngine({ provider });
    await engine.start();
    seedOwnership(engine, 'LOCKED');

    const ctx = makeContext();

    const actions = ['create_contact', 'add_tag', 'create_pipeline', 'create_campaign'];
    for (const action of actions) {
      const result = await engine.execute(action, { ...ctx, name: 'test', tag: 'x' });
      expect(result).toHaveProperty('error', 'OWNERSHIP_LOCKED');
    }
  });

  it('should allow AI to create and update contacts', async () => {
    const provider = new InMemoryCRMProvider();
    const engine = new CRMEngine({ provider });
    await engine.start();
    // AI is the constitutional default — no seed needed

    const ctx = makeContext();

    const created = await engine.execute('create_contact', { ...ctx, name: 'AI Created' });
    expect(created).toHaveProperty('contact');

    const contactId = (created as any).contact.id;
    const updated = await engine.execute('update_contact', {
      ...ctx, contactId, changes: { name: 'AI Updated' },
    });
    expect(updated).toHaveProperty('contact');
  });

  it('should allow AI to add and remove tags (I19)', async () => {
    const provider = new InMemoryCRMProvider();
    const engine = new CRMEngine({ provider });
    await engine.start();

    const ctx = makeContext();

    const created = await engine.execute('create_contact', { ...ctx, name: 'Tagged' });
    const contactId = (created as any).contact.id;

    const added = await engine.execute('add_tag', { ...ctx, contactId, tag: 'vip' });
    expect(added).toHaveProperty('contact');
    expect((added as any).contact.tags).toContain('vip');

    const removed = await engine.execute('remove_tag', { ...ctx, contactId, tag: 'vip' });
    expect(removed).toHaveProperty('contact');
    expect((removed as any).contact.tags).not.toContain('vip');
  });

  it('should block AI from pipeline mutations (I18)', async () => {
    const provider = new InMemoryCRMProvider();
    const engine = new CRMEngine({ provider });
    await engine.start();
    // AI is default — no seed needed

    const pipelineActions = ['create_pipeline', 'create_campaign', 'create_opportunity', 'move_opportunity', 'pause_campaign', 'resume_campaign'];
    for (const action of pipelineActions) {
      const result = await engine.execute(action, {
        ...makeContext(),
        name: 'Test',
        stages: [{ id: 's1', name: 'S1', order: 1 }],
        contactId: 'cnt_x',
        pipelineId: 'pip_x',
        stageId: 's1',
        campaignId: 'cmp_x',
        opportunityId: 'opp_x',
        targetStageId: 's2',
      });
      expect(result).toHaveProperty('error', 'OWNERSHIP_INSUFFICIENT');
    }
  });

  it('should block SHARED from pipeline mutations without approval', async () => {
    const provider = new InMemoryCRMProvider();
    const engine = new CRMEngine({ provider });
    await engine.start();
    seedOwnership(engine, 'SHARED');

    const result = await engine.execute('create_pipeline', {
      ...makeContext(),
      name: 'Test',
      stages: [{ id: 's1', name: 'S1', order: 1 }],
    });

    expect(result).toHaveProperty('error', 'OWNERSHIP_INSUFFICIENT');
  });

  it('should allow HUMAN to perform all operations', async () => {
    const provider = new InMemoryCRMProvider();
    const engine = new CRMEngine({ provider });
    await engine.start();
    seedOwnership(engine, 'HUMAN');

    const ctx = makeContext();

    // Human can create contact
    const c = await engine.execute('create_contact', { ...ctx, name: 'Human Contact' });
    expect(c).toHaveProperty('contact');

    // Human can create pipeline
    const p = await engine.execute('create_pipeline', {
      ...ctx, name: 'Human Pipeline',
      stages: [{ id: 's1', name: 'S1', order: 1 }],
    });
    expect(p).toHaveProperty('pipeline');
  });

  it('should resolve ownership from conversation context', async () => {
    const provider = new InMemoryCRMProvider();
    const engine = new CRMEngine({ provider });
    await engine.start();

    // Seed conversation-specific ownership
    seedOwnership(engine, 'LOCKED', 'conv_locked');
    // conv_ai defaults to 'AI' (no seed needed)

    // AI conversation
    const result = await engine.execute('create_contact', {
      ...makeContext(),
      conversationId: 'conv_ai',
      name: 'Test',
    });
    expect(result).toHaveProperty('contact');

    // LOCKED conversation
    const blocked = await engine.execute('create_contact', {
      ...makeContext(),
      conversationId: 'conv_locked',
      name: 'Test',
    });
    expect(blocked).toHaveProperty('error', 'OWNERSHIP_LOCKED');
  });
});
