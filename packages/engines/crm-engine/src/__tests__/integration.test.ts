// ── CRM Engine: Integration Tests ──────────────────────────
//
// End-to-end workflows validating the full engine lifecycle.

import { describe, it, expect, beforeEach } from 'vitest';
import { CRMEngine } from '../engine/CRMEngine';
import { InMemoryCRMProvider } from '../providers/memory/InMemoryCRMProvider';
import type { CRMEngineContext } from '../types';

function makeContext(overrides: Partial<CRMEngineContext> = {}): CRMEngineContext {
  return {
    conversationId: 'conv_integration',
    tenantId: 'tnt_integration',
    correlationId: 'corr_integration',
    actorId: 'usr_integration',
    workflowId: 'wfl_integration',
    ...overrides,
  };
}

function seedOwnership(engine: CRMEngine, owner: 'AI' | 'HUMAN' | 'SHARED' | 'LOCKED', conversationId: string): void {
  engine.handleOwnershipChanged({
    conversationId,
    owner,
    previousOwner: null,
    sequence: 1,
    cause: 'system_init',
    changedAt: Date.now(),
  });
}

describe('CRM Engine Integration', () => {
  let engine: CRMEngine;
  let provider: InMemoryCRMProvider;

  beforeEach(async () => {
    provider = new InMemoryCRMProvider();
    engine = new CRMEngine({ provider });
    await engine.start();
    seedOwnership(engine, 'HUMAN', 'conv_integration');
  });

  it('should execute full contact → opportunity → move pipeline workflow', async () => {
    const ctx = makeContext();

    // 1. Create contact
    const cResult = await engine.execute('create_contact', {
      ...ctx, name: 'Maria Garcia', phone: '+525512345678', email: 'maria@example.com',
    });
    expect(cResult).toHaveProperty('contact');
    const contact = (cResult as any).contact;

    // 2. Create pipeline
    const pResult = await engine.execute('create_pipeline', {
      ...ctx,
      name: 'Ventas',
      stages: [
        { id: 'lead', name: 'Lead', order: 1 },
        { id: 'qualified', name: 'Qualified', order: 2 },
        { id: 'closed', name: 'Closed', order: 3 },
      ],
    });
    const pipeline = (pResult as any).pipeline;

    // 3. Create opportunity
    const oResult = await engine.execute('create_opportunity', {
      ...ctx,
      contactId: contact.id,
      pipelineId: pipeline.id,
      stageId: 'lead',
      value: 25000,
      currency: 'MXN',
    });
    expect(oResult).toHaveProperty('opportunity');
    const opportunity = (oResult as any).opportunity;
    expect(opportunity.status).toBe('open');

    // 4. Move to qualified
    const mResult = await engine.execute('move_opportunity', {
      ...ctx,
      opportunityId: opportunity.id,
      targetStageId: 'qualified',
    });
    expect(mResult).toHaveProperty('opportunity');
    expect((mResult as any).opportunity.stageId).toBe('qualified');

    // 5. Verify event chain
    const events = engine.getEvents().getEmitted();
    expect(events).toHaveLength(4);
    expect(events[0].type).toBe('ContactCreated');
    expect(events[1].type).toBe('PipelineCreated');
    expect(events[2].type).toBe('OpportunityCreated');
    expect(events[3].type).toBe('OpportunityMoved');

    // All events share the same correlationId
    for (const event of events) {
      expect(event.correlationId).toBe('corr_integration');
      expect(event.workflowId).toBe('wfl_integration');
    }
  });

  it('should enforce providerIds separation from canonical id (I1)', async () => {
    const ctx = makeContext();

    const result = await engine.execute('create_contact', { ...ctx, name: 'Provider Test' });
    const contact = (result as any).contact;

    // canonical id uses cnt_ prefix
    expect(contact.id).toMatch(/^cnt_/);
    // providerIds is a separate map
    expect(contact.providerIds).toEqual({});
    // canonical id is NOT in providerIds
    expect(contact.providerIds[contact.id]).toBeUndefined();
  });

  it('should handle tag lifecycle on a contact', async () => {
    const ctx = makeContext();

    // Create contact
    const created = await engine.execute('create_contact', { ...ctx, name: 'Tag Lifecycle' });
    const contactId = (created as any).contact.id;

    // Add tags
    await engine.execute('add_tag', { ...ctx, contactId, tag: 'vip' });
    await engine.execute('add_tag', { ...ctx, contactId, tag: 'dental' });

    // Verify tags
    const tagEvents = engine.getEvents().getEmitted();
    expect(tagEvents).toHaveLength(3);
    expect(tagEvents[0].type).toBe('ContactCreated');
    expect(tagEvents[1].type).toBe('TagAdded');
    expect(tagEvents[2].type).toBe('TagAdded');

    // Remove tag
    engine.getEvents().clear();
    const removed = await engine.execute('remove_tag', { ...ctx, contactId, tag: 'vip' });
    expect((removed as any).contact.tags).toEqual(['dental']);

    // Remove non-existent tag
    const badRemove = await engine.execute('remove_tag', { ...ctx, contactId, tag: 'nonexistent' });
    expect(badRemove).toHaveProperty('error', 'TAG_NOT_FOUND');
  });

  it('should prevent cross-entity reference violations', async () => {
    const ctx = makeContext();

    // Opportunity without contact
    const r1 = await engine.execute('create_opportunity', {
      ...ctx,
      contactId: 'cnt_fake',
      pipelineId: 'pip_fake',
      stageId: 's1',
    });
    expect(r1).toHaveProperty('error', 'CONTACT_NOT_FOUND');

    // Move non-existent opportunity
    const r2 = await engine.execute('move_opportunity', {
      ...ctx,
      opportunityId: 'opp_fake',
      targetStageId: 's1',
    });
    expect(r2).toHaveProperty('error', 'OPPORTUNITY_NOT_FOUND');

    // Pause non-existent campaign
    const r3 = await engine.execute('pause_campaign', { ...ctx, campaignId: 'cmp_fake' });
    expect(r3).toHaveProperty('error', 'CAMPAIGN_NOT_FOUND');
  });

  it('should distinguish between conversations via ownership view', async () => {
    const provider = new InMemoryCRMProvider();
    const engine = new CRMEngine({ provider });
    await engine.start();

    // Seed conversation-specific ownership
    // conv_a → AI (default, no seed needed)
    seedOwnership(engine, 'HUMAN', 'conv_b');
    seedOwnership(engine, 'LOCKED', 'conv_c');

    const ctxA = makeContext({ conversationId: 'conv_a' });
    const ctxB = makeContext({ conversationId: 'conv_b' });
    const ctxC = makeContext({ conversationId: 'conv_c' });

    // Conv A (AI): can create contacts
    const rA = await engine.execute('create_contact', { ...ctxA, name: 'A' });
    expect(rA).toHaveProperty('contact');

    // Conv A (AI): cannot create pipeline
    const rA2 = await engine.execute('create_pipeline', {
      ...ctxA, name: 'Test',
      stages: [{ id: 's1', name: 'S1', order: 1 }],
    });
    expect(rA2).toHaveProperty('error', 'OWNERSHIP_INSUFFICIENT');

    // Conv B (HUMAN): can create pipeline
    const rB = await engine.execute('create_pipeline', {
      ...ctxB, name: 'Test',
      stages: [{ id: 's1', name: 'S1', order: 1 }],
    });
    expect(rB).toHaveProperty('pipeline');

    // Conv C (LOCKED): blocked everywhere
    const rC = await engine.execute('create_contact', { ...ctxC, name: 'C' });
    expect(rC).toHaveProperty('error', 'OWNERSHIP_LOCKED');
  });
});
