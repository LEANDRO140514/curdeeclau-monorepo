// ── UV-1: Lead Capture Service ───────────────────────────────
//
// Captura, valida, normaliza, persiste y sincroniza leads de
// Universidad Latino con GHL para seguimiento comercial.
//
// Autoridad: UV-0-demo-scope.md
// Fase: UV-1 (no incluye asistente IA — UV-2)
//
// Design principles:
//   - Injectable dependencies (testable with mocks)
//   - Validation before persistence (fail-fast)
//   - Dedup by phone (local + GHL)
//   - Structured pino logging
//   - No LLM, no FSM, no AI — pure capture and sync

import type {
  LeadCapturePayload,
  LeadCaptureResult,
  NormalizedLead,
  ValidationError,
} from './types';
import {
  BASE_TAGS,
  INTERES_TO_PIPELINE_STAGE,
} from './types';
import type { Logger } from 'pino';
import pino from 'pino';

// ── Injectable interfaces (testable without Postgres/GHL) ─

export interface LeadStore {
  /** Find lead by phone number within a tenant */
  findByPhone(tenantId: string, phoneNumber: string): Promise<{
    id: string;
    tenant_id: string;
    phone_number: string;
    first_name: string | null;
    email: string | null;
    tags: Record<string, unknown>;
  } | null>;

  /** Upsert lead (insert or update on conflict) */
  upsertLead(input: {
    tenantId: string;
    phoneNumber: string;
    firstName?: string | null;
    email?: string | null;
  }): Promise<{ id: string }>;
}

export interface GHLContactSync {
  /** Find contact in GHL by phone number */
  findContactByPhone(phone: string): Promise<{ id: string; tags: string[] } | null>;

  /** Create contact in GHL */
  createContact(contact: {
    firstName: string;
    lastName?: string;
    phone?: string;
    email?: string;
    tags?: string[];
    customFields?: Record<string, string>;
  }): Promise<{ id: string }>;

  /** Update contact in GHL */
  updateContact(id: string, fields: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    tags?: string[];
    customFields?: Record<string, string>;
  }): Promise<{ id: string }>;
}

// ── Error types ───────────────────────────────────────────

export class LeadCaptureError extends Error {
  validationErrors?: ValidationError[];

  constructor(message: string, validationErrors?: ValidationError[]) {
    super(message);
    this.name = 'LeadCaptureError';
    this.validationErrors = validationErrors;
  }
}

// ── Constants ─────────────────────────────────────────────

const VALID_CARRERAS = [
  'DERECHO', 'ADMINISTRACION', 'PSICOLOGIA', 'CONTADURIA',
  'INGENIERIA_SISTEMAS', 'MERCADOTECNIA', 'COMUNICACION',
  'PEDAGOGIA', 'GASTRONOMIA', 'ENFERMERIA',
];

const VALID_HORARIOS = ['MATUTINO', 'VESPERTINO', 'SABATINO', 'ONLINE'];

const VALID_CANALES = ['WHATSAPP', 'WEB', 'TELEFONO', 'FACEBOOK', 'INSTAGRAM'];

const VALID_NIVELES = ['ALTO', 'MEDIO', 'BAJO', 'SOLO_INFORMACION'];

const E164_REGEX = /^\+[1-9]\d{6,14}$/;

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 120;
const PREGUNTA_MAX_LENGTH = 500;

// ── Service ───────────────────────────────────────────────

export class LeadCaptureService {
  private readonly leadStore: LeadStore;
  private readonly ghlSync: GHLContactSync;
  private readonly logger: Logger;

  constructor(opts: {
    leadStore: LeadStore;
    ghlSync: GHLContactSync;
    logger?: Logger;
  }) {
    this.leadStore = opts.leadStore;
    this.ghlSync = opts.ghlSync;
    this.logger = opts.logger ?? pino({ level: 'info', name: 'lead-capture' });
  }

