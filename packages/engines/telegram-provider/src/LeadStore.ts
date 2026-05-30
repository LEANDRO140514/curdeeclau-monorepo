// ── Lead Store ────────────────────────────────────────────
//
// Local lead identification by (channel, channelUserId).
// Wraps InMemoryCRMProvider for deterministic, provider-agnostic storage.
//
// BV-1.02 scope:
//   - identify(channel, channelUserId) → find or create lead
//   - Register channel + external ID on creation
//   - Log NEW_LEAD or EXISTING_LEAD
//
// Explicitly NOT in scope:
//   - GHL (provider-agnostic — InMemoryCRMProvider only)
//   - Name/email capture
//   - AI / ownership / handoffs

import { InMemoryCRMProvider } from '@curdeeclau/crm-engine';
import type { CRMContact } from '@curdeeclau/shared';

// ── Result ─────────────────────────────────────────────────

export interface LeadIdentificationResult {
  lead: CRMContact;
  status: 'NEW_LEAD' | 'EXISTING_LEAD';
}

// ── Lead Store ─────────────────────────────────────────────

export class LeadStore {
  private provider: InMemoryCRMProvider;

  constructor() {
    this.provider = new InMemoryCRMProvider();
  }

  // ── Identification ───────────────────────────────────────

  /**
   * Identify a lead by (channel, channelUserId).
   *
   * - If the lead already exists → returns it with status EXISTING_LEAD.
   * - If not found → creates a new lead, registers the external ID,
   *   and returns it with status NEW_LEAD.
   *
   * The key format for lookup is the providerId map:
   *   providerIds: { [channel]: channelUserId }
   *   e.g. providerIds: { telegram: "123456789" }
   */
  async identify(channel: string, channelUserId: string): Promise<LeadIdentificationResult> {
    // ── 1. Consultar Lead Store local ──────────────────────
    const existing = await this.provider.findContactByProviderId(channel, channelUserId);

    if (existing) {
      // ── 3. Si existe: recuperar lead ────────────────────
      console.log(
        JSON.stringify({
          lead_action: 'EXISTING_LEAD',
          channel,
          channel_user_id: channelUserId,
          lead_id: existing.id,
          created_at: existing.createdAt,
        }),
      );
      return { lead: existing, status: 'EXISTING_LEAD' };
    }

    // ── 2. Si no existe: crear lead, registrar canal, registrar id externo ──
    const contact = await this.provider.createContact({
      name: `${channel}:${channelUserId}`,
      source: channel,
    });

    // Register the external provider ID on the contact
    await this.provider.updateContact(contact.id, {
      providerIds: { [channel]: channelUserId },
    });

    const lead = (await this.provider.getContact(contact.id))!;

    // ── 4. Generar log indicando NEW_LEAD ──────────────────
    console.log(
      JSON.stringify({
        lead_action: 'NEW_LEAD',
        channel,
        channel_user_id: channelUserId,
        lead_id: lead.id,
        created_at: lead.createdAt,
      }),
    );

    return { lead, status: 'NEW_LEAD' };
  }

  // ── Introspection ────────────────────────────────────────

  getProvider(): InMemoryCRMProvider {
    return this.provider;
  }
}
