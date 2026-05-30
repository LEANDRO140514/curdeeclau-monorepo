// ── PostgresCRMProvider ────────────────────────────────────
//
// Real PostgreSQL adapter implementing CRMProvider.
// Uses the same leads + lead_external_identities tables as LeadsRepository.
//
// BV-2 scope:
//   - Contact CRUD (createContact, getContact, updateContact, findContactByProviderId)
//   - Tags (addTag, removeTag)
//   - Non-contact methods throw (opportunities, pipelines, campaigns not in scope)
//
// Mapping:
//   CRMContact.id (cnt_<uuid>)  ↔  leads.id (UUID)
//   CRMContact.providerIds       ↔  lead_external_identities (channel, external_id)
//   CRMContact.tags (string[])   ↔  leads.tags (JSONB { items: string[] })
//   CRMContact.createdAt (ms)    ↔  leads.created_at (ISO timestamp)
//
// INVARIANT: No schema modifications. No new tables. Uses existing infra.

import type { Pool, QueryResultRow } from 'pg';
import type { CRMProvider } from '@curdeeclau/crm-engine';
import type { CreateContactInput } from '@curdeeclau/crm-engine';
import type { CRMContact, ContactId } from '@curdeeclau/shared';

// ── Helpers ─────────────────────────────────────────────────

const CNT_PREFIX = 'cnt_';

function uuidToContactId(uuid: string): ContactId {
  return `${CNT_PREFIX}${uuid}` as ContactId;
}

function contactIdToUuid(contactId: string): string {
  if (contactId.startsWith(CNT_PREFIX)) {
    return contactId.slice(CNT_PREFIX.length);
  }
  return contactId;
}

function fromDbTimestamp(iso: string): number {
  return new Date(iso).getTime();
}

function extractTags(tagsJson: unknown): string[] {
  if (tagsJson !== null && typeof tagsJson === 'object' && !Array.isArray(tagsJson)) {
    const obj = tagsJson as Record<string, unknown>;
    if (Array.isArray(obj.items)) {
      return obj.items.filter((v): v is string => typeof v === 'string');
    }
  }
  return [];
}

function buildTagsJson(tags: string[]): Record<string, unknown> {
  return { items: tags };
}

function mapLeadRow(row: QueryResultRow, identities: IdentityRow[]): CRMContact {
  const providerIds: Record<string, string> = {};
  for (const ident of identities) {
    providerIds[ident.channel] = ident.external_id;
  }

  const contact: CRMContact = {
    id: uuidToContactId(String(row.id)),
    providerIds,
    name: String(row.first_name ?? ''),
    firstName: row.first_name ? String(row.first_name) : undefined,
    email: row.email ? String(row.email) : undefined,
    phone: row.phone_number && !String(row.phone_number).startsWith('__ext__:')
      ? String(row.phone_number)
      : undefined,
    tags: extractTags(row.tags),
    source: identities.length > 0 ? identities[0].channel : undefined,
    createdAt: fromDbTimestamp(String(row.created_at)),
    updatedAt: fromDbTimestamp(String(row.updated_at)),
    metadata: {},
  };
  return contact;
}

interface IdentityRow {
  id: string;
  lead_id: string;
  channel: string;
  external_id: string;
}

// ── PostgresCRMProvider ─────────────────────────────────────

export class PostgresCRMProvider implements CRMProvider {
  readonly providerName = 'postgres';

  private pool: Pool;
  private tenantId: string;

  constructor(pool: Pool, tenantId: string) {
    this.pool = pool;
    this.tenantId = tenantId;
  }

  // ── Contacts ──────────────────────────────────────────────

  async createContact(data: CreateContactInput): Promise<CRMContact> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Generate synthetic phone_number for leads without one (e.g. Telegram)
      const phoneNumber = data.phone ?? `__ext__:${this.generateExtId()}`;
      const firstName = data.firstName ?? data.name ?? '';
      const email = data.email ?? null;
      const tagsJson = JSON.stringify(buildTagsJson(data.tags ?? []));

      const leadResult = await client.query<QueryResultRow>(
        `INSERT INTO leads (tenant_id, phone_number, first_name, email, tags, updated_at)
         VALUES ($1::uuid, $2, $3, $4, $5::jsonb, NOW())
         RETURNING *`,
        [this.tenantId, phoneNumber, firstName, email, tagsJson],
      );
      const leadRow = leadResult.rows[0];
      if (!leadRow) {
        throw new Error('[PostgresCRMProvider] createContact: lead insert failed');
      }
      const leadId = String(leadRow.id);

