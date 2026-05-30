// ── GHL REST API Client ──────────────────────────────────
//
// Real HTTP implementation of the GHLApiClient interface.
// Uses Node.js built-in fetch (Node 20+).
//
// BV-1.03 scope:
//   - createContact — minimal fields only
//   - GHL REST API v1 (rest.gohighlevel.com)
//
// NOT in scope:
//   - Opportunities / Pipelines / Appointments / Webhooks

import type { GHLApiClient, GHLContact, GHLOpportunity, GHLPipeline, GHLWebhookEvent } from './types';

const GHL_API_BASE = 'https://rest.gohighlevel.com/v1';

export interface GHLClientConfig {
  apiKey: string;
  locationId: string;
}

export class GHLClient implements GHLApiClient {
  private apiKey: string;
  private locationId: string;

  constructor(config: GHLClientConfig) {
    this.apiKey = config.apiKey;
    this.locationId = config.locationId;
  }

  // ── Contacts ────────────────────────────────────────────

  async createContact(
    contact: Omit<GHLContact, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<GHLContact> {
    const body: Record<string, unknown> = {
      firstName: contact.firstName,
      lastName: contact.lastName,
      source: contact.source,
      locationId: this.locationId,
      tags: contact.tags ?? [],
    };

    if (contact.email) body.email = contact.email;
    if (contact.phone) body.phone = contact.phone;
    if (contact.customFields && Object.keys(contact.customFields).length > 0) {
      body.customFields = contact.customFields;
    }

    const response = await fetch(`${GHL_API_BASE}/contacts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `GHL createContact failed (${response.status}): ${errorText}`,
      );
    }

    const data = (await response.json()) as { contact: GHLContact };
    return data.contact;
  }

  async findContactByPhone(_phone: string): Promise<GHLContact | null> {
    throw new Error('GHL findContactByPhone not implemented (BV-1.03 scope)');
  }

  async findContactByEmail(_email: string): Promise<GHLContact | null> {
    throw new Error('GHL findContactByEmail not implemented (BV-1.03 scope)');
  }

  async updateContact(_id: string, _fields: Partial<GHLContact>): Promise<GHLContact> {
    throw new Error('GHL updateContact not implemented (BV-1.03 scope)');
  }

  // ── Opportunities ────────────────────────────────────────

  async getOpportunities(_contactId: string): Promise<GHLOpportunity[]> {
    throw new Error('GHL getOpportunities not implemented (BV-1.03 scope)');
  }

  async createOpportunity(
    _opportunity: Omit<GHLOpportunity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<GHLOpportunity> {
    throw new Error('GHL createOpportunity not implemented (BV-1.03 scope)');
  }

  // ── Pipelines ────────────────────────────────────────────

  async getPipelines(): Promise<GHLPipeline[]> {
    throw new Error('GHL getPipelines not implemented (BV-1.03 scope)');
  }

  // ── Webhooks ─────────────────────────────────────────────

  async parseWebhook(
    _body: unknown,
    _signature?: string,
  ): Promise<GHLWebhookEvent> {
    throw new Error('GHL parseWebhook not implemented (BV-1.03 scope)');
  }
}
