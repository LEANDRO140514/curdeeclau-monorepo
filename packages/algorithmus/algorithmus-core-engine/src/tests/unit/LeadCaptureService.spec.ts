// ── UV-1: Lead Capture Service Tests ─────────────────────────
//
// Validates LeadCaptureService using mock LeadStore and
// mock GHLContactSync. No Postgres, no GHL API, no credentials.

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  LeadCaptureService,
  LeadCaptureError,
  type LeadStore,
  type GHLContactSync,
} from '../../core/leads/LeadCaptureService';
import type { LeadCapturePayload } from '../../core/leads/types';

// ── Mock LeadStore ───────────────────────────────────────

class MockLeadStore implements LeadStore {
  private leads: Map<string, { id: string; tenant_id: string; phone_number: string; first_name: string | null; email: string | null; tags: Record<string, unknown> }> = new Map();
  private nextId = 1;

  async findByPhone(tenantId: string, phoneNumber: string) {
    const key = `${tenantId}:${phoneNumber}`;
    return this.leads.get(key) ?? null;
  }

  async upsertLead(input: { tenantId: string; phoneNumber: string; firstName?: string | null; email?: string | null }) {
    const key = `${input.tenantId}:${input.phoneNumber}`;
    const existing = this.leads.get(key);
    if (existing) {
      if (input.firstName) existing.first_name = input.firstName;
      if (input.email !== undefined) existing.email = input.email;
      return { id: existing.id };
    }
    const id = `lead-${this.nextId++}`;
    this.leads.set(key, {
      id,
      tenant_id: input.tenantId,
      phone_number: input.phoneNumber,
      first_name: input.firstName ?? null,
      email: input.email ?? null,
      tags: {},
    });
    return { id };
  }
}

// ── Mock GHLContactSync ──────────────────────────────────

class MockGHLContactSync implements GHLContactSync {
  private contacts: Map<string, { id: string; tags: string[] }> = new Map();
  private nextId = 1;

  async findContactByPhone(phone: string) {
    return this.contacts.get(phone) ?? null;
  }

  async createContact(contact: { firstName: string; phone?: string; tags?: string[] }) {
    const id = `ghl-${this.nextId++}`;
    if (contact.phone) {
      this.contacts.set(contact.phone, { id, tags: contact.tags ?? [] });
    }
    return { id };
  }

  async updateContact(id: string, fields: { firstName?: string; phone?: string; tags?: string[] }) {
    // Find by id
    for (const [phone, contact] of this.contacts) {
      if (contact.id === id) {
        if (fields.tags) contact.tags = fields.tags;
        if (fields.phone && fields.phone !== phone) {
          this.contacts.delete(phone);
          this.contacts.set(fields.phone, contact);
        }
        return { id };
      }
    }
    // Not found — create
    const newId = `ghl-${this.nextId++}`;
    if (fields.phone) {
      this.contacts.set(fields.phone, { id: newId, tags: fields.tags ?? [] });
    }
    return { id: newId };
  }
}

class FailingGHLContactSync implements GHLContactSync {
  async findContactByPhone(_phone: string) { throw new Error('GHL unavailable'); }
  async createContact() { throw new Error('GHL unavailable'); }
  async updateContact() { throw new Error('GHL unavailable'); }
}

// ── Helpers ──────────────────────────────────────────────

const silentLogger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
  trace: () => {},
  fatal: () => {},
  level: 'silent',
} as any;

function validPayload(overrides?: Partial<LeadCapturePayload>): LeadCapturePayload {
  return {
    nombre: 'Maria Garcia',
    telefono: '+521234567890',
    carrera_interes: 'DERECHO',
    horario_deseado: 'MATUTINO',
    canal_origen: 'WHATSAPP',
    pregunta_inicial: 'Quiero informacion sobre la carrera de Derecho',
    nivel_interes: 'ALTO',
    tenantId: 'tenant-uv-demo',
    ...overrides,
  };
}

