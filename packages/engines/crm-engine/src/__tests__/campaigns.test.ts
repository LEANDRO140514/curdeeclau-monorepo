// ── CRM Engine: Campaign Tests ─────────────────────────────

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

describe('CampaignManager', () => {
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

  it('should create a campaign and emit CampaignCreated', async () => {
    const ctx = makeContext();
    const result = await engine.execute('create_campaign', {
      ...ctx,
      name: 'Campaña Dental Verano',
      startAt: Date.now(),
      endAt: Date.now() + 86400000,
    });

    expect(result).toHaveProperty('campaign');
    const campaign = (result as any).campaign;
    expect(campaign.name).toBe('Campaña Dental Verano');
    expect(campaign.status).toBe('draft');
    expect(campaign.id).toMatch(/^cmp_/);

    const events = engine.getEvents().getEmitted();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('CampaignCreated');
  });

  it('should reject campaign with invalid date range (I13)', async () => {
    const now = Date.now();
    const result = await engine.execute('create_campaign', {
      ...makeContext(),
      name: 'Bad Range',
      startAt: now + 1000,
      endAt: now,
    });

    expect(result).toHaveProperty('error', 'INVALID_DATE_RANGE');
  });

  it('should pause an active campaign and emit CampaignPaused', async () => {
    const ctx = makeContext();

    // Create and manually activate
    const created = await engine.execute('create_campaign', { ...ctx, name: 'Test', startAt: Date.now() });
    const campaignId = (created as any).campaign.id;
    await provider.updateCampaign(campaignId, { status: 'active' as any });
    engine.getEvents().clear();

    const result = await engine.execute('pause_campaign', { ...ctx, campaignId });

    expect(result).toHaveProperty('campaign');
    expect((result as any).campaign.status).toBe('paused');

    const events = engine.getEvents().getEmitted();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('CampaignPaused');
  });

  it('should reject pausing an archived campaign (I14)', async () => {
    const ctx = makeContext();
    const created = await engine.execute('create_campaign', { ...ctx, name: 'Archived' });
    const campaignId = (created as any).campaign.id;
    await provider.updateCampaign(campaignId, { status: 'archived' as any });

    const result = await engine.execute('pause_campaign', { ...ctx, campaignId });
    expect(result).toHaveProperty('error', 'CAMPAIGN_ARCHIVED');
  });

  it('should reject pausing a completed campaign (I15)', async () => {
    const ctx = makeContext();
    const created = await engine.execute('create_campaign', { ...ctx, name: 'Done' });
    const campaignId = (created as any).campaign.id;
    await provider.updateCampaign(campaignId, { status: 'completed' as any });

    const result = await engine.execute('pause_campaign', { ...ctx, campaignId });
    expect(result).toHaveProperty('error', 'CAMPAIGN_COMPLETED');
  });

  it('should reject pausing a draft campaign (I16)', async () => {
    const ctx = makeContext();
    const created = await engine.execute('create_campaign', { ...ctx, name: 'Draft' });
    const campaignId = (created as any).campaign.id;

    const result = await engine.execute('pause_campaign', { ...ctx, campaignId });
    expect(result).toHaveProperty('error', 'CAMPAIGN_DRAFT');
  });

  it('should reject pausing an already-paused campaign', async () => {
    const ctx = makeContext();
    const created = await engine.execute('create_campaign', { ...ctx, name: 'Paused' });
    const campaignId = (created as any).campaign.id;
    await provider.updateCampaign(campaignId, { status: 'paused' as any });

    const result = await engine.execute('pause_campaign', { ...ctx, campaignId });
    expect(result).toHaveProperty('error', 'CAMPAIGN_ALREADY_PAUSED');
  });

  it('should resume a paused campaign', async () => {
    const ctx = makeContext();
    const created = await engine.execute('create_campaign', { ...ctx, name: 'Resume' });
    const campaignId = (created as any).campaign.id;
    await provider.updateCampaign(campaignId, { status: 'paused' as any });
    engine.getEvents().clear();

    const result = await engine.execute('resume_campaign', { ...ctx, campaignId });

    expect(result).toHaveProperty('campaign');
    expect((result as any).campaign.status).toBe('active');
    const events = engine.getEvents().getEmitted();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('CampaignResumed');
  });

  it('should reject resuming an archived campaign (I14)', async () => {
    const ctx = makeContext();
    const created = await engine.execute('create_campaign', { ...ctx, name: 'Archived' });
    const campaignId = (created as any).campaign.id;
    await provider.updateCampaign(campaignId, { status: 'archived' as any });

    const result = await engine.execute('resume_campaign', { ...ctx, campaignId });
    expect(result).toHaveProperty('error', 'CAMPAIGN_ARCHIVED');
  });

  it('should reject resuming a non-paused campaign', async () => {
    const ctx = makeContext();
    const created = await engine.execute('create_campaign', { ...ctx, name: 'Active' });
    const campaignId = (created as any).campaign.id;
    await provider.updateCampaign(campaignId, { status: 'active' as any });

    const result = await engine.execute('resume_campaign', { ...ctx, campaignId });
    expect(result).toHaveProperty('error', 'CAMPAIGN_NOT_PAUSED');
  });
});
