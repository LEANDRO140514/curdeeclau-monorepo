// ── CRM Engine: Opportunity Tests ──────────────────────────

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

async function setupEngine() {
  const provider = new InMemoryCRMProvider();
  const engine = new CRMEngine({ provider });
  await engine.start();
  engine.handleOwnershipChanged({
    conversationId: 'conv_test', owner: 'HUMAN', previousOwner: null,
    sequence: 1, cause: 'system_init', changedAt: Date.now(),
  });

  const ctx = makeContext();

  // Create contact
  const c = await engine.execute('create_contact', { ...ctx, name: 'Juan Pérez' });
  const contactId = (c as any).contact.id;

  // Create pipeline
  const p = await engine.execute('create_pipeline', {
    ...ctx,
    name: 'Pipeline',
    stages: [
      { id: 'stage_1', name: 'Stage 1', order: 1 },
      { id: 'stage_2', name: 'Stage 2', order: 2 },
    ],
  });
  const pipelineId = (p as any).pipeline.id;

  engine.getEvents().clear();
  return { engine, provider, ctx, contactId, pipelineId };
}

describe('OpportunityManager', () => {
  it('should create an opportunity and emit OpportunityCreated', async () => {
    const { engine, ctx, contactId, pipelineId } = await setupEngine();

    const result = await engine.execute('create_opportunity', {
      ...ctx,
      contactId,
      pipelineId,
      stageId: 'stage_1',
      value: 15000,
      currency: 'MXN',
    });

    expect(result).toHaveProperty('opportunity');
    const opp = (result as any).opportunity;
    expect(opp.contactId).toBe(contactId);
    expect(opp.pipelineId).toBe(pipelineId);
    expect(opp.stageId).toBe('stage_1');
    expect(opp.status).toBe('open');
    expect(opp.id).toMatch(/^opp_/);

    const events = engine.getEvents().getEmitted();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('OpportunityCreated');
  });

  it('should reject opportunity for non-existent contact (I9)', async () => {
    const { engine, ctx, pipelineId } = await setupEngine();

    const result = await engine.execute('create_opportunity', {
      ...ctx,
      contactId: 'cnt_fake',
      pipelineId,
      stageId: 'stage_1',
    });

    expect(result).toHaveProperty('error', 'CONTACT_NOT_FOUND');
  });

  it('should reject opportunity for non-existent pipeline (I10)', async () => {
    const { engine, ctx, contactId } = await setupEngine();

    const result = await engine.execute('create_opportunity', {
      ...ctx,
      contactId,
      pipelineId: 'pip_fake',
      stageId: 'stage_1',
    });

    expect(result).toHaveProperty('error', 'PIPELINE_NOT_FOUND');
  });

  it('should reject invalid stage on creation (I12)', async () => {
    const { engine, ctx, contactId, pipelineId } = await setupEngine();

    const result = await engine.execute('create_opportunity', {
      ...ctx,
      contactId,
      pipelineId,
      stageId: 'stage_nonexistent',
    });

    expect(result).toHaveProperty('error', 'INVALID_STAGE');
  });

  it('should move an opportunity between stages', async () => {
    const { engine, ctx, contactId, pipelineId } = await setupEngine();

    const created = await engine.execute('create_opportunity', {
      ...ctx, contactId, pipelineId, stageId: 'stage_1',
    });
    const oppId = (created as any).opportunity.id;
    engine.getEvents().clear();

    const result = await engine.execute('move_opportunity', {
      ...ctx,
      opportunityId: oppId,
      targetStageId: 'stage_2',
    });

    expect(result).toHaveProperty('opportunity');
    const opp = (result as any).opportunity;
    expect(opp.stageId).toBe('stage_2');

    const events = engine.getEvents().getEmitted();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('OpportunityMoved');
    const payload = events[0].payload as any;
    expect(payload.fromStage).toBe('stage_1');
    expect(payload.toStage).toBe('stage_2');
  });

  it('should reject move on won opportunity (I11)', async () => {
    const { engine, ctx, contactId, pipelineId } = await setupEngine();

    const created = await engine.execute('create_opportunity', {
      ...ctx, contactId, pipelineId, stageId: 'stage_1',
    });
    const oppId = (created as any).opportunity.id;

    // Manually set status to won via provider
    const provider = engine.getProvider() as InMemoryCRMProvider;
    await provider.moveOpportunity(oppId, 'stage_2');
    // We need to modify the opportunity status — use update pattern
    const opp = await provider.getOpportunity(oppId);
    if (opp) {
      (opp as any).status = 'won';
    }

    const result = await engine.execute('move_opportunity', {
      ...ctx,
      opportunityId: oppId,
      targetStageId: 'stage_1',
    });

    expect(result).toHaveProperty('error', 'OPPORTUNITY_TERMINAL');
  });

  it('should reject move to invalid stage', async () => {
    const { engine, ctx, contactId, pipelineId } = await setupEngine();

    const created = await engine.execute('create_opportunity', {
      ...ctx, contactId, pipelineId, stageId: 'stage_1',
    });
    const oppId = (created as any).opportunity.id;

    const result = await engine.execute('move_opportunity', {
      ...ctx,
      opportunityId: oppId,
      targetStageId: 'stage_nonexistent',
    });

    expect(result).toHaveProperty('error', 'INVALID_STAGE_TRANSITION');
  });
});