      // If source is set, register it as an external identity
      const identities: IdentityRow[] = [];
      if (data.source) {
        const sourceExtId = phoneNumber.startsWith('__ext__:') ? leadId : phoneNumber;
        const identResult = await client.query<QueryResultRow>(
          `INSERT INTO lead_external_identities (tenant_id, lead_id, channel, external_id, updated_at)
           VALUES ($1::uuid, $2::uuid, $3, $4, NOW())
           ON CONFLICT (tenant_id, channel, external_id) DO NOTHING
           RETURNING *`,
          [this.tenantId, leadId, data.source, sourceExtId],
        );
        if (identResult.rows[0]) {
          identities.push({
            id: String(identResult.rows[0].id),
            lead_id: String(identResult.rows[0].lead_id),
            channel: String(identResult.rows[0].channel),
            external_id: String(identResult.rows[0].external_id),
          });
        }
      }

      await client.query('COMMIT');
      return mapLeadRow(leadRow, identities);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getContact(id: string): Promise<CRMContact | undefined> {
    const uuid = contactIdToUuid(id);
    const leadResult = await this.pool.query<QueryResultRow>(
      `SELECT * FROM leads WHERE id = $1::uuid AND tenant_id = $2::uuid LIMIT 1`,
      [uuid, this.tenantId],
    );
    const leadRow = leadResult.rows[0];
    if (!leadRow) return undefined;

    const identities = await this.fetchIdentities(String(leadRow.id));
    return mapLeadRow(leadRow, identities);
  }

