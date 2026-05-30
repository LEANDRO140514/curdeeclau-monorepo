// ── PostgresCRMProvider Integration Tests ─────────────────
//
// BV-2: Lead persistence in PostgreSQL via PostgresCRMProvider.
// Uses a real PostgreSQL database — requires DATABASE_URL env var.
// Skips all tests gracefully if DATABASE_URL is not set.
//
// Acceptance criteria:
//   1. createContact → INSERT into leads + lead_external_identities
//   2. findContactByProviderId → finds by (channel, external_id)
//   3. New provider instance → lead survives (persistence verified)
//   4. updateContact with providerIds → UPSERT into lead_external_identities
//   5. LeadStore with PostgresCRMProvider → identifies NEW_LEAD / EXISTING_LEAD

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { PostgresCRMProvider } from '../PostgresCRMProvider';
import { LeadStore } from '../LeadStore';
import type { CRMContact } from '@curdeeclau/shared';

const DATABASE_URL = process.env.DATABASE_URL;
const TEST_TENANT_ID = process.env.ALGORITHMUS_TENANT_ID ?? 'b0000000-0000-0000-0000-000000000001';

// Use a unique channel prefix per test run to avoid cross-test pollution
const TEST_PREFIX = `bv2_test_${Date.now().toString(36)}`;

function testChannel(): string {
  return `${TEST_PREFIX}_telegram`;
}

function testExternalId(suffix: string): string {
  return `${TEST_PREFIX}_${suffix}`;
}

// ── Skip if no database ─────────────────────────────────────

const describeWithDb = DATABASE_URL ? describe : describe.skip;

if (!DATABASE_URL) {
  console.warn('[bv-2] DATABASE_URL not set — PostgresCRMProvider integration tests will be SKIPPED');
  console.warn('[bv-2] Set DATABASE_URL to run: DATABASE_URL=postgres://... npx vitest run');
}

// ── Tests ───────────────────────────────────────────────────

