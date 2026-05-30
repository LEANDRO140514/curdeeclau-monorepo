// ── GHL Sync Service Tests ────────────────────────────────
//
// BV-1.03: Idempotent GHL contact sync from LeadStore.
// Verify NEW_LEAD → GHLSYNC_CREATED and EXISTING_LEAD → GHLSYNC_SKIPPED.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GHLClient } from '@curdeeclau/ghl-engine';
import type { GHLContact } from '@curdeeclau/ghl-engine';
import { LeadStore } from '../LeadStore';
import { GHLSyncService } from '../GHLSyncService';
import type { CRMContact } from '@curdeeclau/shared';

function makeMockGHLClient(): GHLClient {
  const client = new GHLClient({ apiKey: 'test-api-key', locationId: 'test-location' });

  let contactCounter = 0;
  vi.spyOn(client, 'createContact').mockImplementation(async (contact) => {
    contactCounter += 1;
    const ghlContact: GHLContact = {
      id: `ghl_contact_${contactCounter}`,
      firstName: contact.firstName,
      lastName: contact.lastName,
      source: contact.source,
      tags: [],
      customFields: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return ghlContact;
  });

  return client;
}

describe('GHLSyncService — syncToGHL', () => {
  let leadStore: LeadStore;
  let ghlClient: GHLClient;
  let syncService: GHLSyncService;

  beforeEach(() => {
    leadStore = new LeadStore();
    ghlClient = makeMockGHLClient();
    syncService = new GHLSyncService(ghlClient, leadStore);
  });

  it('debe crear contacto en GHL y devolver GHLSYNC_CREATED en primer sync', async () => {
    const { lead } = await leadStore.identify('telegram', '111');
    const result = await syncService.syncToGHL(lead);

    expect(result.action).toBe('GHLSYNC_CREATED');
    expect(result.leadId).toBe(lead.id);
    expect((result as { ghlContactId: string }).ghlContactId).toMatch(/^ghl_contact_/);
    expect(ghlClient.createContact).toHaveBeenCalledTimes(1);
  });

  it('debe devolver GHLSYNC_SKIPPED en segundo sync del mismo lead (idempotencia)', async () => {
    const { lead } = await leadStore.identify('telegram', '222');

    // First sync — creates
    const first = await syncService.syncToGHL(lead);
    expect(first.action).toBe('GHLSYNC_CREATED');

    // Reload lead from store (it now has providerIds.ghl)
    const updatedLead = await leadStore.getProvider().getContact(lead.id);
    expect(updatedLead).toBeDefined();
    const providerIds = updatedLead?.providerIds ?? {};
    expect(providerIds.ghl).toBeDefined();

    // Second sync — skips
    const second = await syncService.syncToGHL(updatedLead!);
    expect(second.action).toBe('GHLSYNC_SKIPPED');
    expect((second as { ghlContactId: string }).ghlContactId).toBe(
      (first as { ghlContactId: string }).ghlContactId,
    );
    // Still only 1 GHL API call
    expect(ghlClient.createContact).toHaveBeenCalledTimes(1);
  });

  it('debe crear contactos GHL diferentes para leads diferentes', async () => {
    const { lead: leadA } = await leadStore.identify('telegram', 'aaa');
    const { lead: leadB } = await leadStore.identify('telegram', 'bbb');

    const resultA = await syncService.syncToGHL(leadA);
    const resultB = await syncService.syncToGHL(leadB);

    expect(resultA.action).toBe('GHLSYNC_CREATED');
    expect(resultB.action).toBe('GHLSYNC_CREATED');
    expect((resultA as { ghlContactId: string }).ghlContactId).not.toBe(
      (resultB as { ghlContactId: string }).ghlContactId,
    );
    expect(ghlClient.createContact).toHaveBeenCalledTimes(2);
  });

  it('debe hacer backfill sync para leads existentes sin ghlContactId', async () => {
    // Create a lead directly without going through sync
    const provider = leadStore.getProvider();
    const contact = await provider.createContact({
      name: 'telegram:old_lead',
      source: 'telegram',
    });
    await provider.updateContact(contact.id, {
      providerIds: { telegram: 'old_lead' },
    });
    const oldLead = (await provider.getContact(contact.id))!;

    // No ghl providerId yet
    expect(oldLead.providerIds?.ghl).toBeUndefined();

    // Sync should backfill
    const result = await syncService.syncToGHL(oldLead);
    expect(result.action).toBe('GHLSYNC_CREATED');
    expect(ghlClient.createContact).toHaveBeenCalledTimes(1);

    // Verify ghl id was persisted
    const updated = await provider.getContact(contact.id);
    expect(updated?.providerIds?.ghl).toBeDefined();
  });

  it('debe propagar GHLSYNC_ERROR si el cliente GHL falla', async () => {
    vi.mocked(ghlClient.createContact).mockRejectedValueOnce(new Error('Network error'));

    const { lead } = await leadStore.identify('telegram', 'error_case');
    const result = await syncService.syncToGHL(lead);

    expect(result.action).toBe('GHLSYNC_ERROR');
    expect((result as { error: string }).error).toContain('Network error');
  });

  it('no debe llamar a GHL createContact si el lead ya tiene ghlContactId', async () => {
    const { lead } = await leadStore.identify('telegram', 'skip_test');
    await syncService.syncToGHL(lead); // First call — creates
    expect(ghlClient.createContact).toHaveBeenCalledTimes(1);

    // Reload lead
    const updated = (await leadStore.getProvider().getContact(lead.id))!;

    // Second call — should skip
    await syncService.syncToGHL(updated);
    expect(ghlClient.createContact).toHaveBeenCalledTimes(1); // Still 1
  });
});
