// ── GHL Sync Service ──────────────────────────────────────
//
// Idempotent synchronization: NEW_LEAD → GHL contact creation.
// Uses providerIds.ghl on the CRMContact as the idempotency key.
//
// BV-1.03 scope:
//   - On NEW_LEAD with no ghlContactId → createContact in GHL
//   - Store ghlContactId → lead.providerIds.ghl
//   - On EXISTING_LEAD with ghlContactId → skip (already synced)
//   - On EXISTING_LEAD without ghlContactId → backfill sync
//
// NOT in scope:
//   - Contact updates (name, email, phone)
//   - Opportunities, pipelines, appointments
//   - Bidirectional sync (GHL → LeadStore)

import type { CRMContact } from '@curdeeclau/shared';
import { GHLClient } from '@curdeeclau/ghl-engine';
import type { LeadStore } from './LeadStore';

export type GHLSyncResult =
  | { action: 'GHLSYNC_CREATED'; leadId: string; ghlContactId: string }
  | { action: 'GHLSYNC_SKIPPED'; leadId: string; ghlContactId: string }
  | { action: 'GHLSYNC_ERROR'; leadId: string; error: string };

export class GHLSyncService {
  private client: GHLClient;
  private leadStore: LeadStore;

  constructor(client: GHLClient, leadStore: LeadStore) {
    this.client = client;
    this.leadStore = leadStore;
  }

  // ── Sync ─────────────────────────────────────────────────

  /**
   * Sync a lead to GHL.
   *
   * - If the lead already has a ghl providerId → skip (idempotent).
   * - If not → create minimal GHL contact and store the ID.
   *
   * Returns structured result for logging.
   */
  async syncToGHL(lead: CRMContact): Promise<GHLSyncResult> {
    const leadId = lead.id;

    // ── Idempotency check via providerIds ──────────────────
    const existingGHLId = lead.providerIds?.ghl;
    if (existingGHLId) {
      console.log(
        JSON.stringify({
          ghl_sync_action: 'GHLSYNC_SKIPPED',
          lead_id: leadId,
          ghl_contact_id: existingGHLId,
          reason: 'ghlContactId already registered',
        }),
      );
      return { action: 'GHLSYNC_SKIPPED', leadId, ghlContactId: existingGHLId };
    }

    // ── Create GHL contact ─────────────────────────────────
    try {
      const ghlContact = await this.client.createContact({
        firstName: lead.firstName || lead.name || 'unknown',
        lastName: lead.lastName || '',
        phone: lead.phone,
        email: lead.email,
        source: lead.source ?? 'telegram',
        tags: lead.tags ?? [],
        customFields: {},
      });

      const ghlContactId = ghlContact.id;

      // ── Persist GHL Contact ID in LeadStore ───────────────
      await this.leadStore.getProvider().updateContact(leadId, {
        providerIds: {
          ...lead.providerIds,
          ghl: ghlContactId,
        },
      });

      console.log(
        JSON.stringify({
          ghl_sync_action: 'GHLSYNC_CREATED',
          lead_id: leadId,
          ghl_contact_id: ghlContactId,
        }),
      );

      return { action: 'GHLSYNC_CREATED', leadId, ghlContactId };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        JSON.stringify({
          ghl_sync_action: 'GHLSYNC_ERROR',
          lead_id: leadId,
          error: message,
        }),
      );
      return { action: 'GHLSYNC_ERROR', leadId, error: message };
    }
  }
}
