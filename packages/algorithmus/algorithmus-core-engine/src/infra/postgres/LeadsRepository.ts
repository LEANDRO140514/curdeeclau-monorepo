import type { PoolClient, QueryResultRow } from "pg";
import { getPool, query } from "./client";

/**
 * Fila `leads` alineada con `schema.sql` y `CoreLead` (IdentityManager).
 * Fechas como ISO string para consistencia con el resto del core.
 */
export type LeadRecord = {
  id: string;
  tenant_id: string;
  phone_number: string;
  first_name: string | null;
  email: string | null;
  tags: Record<string, unknown>;
  fsm_state: string;
  ai_confidence_score: number;
  last_interaction: string | null;
  created_at: string;
  updated_at: string;
};

export type ExternalIdentityRecord = {
  id: string;
  tenant_id: string;
  lead_id: string;
  channel: string;
  external_id: string;
  is_primary: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type FindExternalIdentityInput = {
  readonly tenantId: string;
  readonly channel: string;
  readonly externalId: string;
};

export type CreateExternalIdentityInput = {
  readonly tenantId: string;
  readonly leadId: string;
  readonly channel: string;
  readonly externalId: string;
  readonly metadata?: Record<string, unknown>;
  readonly isPrimary?: boolean;
};

export type FindLeadByIdInput = {
  readonly tenantId: string;
  readonly leadId: string;
};

export type CreateLeadWithExternalIdentityInput = {
  readonly tenantId: string;
  readonly channel: string;
  readonly externalId: string;
  readonly metadata?: Record<string, unknown>;
};

export type UpsertLeadInput = {
  readonly tenantId: string;
  readonly phoneNumber: string;
  readonly updatedAt: Date | string;
  readonly firstName?: string | null;
  readonly email?: string | null;
};

export type UpdateFsmStateInput = {
  readonly leadId: string;
  readonly tenantId: string;
  readonly fsmState: string;
  readonly updatedAt: Date | string;
};

/**
 * Payload para inserción / reintento idempotente desde webhook GHL.
 * `tenantId` y `phoneNumber` (E.164) son obligatorios según schema y 04_data_integrity.
 */
export type InsertFromGhlInput = {
  readonly tenantId: string;
  readonly phoneNumber: string;
  readonly firstName: string | null;
  readonly email: string | null;
  readonly source?: string | null;
  readonly branchId?: string | null;
};

function toIso(v: Date | string): string {
  return typeof v === "string" ? v : v.toISOString();
}

function emptyToNull(s: string | null | undefined): string | null {
  if (s == null) return null;
  const t = s.trim();
  return t.length > 0 ? t : null;
}

function normalizeChannel(channel: string): string {
  const c = channel.trim().toLowerCase();
  if (!c) throw new Error("[LeadsRepository] channel is required");
  return c;
}

function normalizeExternalId(externalId: string): string {
  const id = externalId.trim();
  if (!id) throw new Error("[LeadsRepository] externalId is required");
  return id;
}

function asJsonObject(v: unknown): Record<string, unknown> {
  if (v !== null && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return {};
}

function buildGhlTags(input: InsertFromGhlInput): Record<string, unknown> {
  const source = emptyToNull(input.source ?? undefined);
  const branchId = emptyToNull(input.branchId ?? undefined);
  if (source == null && branchId == null) {
    return {};
  }
  return {
    ghl: {
      ...(source != null ? { source } : {}),
      ...(branchId != null ? { branch_id: branchId } : {}),
    },
  };
}

function valueAsIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function mapLeadRow(row: QueryResultRow): LeadRecord {
  return {
    id: String(row.id),
    tenant_id: String(row.tenant_id),
    phone_number: String(row.phone_number),
    first_name: row.first_name == null ? null : String(row.first_name),
    email: row.email == null ? null : String(row.email),
    tags: asJsonObject(row.tags),
    fsm_state: String(row.fsm_state ?? "INIT"),
    ai_confidence_score:
      typeof row.ai_confidence_score === "number"
        ? row.ai_confidence_score
        : Number(row.ai_confidence_score ?? 0),
    last_interaction:
      row.last_interaction == null ? null : valueAsIso(row.last_interaction),
    created_at: valueAsIso(row.created_at),
    updated_at: valueAsIso(row.updated_at),
  };
}

function mapExternalIdentityRow(row: QueryResultRow): ExternalIdentityRecord {
  return {
    id: String(row.id),
    tenant_id: String(row.tenant_id),
    lead_id: String(row.lead_id),
    channel: String(row.channel),
    external_id: String(row.external_id),
    is_primary: row.is_primary === true,
    metadata: asJsonObject(row.metadata),
    created_at: valueAsIso(row.created_at),
    updated_at: valueAsIso(row.updated_at),
  };
}

/**
 * Acceso a `leads` y `lead_external_identities` vía SQL parametrizado.
 *
 * Reglas relevantes:
 * - Scope multitenant estricto por `tenant_id`.
 * - Identidad única por `(tenant_id, channel, external_id)`.
 * - Upserts de `leads` NO pisan `fsm_state`, `tags`, `ai_confidence_score`.
 */
export class LeadsRepository {
  async findByPhone(
    tenantId: string,
    phoneNumber: string,
  ): Promise<LeadRecord | null> {
    const res = await query<QueryResultRow>(
      `
      SELECT *
      FROM leads
      WHERE tenant_id = $1::uuid
        AND phone_number = $2
      LIMIT 1
      `,
      [tenantId, phoneNumber],
    );
    const row = res.rows[0];
    return row ? mapLeadRow(row) : null;
  }

  async findLeadById(input: FindLeadByIdInput): Promise<LeadRecord | null> {
    const res = await query<QueryResultRow>(
      `
      SELECT *
      FROM leads
      WHERE tenant_id = $1::uuid
        AND id = $2::uuid
      LIMIT 1
      `,
      [input.tenantId, input.leadId],
    );
    const row = res.rows[0];
    return row ? mapLeadRow(row) : null;
  }

  async findExternalIdentity(
    input: FindExternalIdentityInput,
  ): Promise<ExternalIdentityRecord | null> {
    const channel = normalizeChannel(input.channel);
    const externalId = normalizeExternalId(input.externalId);

    const res = await query<QueryResultRow>(
      `
      SELECT *
      FROM lead_external_identities
      WHERE tenant_id = $1::uuid
        AND channel = $2
        AND external_id = $3
      LIMIT 1
      `,
      [input.tenantId, channel, externalId],
    );
    const row = res.rows[0];
    return row ? mapExternalIdentityRow(row) : null;
  }

  async createExternalIdentity(
    input: CreateExternalIdentityInput,
  ): Promise<ExternalIdentityRecord> {
    const channel = normalizeChannel(input.channel);
    const externalId = normalizeExternalId(input.externalId);
    const metadata = input.metadata ?? {};
    const isPrimary = input.isPrimary === true;

    const lead = await this.findLeadById({
      tenantId: input.tenantId,
      leadId: input.leadId,
    });
    if (!lead) {
      throw new Error(
        "[LeadsRepository] createExternalIdentity: lead not found in tenant",
      );
    }

    const res = await query<QueryResultRow>(
      `
      INSERT INTO lead_external_identities (
        tenant_id,
        lead_id,
        channel,
        external_id,
        is_primary,
        metadata,
        updated_at
      )
      VALUES (
        $1::uuid,
        $2::uuid,
        $3,
        $4,
        $5,
        $6::jsonb,
        NOW()
      )
      ON CONFLICT (tenant_id, channel, external_id)
      DO UPDATE SET
        updated_at = NOW(),
        metadata = COALESCE(EXCLUDED.metadata, lead_external_identities.metadata),
        is_primary = lead_external_identities.is_primary OR EXCLUDED.is_primary
      RETURNING *
      `,
      [
        input.tenantId,
        input.leadId,
        channel,
        externalId,
        isPrimary,
        JSON.stringify(metadata),
      ],
    );

    const row = res.rows[0];
    if (!row) {
      throw new Error("[LeadsRepository] createExternalIdentity: no row returned");
    }

    return mapExternalIdentityRow(row);
  }

  /**
   * Crea lead e identidad externa en UNA transacción para evitar huérfanos.
   * Garantiza mapeo `(tenant, channel, external_id) -> lead` idempotente bajo carrera.
   */
  async createLeadWithExternalIdentity(
    input: CreateLeadWithExternalIdentityInput,
  ): Promise<LeadRecord> {
    const channel = normalizeChannel(input.channel);
    const externalId = normalizeExternalId(input.externalId);
    const metadata = input.metadata ?? {};

    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existingIdentity = await client.query<QueryResultRow>(
        `
        SELECT lead_id
        FROM lead_external_identities
        WHERE tenant_id = $1::uuid
          AND channel = $2
          AND external_id = $3
        LIMIT 1
        FOR UPDATE
        `,
        [input.tenantId, channel, externalId],
      );

      if (existingIdentity.rows[0]) {
        const leadId = String(existingIdentity.rows[0].lead_id);
        const existingLead = await this.findLeadByIdTx(client, {
          tenantId: input.tenantId,
          leadId,
        });
        if (!existingLead) {
          throw new Error(
            "[LeadsRepository] createLeadWithExternalIdentity: identity points to missing lead",
          );
        }
        await client.query("COMMIT");
        return existingLead;
      }

      const insertedLead = await client.query<QueryResultRow>(
        `
        INSERT INTO leads (tenant_id, phone_number, updated_at)
        VALUES ($1::uuid, '__ext__:' || gen_random_uuid()::text, NOW())
        RETURNING *
        `,
        [input.tenantId],
      );
      const leadRow = insertedLead.rows[0];
      if (!leadRow) {
        throw new Error(
          "[LeadsRepository] createLeadWithExternalIdentity: lead insert failed",
        );
      }
      const lead = mapLeadRow(leadRow);

      await client.query(
        `
        INSERT INTO lead_external_identities (
          tenant_id,
          lead_id,
          channel,
          external_id,
          is_primary,
          metadata,
          updated_at
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          $3,
          $4,
          true,
          $5::jsonb,
          NOW()
        )
        ON CONFLICT (tenant_id, channel, external_id) DO NOTHING
        `,
        [input.tenantId, lead.id, channel, externalId, JSON.stringify(metadata)],
      );

      const identityAfterInsert = await client.query<QueryResultRow>(
        `
        SELECT lead_id
        FROM lead_external_identities
        WHERE tenant_id = $1::uuid
          AND channel = $2
          AND external_id = $3
        LIMIT 1
        `,
        [input.tenantId, channel, externalId],
      );

      const mappedLeadId = identityAfterInsert.rows[0]?.lead_id;
      if (!mappedLeadId) {
        throw new Error(
          "[LeadsRepository] createLeadWithExternalIdentity: identity mapping missing",
        );
      }

      if (String(mappedLeadId) !== lead.id) {
        const existingLead = await this.findLeadByIdTx(client, {
          tenantId: input.tenantId,
          leadId: String(mappedLeadId),
        });
        if (!existingLead) {
          throw new Error(
            "[LeadsRepository] createLeadWithExternalIdentity: mapped lead not found",
          );
        }
        await client.query(
          `
          DELETE FROM leads
          WHERE tenant_id = $1::uuid
            AND id = $2::uuid
          `,
          [input.tenantId, lead.id],
        );
        await client.query("COMMIT");
        return existingLead;
      }

      await client.query("COMMIT");
      return lead;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Insert o actualiza solo campos controlados por IdentityManager.
   * Conflicto: actualiza `updated_at`, `first_name`, `email` con COALESCE respecto
   * a fila existente; no toca `fsm_state`, `tags`, `ai_confidence_score`.
   */
  async upsertLead(input: UpsertLeadInput): Promise<LeadRecord> {
    const updatedAt = toIso(input.updatedAt);
    const firstName = emptyToNull(input.firstName ?? undefined);
    const email = emptyToNull(input.email ?? undefined);

    const res = await query<QueryResultRow>(
      `
      INSERT INTO leads (
        tenant_id,
        phone_number,
        updated_at,
        first_name,
        email
      )
      VALUES ($1::uuid, $2, $3::timestamptz, $4, $5)
      ON CONFLICT (tenant_id, phone_number)
      DO UPDATE SET
        updated_at = EXCLUDED.updated_at,
        first_name = COALESCE(EXCLUDED.first_name, leads.first_name),
        email = COALESCE(EXCLUDED.email, leads.email)
      RETURNING *
      `,
      [input.tenantId, input.phoneNumber, updatedAt, firstName, email],
    );
    const row = res.rows[0];
    if (!row) {
      throw new Error("[LeadsRepository] upsertLead: no row returned");
    }
    return mapLeadRow(row);
  }

  /**
   * Persistencia de transición FSM (Orchestrator).
   */
  async updateFsmState(input: UpdateFsmStateInput): Promise<LeadRecord | null> {
    const updatedAt = toIso(input.updatedAt);
    const res = await query<QueryResultRow>(
      `
      UPDATE leads
      SET
        fsm_state = $1,
        updated_at = $2::timestamptz
      WHERE id = $3::uuid
        AND tenant_id = $4::uuid
      RETURNING *
      `,
      [input.fsmState, updatedAt, input.leadId, input.tenantId],
    );
    const row = res.rows[0];
    return row ? mapLeadRow(row) : null;
  }

  /**
   * Alta desde webhook GHL. En conflicto solo se actualizan `updated_at`,
   * `first_name` y `email`; `tags` existentes (p. ej. del runtime) no se pisan.
   *
   * En INSERT inicial, si hay `source` / `branchId`, se guardan bajo `tags.ghl`.
   */
  async insertFromGhl(input: InsertFromGhlInput): Promise<LeadRecord> {
    const updatedAt = new Date().toISOString();
    const firstName = emptyToNull(input.firstName ?? undefined);
    const email = emptyToNull(input.email ?? undefined);
    const tagsJson = JSON.stringify(buildGhlTags(input));

    const res = await query<QueryResultRow>(
      `
      INSERT INTO leads (
        tenant_id,
        phone_number,
        first_name,
        email,
        tags,
        updated_at
      )
      VALUES (
        $1::uuid,
        $2,
        $3,
        $4,
        $5::jsonb,
        $6::timestamptz
      )
      ON CONFLICT (tenant_id, phone_number)
      DO UPDATE SET
        updated_at = EXCLUDED.updated_at,
        first_name = COALESCE(EXCLUDED.first_name, leads.first_name),
        email = COALESCE(EXCLUDED.email, leads.email)
      RETURNING *
      `,
      [
        input.tenantId,
        input.phoneNumber,
        firstName,
        email,
        tagsJson,
        updatedAt,
      ],
    );
    const row = res.rows[0];
    if (!row) {
      throw new Error("[LeadsRepository] insertFromGhl: no row returned");
    }
    return mapLeadRow(row);
  }

  private async findLeadByIdTx(
    client: PoolClient,
    input: FindLeadByIdInput,
  ): Promise<LeadRecord | null> {
    const res = await client.query<QueryResultRow>(
      `
      SELECT *
      FROM leads
      WHERE tenant_id = $1::uuid
        AND id = $2::uuid
      LIMIT 1
      `,
      [input.tenantId, input.leadId],
    );
    const row = res.rows[0];
    return row ? mapLeadRow(row) : null;
  }
}