  /** Entry point: capture a lead from a UV-0 payload */
  async capture(payload: LeadCapturePayload): Promise<LeadCaptureResult> {
    // 1. Validate
    const normalized = this.validateAndNormalize(payload);

    // 2. Build tags
    const tags = this.buildTags(normalized);

    // 3. Local persistence (check existing vs new)
    const existingLead = await this.leadStore.findByPhone(
      normalized.tenantId,
      normalized.phoneNumber,
    );

    if (existingLead) {
      return this.handleExistingLead(existingLead.id, normalized, tags);
    }

    return this.handleNewLead(normalized, tags);
  }

  // ── Validation ──────────────────────────────────────────

  /** Validate payload and normalize to internal format */
  validateAndNormalize(payload: LeadCapturePayload): NormalizedLead {
    const errors: ValidationError[] = [];

    // nombre
    if (!payload.nombre || typeof payload.nombre !== 'string') {
      errors.push({ field: 'nombre', message: 'Requerido', value: payload.nombre });
    } else {
      const trimmed = payload.nombre.trim();
      if (trimmed.length < NAME_MIN_LENGTH) {
        errors.push({ field: 'nombre', message: `Minimo ${NAME_MIN_LENGTH} caracteres`, value: payload.nombre });
      }
      if (trimmed.length > NAME_MAX_LENGTH) {
        errors.push({ field: 'nombre', message: `Maximo ${NAME_MAX_LENGTH} caracteres`, value: payload.nombre });
      }
    }

    // telefono
    if (!payload.telefono || typeof payload.telefono !== 'string') {
      errors.push({ field: 'telefono', message: 'Requerido', value: payload.telefono });
    } else if (!E164_REGEX.test(payload.telefono.trim())) {
      errors.push({ field: 'telefono', message: 'Formato E.164 requerido (+521234567890)', value: payload.telefono });
    }

    // carrera_interes
    if (!payload.carrera_interes || !VALID_CARRERAS.includes(payload.carrera_interes)) {
      errors.push({
        field: 'carrera_interes',
        message: `Debe ser una de: ${VALID_CARRERAS.join(', ')}`,
        value: payload.carrera_interes,
      });
    }

    // canal_origen
    if (!payload.canal_origen || !VALID_CANALES.includes(payload.canal_origen)) {
      errors.push({
        field: 'canal_origen',
        message: `Debe ser uno de: ${VALID_CANALES.join(', ')}`,
        value: payload.canal_origen,
      });
    }

    // horario_deseado (opcional pero validado si presente)
    if (payload.horario_deseado && !VALID_HORARIOS.includes(payload.horario_deseado)) {
      errors.push({
        field: 'horario_deseado',
        message: `Debe ser uno de: ${VALID_HORARIOS.join(', ')}`,
        value: payload.horario_deseado,
      });
    }

    // nivel_interes (opcional pero validado si presente)
    if (payload.nivel_interes && !VALID_NIVELES.includes(payload.nivel_interes)) {
      errors.push({
        field: 'nivel_interes',
        message: `Debe ser uno de: ${VALID_NIVELES.join(', ')}`,
        value: payload.nivel_interes,
      });
    }

    // pregunta_inicial (opcional, max length)
    if (payload.pregunta_inicial && payload.pregunta_inicial.length > PREGUNTA_MAX_LENGTH) {
      errors.push({
        field: 'pregunta_inicial',
        message: `Maximo ${PREGUNTA_MAX_LENGTH} caracteres`,
        value: `${payload.pregunta_inicial.length} chars`,
      });
    }

    // tenantId
    if (!payload.tenantId || typeof payload.tenantId !== 'string') {
      errors.push({ field: 'tenantId', message: 'Requerido', value: payload.tenantId });
    }

    if (errors.length > 0) {
      this.logger.warn({ errors, payload: this.sanitizeForLog(payload) }, 'Lead capture validation failed');
      throw new LeadCaptureError('Validation failed', errors);
    }

    // Inferir nivel de interes si no se proporciona
    const nivelInteres = payload.nivel_interes ?? this.inferInteres(payload);

    // Split name into first/last
    const nameParts = payload.nombre.trim().split(/\s+/);
    const firstName = nameParts[0];
    // lastName is the rest — passed to GHL but not stored locally in current schema

    return {
      tenantId: payload.tenantId,
      phoneNumber: payload.telefono.trim(),
      firstName,
      email: payload.email?.trim() || null,
      carreraInteres: payload.carrera_interes,
      horarioDeseado: payload.horario_deseado ?? null,
      canalOrigen: payload.canal_origen,
      preguntaInicial: payload.pregunta_inicial?.trim() || null,
      nivelInteres,
      fuenteUtm: payload.fuente_utm?.trim() || null,
    };
  }