  async updateContact(id: string, changes: Partial<CRMContact>): Promise<CRMContact> {
    const uuid = contactIdToUuid(id);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Update scalar fields
      const setClauses: string[] = [];
      const params: unknown[] = [];
      let paramIdx = 1;

      if (changes.firstName !== undefined) {
        setClauses.push(`first_name = $${paramIdx++}`);
        params.push(changes.firstName);
      }
      if (changes.email !== undefined) {
        setClauses.push(`email = $${paramIdx++}`);
        params.push(changes.email);
      }
      if (changes.phone !== undefined) {
        setClauses.push(`phone_number = $${paramIdx++}`);
        params.push(changes.phone);
      }
      if (changes.tags !== undefined) {
        setClauses.push(`tags = $${paramIdx++}::jsonb`);
        params.push(JSON.stringify(buildTagsJson(changes.tags)));
      }
      setClauses.push(`updated_at = NOW()`);

      params.push(uuid, this.tenantId);

      await client.query(
        `UPDATE leads SET ${setClauses.join(', ')} WHERE id = $${paramIdx++}::uuid AND tenant_id = $${paramIdx}::uuid`,
        params,
      );

      // Update providerIds → lead_external_identities
      if (changes.providerIds) {
        for (const [channel, externalId] of Object.entries(changes.providerIds)) {
          await client.query(
            `INSERT INTO lead_external_identities (tenant_id, lead_id, channel, external_id, updated_at)
             VALUES ($1::uuid, $2::uuid, $3, $4, NOW())
             ON CONFLICT (tenant_id, channel, external_id) DO UPDATE SET
               updated_at = NOW()
             RETURNING *`,
            [this.tenantId, uuid, channel, externalId],
          );
        }
      }

      await client.query('COMMIT');

      // Fetch updated
      const leadResult = await this.pool.query<QueryResultRow>(
        `SELECT * FROM leads WHERE id = $1::uuid AND tenant_id = $2::uuid LIMIT 1`,
        [uuid, this.tenantId],
      );
      const leadRow = leadResult.rows[0];
      if (!leadRow) {
        throw new Error(`[PostgresCRMProvider] updateContact: contact ${id} not found after update`);
      }
      const identities = await this.fetchIdentities(String(leadRow.id));
      return mapLeadRow(leadRow, identities);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findContactByProviderId(provider: string, providerId: string): Promise<CRMContact | undefined> {
    const identResult = await this.pool.query<QueryResultRow>(
      `SELECT * FROM lead_external_identities
       WHERE tenant_id = $1::uuid AND channel = $2 AND external_id = $3
       LIMIT 1`,
      [this.tenantId, provider, providerId],
    );
    const identRow = identResult.rows[0];
    if (!identRow) return undefined;

    const leadId = String(identRow.lead_id);
    const leadResult = await this.pool.query<QueryResultRow>(
      `SELECT * FROM leads WHERE id = $1::uuid AND tenant_id = $2::uuid LIMIT 1`,
      [leadId, this.tenantId],
    );
    const leadRow = leadResult.rows[0];
    if (!leadRow) return undefined;

    const identities = await this.fetchIdentities(leadId);
    return mapLeadRow(leadRow, identities);
  }

  // ── Tags ──────────────────────────────────────────────────

  async addTag(contactId: string, tag: string): Promise<CRMContact> {
    const uuid = contactIdToUuid(contactId);
    const contact = await this.getContact(contactId);
    if (!contact) {
      throw new Error(`[PostgresCRMProvider] addTag: contact ${contactId} not found`);
    }
    if (contact.tags.includes(tag)) return contact;

    const newTags = [...contact.tags, tag];
    await this.pool.query(
      `UPDATE leads SET tags = $1::jsonb, updated_at = NOW() WHERE id = $2::uuid AND tenant_id = $3::uuid`,
      [JSON.stringify(buildTagsJson(newTags)), uuid, this.tenantId],
    );

    return { ...contact, tags: newTags, updatedAt: Date.now() };
  }

  async removeTag(contactId: string, tag: string): Promise<CRMContact> {
    const uuid = contactIdToUuid(contactId);
    const contact = await this.getContact(contactId);
    if (!contact) {
      throw new Error(`[PostgresCRMProvider] removeTag: contact ${contactId} not found`);
    }

    const newTags = contact.tags.filter((t) => t !== tag);
    await this.pool.query(
      `UPDATE leads SET tags = $1::jsonb, updated_at = NOW() WHERE id = $2::uuid AND tenant_id = $3::uuid`,
      [JSON.stringify(buildTagsJson(newTags)), uuid, this.tenantId],
    );

    return { ...contact, tags: newTags, updatedAt: Date.now() };
  }

  // ── Not in BV-2 scope ─────────────────────────────────────

  async createOpportunity(): Promise<never> {
    throw new Error('[PostgresCRMProvider] createOpportunity not implemented (BV-2 scope)');
  }
  async moveOpportunity(): Promise<never> {
    throw new Error('[PostgresCRMProvider] moveOpportunity not implemented (BV-2 scope)');
  }
  async getOpportunity(): Promise<never> {
    throw new Error('[PostgresCRMProvider] getOpportunity not implemented (BV-2 scope)');
  }
  async createPipeline(): Promise<never> {
    throw new Error('[PostgresCRMProvider] createPipeline not implemented (BV-2 scope)');
  }
  async getPipeline(): Promise<never> {
    throw new Error('[PostgresCRMProvider] getPipeline not implemented (BV-2 scope)');
  }
  async createCampaign(): Promise<never> {
    throw new Error('[PostgresCRMProvider] createCampaign not implemented (BV-2 scope)');
  }
  async pauseCampaign(): Promise<never> {
    throw new Error('[PostgresCRMProvider] pauseCampaign not implemented (BV-2 scope)');
  }
  async resumeCampaign(): Promise<never> {
    throw new Error('[PostgresCRMProvider] resumeCampaign not implemented (BV-2 scope)');
  }
  async getCampaign(): Promise<never> {
    throw new Error('[PostgresCRMProvider] getCampaign not implemented (BV-2 scope)');
  }

  // ── Helpers ───────────────────────────────────────────────

  private async fetchIdentities(leadId: string): Promise<IdentityRow[]> {
    const result = await this.pool.query<QueryResultRow>(
      `SELECT * FROM lead_external_identities
       WHERE lead_id = $1::uuid AND tenant_id = $2::uuid`,
      [leadId, this.tenantId],
    );
    return result.rows.map((row: QueryResultRow): IdentityRow => ({
      id: String(row.id),
      lead_id: String(row.lead_id),
      channel: String(row.channel),
      external_id: String(row.external_id),
    }));
  }

  private generateExtId(): string {
    // Simple UUID v4-like string without crypto dependency
    const hex = () => Math.floor(Math.random() * 16).toString(16);
    const segment = (n: number): string => Array.from({ length: n }, hex).join('');
    return `${segment(8)}-${segment(4)}-4${segment(3)}-${segment(4)}-${segment(12)}`;
  }
}