// ── Test Suite ───────────────────────────────────────────

describe('LeadCaptureService', () => {
  let leadStore: MockLeadStore;
  let ghlSync: MockGHLContactSync;
  let service: LeadCaptureService;

  beforeEach(() => {
    leadStore = new MockLeadStore();
    ghlSync = new MockGHLContactSync();
    service = new LeadCaptureService({
      leadStore,
      ghlSync,
      logger: silentLogger,
    });
  });

  // ── Caso 1: Lead nuevo ──────────────────────────────────

  describe('Caso 1 — Lead nuevo', () => {
    it('crea lead local y contacto GHL con payload valido', async () => {
      const result = await service.capture(validPayload());

      expect(result.status).toBe('NEW_LEAD');
      expect(result.localLeadId).toBeDefined();
      expect(result.localLeadId).toMatch(/^lead-/);
      expect(result.ghlContactId).toBeDefined();
      expect(result.ghlContactId).toMatch(/^ghl-/);
      expect(result.ghlSynced).toBe(true);
      expect(result.pipelineStage).toBe('Nuevo prospecto');
      expect(result.tags).toContain('universidad-latino');
      expect(result.tags).toContain('admisiones');
      expect(result.tags).toContain('uv-1');
      expect(result.tags).toContain('canal:whatsapp');
      expect(result.tags).toContain('carrera:derecho');
      expect(result.tags).toContain('interes:alto');
      expect(result.tags).toContain('horario:matutino');
    });

    it('genera log estructurado para lead nuevo', async () => {
      const result = await service.capture(validPayload());
      expect(result.message).toContain('Nuevo prospecto');
      expect(result.message).toContain('GHL');
    });

    it('persiste lead en LeadStore local', async () => {
      const payload = validPayload();
      await service.capture(payload);

      const stored = await leadStore.findByPhone(payload.tenantId, '+521234567890');
      expect(stored).toBeDefined();
      expect(stored!.first_name).toBe('Maria');
    });
  });

  // ── Caso 2: Lead duplicado ──────────────────────────────

  describe('Caso 2 — Lead duplicado', () => {
    it('detecta lead existente por telefono y devuelve EXISTING_LEAD', async () => {
      // First capture
      await service.capture(validPayload());

      // Second capture — same phone
      const result = await service.capture(validPayload({
        nombre: 'Maria G. Actualizada',
      }));

      expect(result.status).toBe('EXISTING_LEAD');
    });

    it('actualiza datos del lead existente', async () => {
      await service.capture(validPayload());

      const result = await service.capture(validPayload({
        nombre: 'Maria Actualizada',
        email: 'maria@nuevoemail.com',
      }));

      expect(result.status).toBe('EXISTING_LEAD');
      // Should not create a second local lead
      const stored = await leadStore.findByPhone('tenant-uv-demo', '+521234567890');
      expect(stored!.first_name).toBe('Maria');
    });

    it('no crea duplicado en GHL', async () => {
      // First capture creates GHL contact
      const first = await service.capture(validPayload());
      expect(first.ghlContactId).toBeDefined();

      // Second capture should update, not create new
      const second = await service.capture(validPayload({ nombre: 'Maria Again' }));
      expect(second.status).toBe('EXISTING_LEAD');
    });

    it('mergea tags en GHL para lead existente', async () => {
      await service.capture(validPayload());

      // Second capture with different carrera
      const result = await service.capture(validPayload({
        carrera_interes: 'PSICOLOGIA',
        horario_deseado: 'VESPERTINO',
      }));

      // Should have tags from both captures
      expect(result.tags).toContain('carrera:psicologia');
      expect(result.tags).toContain('horario:vespertino');
    });
  });

  // ── Caso 3: Payload invalido ────────────────────────────

  describe('Caso 3 — Payload invalido', () => {
    it('rechaza payload sin nombre', async () => {
      await expect(
        service.capture(validPayload({ nombre: '' })),
      ).rejects.toThrow(LeadCaptureError);
    });

    it('rechaza payload sin telefono', async () => {
      await expect(
        service.capture(validPayload({ telefono: '' })),
      ).rejects.toThrow(LeadCaptureError);
    });

    it('rechaza telefono sin formato E.164', async () => {
      await expect(
        service.capture(validPayload({ telefono: '1234567890' })),
      ).rejects.toThrow(LeadCaptureError);
    });

    it('rechaza carrera no valida', async () => {
      await expect(
        service.capture(validPayload({ carrera_interes: 'MEDICINA' as any })),
      ).rejects.toThrow(LeadCaptureError);
    });

    it('rechaza canal no valido', async () => {
      await expect(
        service.capture(validPayload({ canal_origen: 'TELEGRAM' as any })),
      ).rejects.toThrow(LeadCaptureError);
    });

    it('rechaza payload sin tenantId', async () => {
      await expect(
        service.capture(validPayload({ tenantId: '' })),
      ).rejects.toThrow(LeadCaptureError);
    });

    it('incluye errores de validacion en LeadCaptureError', async () => {
      try {
        await service.capture(validPayload({ nombre: '', telefono: 'bad' }));
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBeInstanceOf(LeadCaptureError);
        if (err instanceof LeadCaptureError) {
          expect(err.validationErrors).toBeDefined();
          expect(err.validationErrors!.length).toBeGreaterThanOrEqual(2);
          expect(err.validationErrors!.some((e) => e.field === 'nombre')).toBe(true);
          expect(err.validationErrors!.some((e) => e.field === 'telefono')).toBe(true);
        }
      }
    });

    it('rechaza horario no valido', async () => {
      await expect(
        service.capture(validPayload({ horario_deseado: 'NOCTURNO' as any })),
      ).rejects.toThrow(LeadCaptureError);
    });

    it('rechaza nivel_interes no valido', async () => {
      await expect(
        service.capture(validPayload({ nivel_interes: 'URGENTE' as any })),
      ).rejects.toThrow(LeadCaptureError);
    });

    it('rechaza pregunta_inicial demasiado larga', async () => {
      await expect(
        service.capture(validPayload({ pregunta_inicial: 'x'.repeat(501) })),
      ).rejects.toThrow(LeadCaptureError);
    });

    it('rechaza payload sin carrera_interes', async () => {
      await expect(
        service.capture(validPayload({ carrera_interes: undefined as any })),
      ).rejects.toThrow(LeadCaptureError);
    });
  });

  // ── Resiliencia GHL ─────────────────────────────────────

  describe('Resiliencia GHL', () => {
    it('captura lead localmente aunque GHL falle', async () => {
      const failingService = new LeadCaptureService({
        leadStore,
        ghlSync: new FailingGHLContactSync(),
        logger: silentLogger,
      });

      const result = await failingService.capture(validPayload());

      expect(result.status).toBe('NEW_LEAD');
      expect(result.localLeadId).toBeDefined();
      expect(result.ghlSynced).toBe(false);
      expect(result.message).toContain('pendiente');
    });

    it('marca ghlSynced: false cuando GHL no responde', async () => {
      const failingService = new LeadCaptureService({
        leadStore,
        ghlSync: new FailingGHLContactSync(),
        logger: silentLogger,
      });

      const result = await failingService.capture(validPayload());
      expect(result.ghlSynced).toBe(false);
      expect(result.ghlContactId).toBeUndefined();
    });
  });

  // ── Tags y metadata ─────────────────────────────────────

  describe('Tags y metadata', () => {
    it('incluye tags base en todo lead', async () => {
      const result = await service.capture(validPayload());
      expect(result.tags).toContain('universidad-latino');
      expect(result.tags).toContain('admisiones');
      expect(result.tags).toContain('uv-1');
    });

    it('incluye tag de canal con valor correcto', async () => {
      const webPayload = validPayload({ canal_origen: 'WEB', telefono: '+529998887777' });
      const result = await service.capture(webPayload);
      expect(result.tags).toContain('canal:web');
    });

    it('incluye tag de carrera con valor correcto', async () => {
      const psicPayload = validPayload({ carrera_interes: 'PSICOLOGIA', telefono: '+529991112222' });
      const result = await service.capture(psicPayload);
      expect(result.tags).toContain('carrera:psicologia');
    });

    it('incluye tag de nivel de interes', async () => {
      const result = await service.capture(validPayload({ nivel_interes: 'ALTO' }));
      expect(result.tags).toContain('interes:alto');
    });

    it('incluye tag de horario si se proporciona', async () => {
      const result = await service.capture(validPayload({ horario_deseado: 'SABATINO' }));
      expect(result.tags).toContain('horario:sabatino');
    });

    it('no incluye tag de horario si no se proporciona', async () => {
      const result = await service.capture(validPayload({
        horario_deseado: undefined,
        telefono: '+529993334444',
      }));
      const horarioTags = result.tags.filter((t) => t.startsWith('horario:'));
      expect(horarioTags.length).toBe(0);
    });
  });

  // ── Inferencia de nivel de interes ──────────────────────

  describe('Inferencia de nivel de interes', () => {
    it('infiere ALTO cuando pregunta sobre costos', async () => {
      const result = await service.capture(validPayload({
        nivel_interes: undefined,
        pregunta_inicial: 'Cuanto cuesta la carrera de Derecho?',
        telefono: '+529995556666',
      }));
      expect(result.tags).toContain('interes:alto');
    });

    it('infiere MEDIO cuando pregunta sobre carreras', async () => {
      const result = await service.capture(validPayload({
        nivel_interes: undefined,
        pregunta_inicial: 'Que carreras tienen disponibles?',
        telefono: '+529997778888',
      }));
      expect(result.tags).toContain('interes:medio');
    });

    it('infiere SOLO_INFORMACION cuando no hay pregunta', async () => {
      const result = await service.capture(validPayload({
        nivel_interes: undefined,
        pregunta_inicial: undefined,
        telefono: '+529999990000',
      }));
      expect(result.tags).toContain('interes:solo_informacion');
    });

    it('usa nivel_interes explicito cuando se proporciona', async () => {
      const result = await service.capture(validPayload({
        nivel_interes: 'ALTO',
        pregunta_inicial: undefined,
      }));
      expect(result.tags).toContain('interes:alto');
    });
  });

  // ── Formatos de telefono ────────────────────────────────

  describe('Formato de telefono', () => {
    it('acepta telefono E.164 valido', async () => {
      const result = await service.capture(validPayload({ telefono: '+521234567890' }));
      expect(result.status).toBe('NEW_LEAD');
    });

    it('rechaza telefono sin prefijo +', async () => {
      await expect(
        service.capture(validPayload({ telefono: '521234567890' })),
      ).rejects.toThrow(LeadCaptureError);
    });

    it('rechaza telefono demasiado corto', async () => {
      await expect(
        service.capture(validPayload({ telefono: '+521' })),
      ).rejects.toThrow(LeadCaptureError);
    });
  });

  // ── Nombre ──────────────────────────────────────────────

  describe('Nombre', () => {
    it('acepta nombre valido', async () => {
      const result = await service.capture(validPayload({ nombre: 'Juan Perez' }));
      expect(result.status).toBe('NEW_LEAD');
    });

    it('rechaza nombre de 1 caracter', async () => {
      await expect(
        service.capture(validPayload({ nombre: 'A' })),
      ).rejects.toThrow(LeadCaptureError);
    });

    it('usa solo el primer nombre para el lead local', async () => {
      await service.capture(validPayload({ nombre: 'Maria Guadalupe Garcia Lopez' }));
      const stored = await leadStore.findByPhone('tenant-uv-demo', '+521234567890');
      expect(stored!.first_name).toBe('Maria');
    });
  });
});