  // ── Tag building ────────────────────────────────────────

  private buildTags(normalized: NormalizedLead): string[] {
    const tags = [...BASE_TAGS];
    tags.push(`canal:${normalized.canalOrigen.toLowerCase()}`);
    tags.push(`carrera:${normalized.carreraInteres.toLowerCase()}`);
    tags.push(`interes:${normalized.nivelInteres.toLowerCase()}`);
    if (normalized.horarioDeseado) {
      tags.push(`horario:${normalized.horarioDeseado.toLowerCase()}`);
    }
    return tags;
  }

  // ── New lead flow ───────────────────────────────────────

  private async handleNewLead(normalized: NormalizedLead, tags: string[]): Promise<LeadCaptureResult> {
    // Persist locally
    const localLead = await this.leadStore.upsertLead({
      tenantId: normalized.tenantId,
      phoneNumber: normalized.phoneNumber,
      firstName: normalized.firstName,
      email: normalized.email,
    });

    // Sync to GHL
    let ghlContactId: string | undefined;
    let ghlSynced = false;

    try {
      const existingGhl = await this.ghlSync.findContactByPhone(normalized.phoneNumber);
      if (existingGhl) {
        // Update existing GHL contact
        const updated = await this.ghlSync.updateContact(existingGhl.id, {
          firstName: normalized.firstName,
          phone: normalized.phoneNumber,
          email: normalized.email ?? undefined,
          tags,
          customFields: this.buildCustomFields(normalized),
        });
        ghlContactId = updated.id;
        this.logger.info({ localLeadId: localLead.id, ghlContactId, action: 'ghl_updated' }, 'GHL contact updated (existing)');
      } else {
        // Create new GHL contact
        const created = await this.ghlSync.createContact({
          firstName: normalized.firstName,
          phone: normalized.phoneNumber,
          email: normalized.email ?? undefined,
          tags,
          customFields: this.buildCustomFields(normalized),
        });
        ghlContactId = created.id;
        this.logger.info({ localLeadId: localLead.id, ghlContactId, action: 'ghl_created' }, 'GHL contact created');
      }
      ghlSynced = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error({ localLeadId: localLead.id, error: message }, 'GHL sync failed');
    }

    const pipelineStage = INTERES_TO_PIPELINE_STAGE[normalized.nivelInteres];

    this.logger.info({
      localLeadId: localLead.id,
      ghlContactId,
      ghlSynced,
      pipelineStage,
      tags,
      status: 'NEW_LEAD',
      phone: this.maskPhone(normalized.phoneNumber),
    }, 'Lead captured — NEW_LEAD');

    return {
      status: 'NEW_LEAD',
      localLeadId: localLead.id,
      ghlContactId,
      pipelineStage,
      tags,
      ghlSynced,
      message: ghlSynced
        ? `Lead creado y sincronizado con GHL (etapa: ${pipelineStage})`
        : `Lead creado localmente. GHL sync pendiente.`,
    };
  }

  // ── Existing lead flow ──────────────────────────────────