describeWithDb('PostgresCRMProvider — PostgreSQL persistence', () => {
  let pool: Pool;
  let provider: PostgresCRMProvider;

  beforeAll(() => {
    pool = new Pool({ connectionString: DATABASE_URL });
    provider = new PostgresCRMProvider(pool, TEST_TENANT_ID);
  });

  afterAll(async () => {
    // Clean up test data
    const client = await pool.connect();
    try {
      await client.query(
        `DELETE FROM lead_external_identities WHERE tenant_id = $1::uuid AND channel LIKE $2`,
        [TEST_TENANT_ID, `${TEST_PREFIX}%`],
      );
      await client.query(
        `DELETE FROM leads WHERE tenant_id = $1::uuid AND phone_number LIKE $2`,
        [TEST_TENANT_ID, '__ext__:%'],
      );
    } finally {
      client.release();
      await pool.end();
    }
  });

  describe('createContact + getContact', () => {
    it('debe persistir un lead en PostgreSQL y recuperarlo', async () => {
      const contact = await provider.createContact({
        name: 'BV-2 Test User',
        source: testChannel(),
        tags: ['test', 'bv2'],
      });

      expect(contact.id).toMatch(/^cnt_/);
      expect(contact.source).toBe(testChannel());

      // Recuperar por ID
      const retrieved = await provider.getContact(contact.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(contact.id);
      expect(retrieved!.name).toBe('BV-2 Test User');
      expect(retrieved!.tags).toEqual(['test', 'bv2']);
      expect(retrieved!.createdAt).toBeGreaterThan(0);
      expect(retrieved!.updatedAt).toBeGreaterThan(0);
    });

    it('debe devolver undefined para contacto inexistente', async () => {
      const result = await provider.getContact('cnt_ffffffff-ffff-ffff-ffff-ffffffffffff');
      expect(result).toBeUndefined();
    });
  });

  describe('findContactByProviderId', () => {
    it('debe encontrar lead por (channel, external_id) después de updateContact', async () => {
      const contact = await provider.createContact({
        name: 'Find Test',
        source: testChannel(),
      });

      // Register external identity via updateContact (simulates LeadStore flow)
      const extId = testExternalId('find_me');
      await provider.updateContact(contact.id, {
        providerIds: { [testChannel()]: extId },
      });

      const found = await provider.findContactByProviderId(testChannel(), extId);
      expect(found).toBeDefined();
      expect(found!.id).toBe(contact.id);
      expect(found!.providerIds[testChannel()]).toBe(extId);
    });

    it('debe devolver undefined para combinación (channel, external_id) inexistente', async () => {
      const result = await provider.findContactByProviderId(
        'nonexistent',
        'no-such-id',
      );
      expect(result).toBeUndefined();
    });
  });

  describe('updateContact', () => {
    it('debe actualizar campos escalares y providerIds', async () => {
      const contact = await provider.createContact({
        name: 'Before Update',
        source: testChannel(),
      });

      const updated = await provider.updateContact(contact.id, {
        firstName: 'Updated',
        email: 'updated@test.com',
        providerIds: { ghl: 'ghl_test_123' },
      });

      expect(updated.firstName).toBe('Updated');
      expect(updated.email).toBe('updated@test.com');
      expect(updated.providerIds.ghl).toBe('ghl_test_123');
      expect(updated.updatedAt).toBeGreaterThan(contact.updatedAt);
      // Campos no modificados deben conservarse
      expect(updated.name).toBe(contact.name);
    });

    it('debe hacer merge de providerIds sin perder los existentes', async () => {
      const contact = await provider.createContact({
        name: 'Merge Test',
        source: testChannel(),
      });

      // First update — add telegram
      await provider.updateContact(contact.id, {
        providerIds: { telegram: 'tg_111' },
      });

      // Second update — add ghl (should NOT lose telegram)
      await provider.updateContact(contact.id, {
        providerIds: { ghl: 'ghl_222' },
      });

      const reloaded = await provider.getContact(contact.id);
      expect(reloaded!.providerIds.telegram).toBe('tg_111');
      expect(reloaded!.providerIds.ghl).toBe('ghl_222');
    });
  });

  describe('tags', () => {
    it('debe agregar y eliminar tags', async () => {
      const contact = await provider.createContact({
        name: 'Tag Test',
        source: testChannel(),
        tags: ['initial'],
      });

      const withTag = await provider.addTag(contact.id, 'vip');
      expect(withTag.tags).toContain('initial');
      expect(withTag.tags).toContain('vip');

      const withoutTag = await provider.removeTag(contact.id, 'initial');
      expect(withoutTag.tags).not.toContain('initial');
      expect(withoutTag.tags).toContain('vip');
    });

    it('no debe duplicar tags', async () => {
      const contact = await provider.createContact({
        name: 'Dup Test',
        source: testChannel(),
        tags: ['tag1'],
      });

      const result = await provider.addTag(contact.id, 'tag1');
      expect(result.tags.filter((t) => t === 'tag1').length).toBe(1);
    });
  });

  describe('Persistencia entre reinicios (critical BV-2 criterion)', () => {
    it('debe sobrevivir a la creación de una nueva instancia del provider', async () => {
      // 1. Crear lead con provider A
      const providerA = new PostgresCRMProvider(pool, TEST_TENANT_ID);
      const extId = testExternalId('survivor');

      const contact = await providerA.createContact({
        name: 'Survivor Lead',
        source: testChannel(),
      });
      await providerA.updateContact(contact.id, {
        providerIds: { [testChannel()]: extId },
      });

      // 2. Simular "reinicio": nueva instancia del provider (mismo pool, misma DB)
      const providerB = new PostgresCRMProvider(pool, TEST_TENANT_ID);

      // 3. Buscar lead por providerId — debe encontrarlo en PostgreSQL
      const survived = await providerB.findContactByProviderId(testChannel(), extId);
      expect(survived).toBeDefined();
      expect(survived!.id).toBe(contact.id);
      expect(survived!.name).toBe('Survivor Lead');
      expect(survived!.providerIds[testChannel()]).toBe(extId);
    });
  });

  describe('LeadStore con PostgresCRMProvider', () => {
    it('debe identificar NEW_LEAD en primera llamada con PostgresCRMProvider', async () => {
      const pgProvider = new PostgresCRMProvider(pool, TEST_TENANT_ID);
      const store = new LeadStore(pgProvider);
      const channel = testChannel();
      const extId = testExternalId('ls_new');

      const result = await store.identify(channel, extId);

      expect(result.status).toBe('NEW_LEAD');
      expect(result.lead.id).toMatch(/^cnt_/);
      expect(result.lead.providerIds[channel]).toBe(extId);
    });

    it('debe identificar EXISTING_LEAD en segunda llamada con mismo (channel, external_id)', async () => {
      const pgProvider = new PostgresCRMProvider(pool, TEST_TENANT_ID);
      const store = new LeadStore(pgProvider);
      const channel = testChannel();
      const extId = testExternalId('ls_existing');

      const first = await store.identify(channel, extId);
      expect(first.status).toBe('NEW_LEAD');

      const second = await store.identify(channel, extId);
      expect(second.status).toBe('EXISTING_LEAD');
      expect(second.lead.id).toBe(first.lead.id);
    });

    it('LeadStore sin argumentos debe seguir usando InMemoryCRMProvider (backward compat)', async () => {
      // Default constructor: no provider → InMemoryCRMProvider
      const store = new LeadStore();
      const result = await store.identify('telegram', 'backward_compat_test');

      expect(result.status).toBe('NEW_LEAD');
      expect(result.lead.id).toMatch(/^cnt_/);

      // Second call returns EXISTING_LEAD (in-memory)
      const second = await store.identify('telegram', 'backward_compat_test');
      expect(second.status).toBe('EXISTING_LEAD');
    });
  });

  describe('Non-BV-2 methods', () => {
    it('debe lanzar error en createOpportunity (no implementado)', async () => {
      await expect(provider.createOpportunity({} as never)).rejects.toThrow('BV-2 scope');
    });

    it('debe lanzar error en createPipeline (no implementado)', async () => {
      await expect(provider.createPipeline({} as never)).rejects.toThrow('BV-2 scope');
    });

    it('debe lanzar error en createCampaign (no implementado)', async () => {
      await expect(provider.createCampaign({} as never)).rejects.toThrow('BV-2 scope');
    });
  });
});