  private async handleExistingLead(
    localLeadId: string,
    normalized: NormalizedLead,
    tags: string[],
  ): Promise<LeadCaptureResult> {
    // Update local
    await this.leadStore.upsertLead({
      tenantId: normalized.tenantId,
      phoneNumber: normalized.phoneNumber,
      firstName: normalized.firstName,
      email: normalized.email,
    });

    // Sync to GHL
    let ghlContactId: string | undefined;
    let ghlSynced = false;

    try {
      const existingGhl = await this.ghlSync.findContactByPhone(normalized.phoneNumber);
      if (existingGhl) {
        const mergedTags = [...new Set([...existingGhl.tags, ...tags])];
        const updated = await this.ghlSync.updateContact(existingGhl.id, {
          firstName: normalized.firstName,
          phone: normalized.phoneNumber,
          email: normalized.email ?? undefined,
          tags: mergedTags,
          customFields: this.buildCustomFields(normalized),
        });
        ghlContactId = updated.id;
        this.logger.info({ localLeadId, ghlContactId, action: 'ghl_updated' }, 'GHL contact updated (existing lead)');
      } else {
        const created = await this.ghlSync.createContact({
          firstName: normalized.firstName,
          phone: normalized.phoneNumber,
          email: normalized.email ?? undefined,
          tags,
          customFields: this.buildCustomFields(normalized),
        });
        ghlContactId = created.id;
        this.logger.info({ localLeadId, ghlContactId, action: 'ghl_created' }, 'GHL contact created (existing lead)');
      }
      ghlSynced = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error({ localLeadId, error: message }, 'GHL sync failed for existing lead');
    }

    const pipelineStage = INTERES_TO_PIPELINE_STAGE[normalized.nivelInteres];

    this.logger.info({
      localLeadId,
      ghlContactId,
      ghlSynced,
      pipelineStage,
      tags,
      status: 'EXISTING_LEAD',
      phone: this.maskPhone(normalized.phoneNumber),
    }, 'Lead captured — EXISTING_LEAD');

    return {
      status: 'EXISTING_LEAD',
      localLeadId,
      ghlContactId,
      pipelineStage,
      tags,
      ghlSynced,
      message: ghlSynced
        ? `Lead existente actualizado y sincronizado con GHL (etapa: ${pipelineStage})`
        : `Lead existente actualizado localmente. GHL sync pendiente.`,
    };
  }

  // ── Helpers ─────────────────────────────────────────────

  private buildCustomFields(normalized: NormalizedLead): Record<string, string> {
    const fields: Record<string, string> = {
      carrera_interes: normalized.carreraInteres,
      nivel_interes: normalized.nivelInteres,
      canal_origen: normalized.canalOrigen,
    };
    if (normalized.horarioDeseado) {
      fields.horario_deseado = normalized.horarioDeseado;
    }
    if (normalized.preguntaInicial) {
      fields.pregunta_inicial = normalized.preguntaInicial.slice(0, 500);
    }
    if (normalized.fuenteUtm) {
      fields.fuente_utm = normalized.fuenteUtm;
    }
    return fields;
  }

  private inferInteres(payload: LeadCapturePayload): 'ALTO' | 'MEDIO' | 'BAJO' | 'SOLO_INFORMACION' {
    // Simple heuristic based on available signals
    const pregunta = payload.pregunta_inicial?.toLowerCase() ?? '';

    const highSignals = ['inscribir', 'inscripcion', 'documentos', 'fecha limite', 'cuanto cuesta', 'costo', 'precio', 'iniciar', 'empezar'];
    const mediumSignals = ['carreras', 'plan de estudios', 'horarios', 'modalidad', 'duracion'];
    const lowSignals = ['que carreras', 'tienen', 'ofrecen', 'informacion'];

    if (highSignals.some((s) => pregunta.includes(s))) return 'ALTO';
    if (mediumSignals.some((s) => pregunta.includes(s))) return 'MEDIO';
    if (pregunta.length > 10 && lowSignals.some((s) => pregunta.includes(s))) return 'BAJO';
    if (pregunta.length > 0) return 'MEDIO'; // default: if they asked something, they have some interest

    return 'SOLO_INFORMACION';
  }

  private maskPhone(phone: string): string {
    if (phone.length <= 6) return '***';
    return phone.slice(0, 4) + '***' + phone.slice(-2);
  }

  private sanitizeForLog(payload: LeadCapturePayload): Record<string, unknown> {
    return {
      ...payload,
      telefono: this.maskPhone(payload.telefono ?? ''),
    };
  }
}
