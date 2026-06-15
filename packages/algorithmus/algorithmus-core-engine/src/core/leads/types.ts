// ── UV-1: Lead Capture Types ──────────────────────────────
//
// Payload and result types for Universidad Latino lead capture.
// Defined in UV-0-demo-scope.md sections 5 and 9.

/** Oferta academica minima — UV-0 seccion 7 */
export type Carrera =
  | 'DERECHO'
  | 'ADMINISTRACION'
  | 'PSICOLOGIA'
  | 'CONTADURIA'
  | 'INGENIERIA_SISTEMAS'
  | 'MERCADOTECNIA'
  | 'COMUNICACION'
  | 'PEDAGOGIA'
  | 'GASTRONOMIA'
  | 'ENFERMERIA';

/** Horarios disponibles — UV-0 seccion 7 */
export type Horario = 'MATUTINO' | 'VESPERTINO' | 'SABATINO' | 'ONLINE';

/** Canal de origen — UV-0 seccion 5 */
export type CanalOrigen = 'WHATSAPP' | 'WEB' | 'TELEFONO' | 'FACEBOOK' | 'INSTAGRAM';

/** Nivel de interes — UV-0 seccion 5 */
export type NivelInteres = 'ALTO' | 'MEDIO' | 'BAJO' | 'SOLO_INFORMACION';

/** UV-0 Lead Capture Payload — seccion 5 */
export interface LeadCapturePayload {
  /** Nombre completo del prospecto — REQUERIDO */
  nombre: string;
  /** Telefono en formato E.164 — REQUERIDO */
  telefono: string;
  /** Carrera de interes — REQUERIDO */
  carrera_interes: Carrera;
  /** Horario deseado — RECOMENDADO */
  horario_deseado?: Horario;
  /** Canal de origen — REQUERIDO */
  canal_origen: CanalOrigen;
  /** Pregunta o intencion inicial — RECOMENDADO */
  pregunta_inicial?: string;
  /** Nivel de interes detectado — RECOMENDADO (puede ser automatico) */
  nivel_interes?: NivelInteres;
  /** Email — OPCIONAL */
  email?: string;
  /** UTM source — OPCIONAL */
  fuente_utm?: string;
  /** Tenant ID */
  tenantId: string;
}

/** Resultado de la captura de lead */
export interface LeadCaptureResult {
  /** Estado de la operacion */
  status: 'NEW_LEAD' | 'EXISTING_LEAD';
  /** ID del lead en persistencia local */
  localLeadId: string;
  /** GHL Contact ID (si se sincronizo) */
  ghlContactId?: string;
  /** Etapa del pipeline en GHL */
  pipelineStage: string;
  /** Tags aplicados al lead */
  tags: string[];
  /** Indica si hubo sincronizacion con GHL */
  ghlSynced: boolean;
  /** Mensaje descriptivo para logs */
  message: string;
}

/** Errores de validacion */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/** Resultado de validacion */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  normalized?: NormalizedLead;
}

/** Lead normalizado listo para persistencia y sync */
export interface NormalizedLead {
  tenantId: string;
  phoneNumber: string;
  firstName: string;
  email: string | null;
  carreraInteres: Carrera;
  horarioDeseado: Horario | null;
  canalOrigen: CanalOrigen;
  preguntaInicial: string | null;
  nivelInteres: NivelInteres;
  fuenteUtm: string | null;
}

/** Mapeo de nivel de interes a etapa del pipeline GHL */
export const INTERES_TO_PIPELINE_STAGE: Record<NivelInteres, string> = {
  ALTO: 'Nuevo prospecto',
  MEDIO: 'Nuevo prospecto',
  BAJO: 'Nuevo prospecto',
  SOLO_INFORMACION: 'Nuevo prospecto',
};

/** Tags base para todo lead UV-1 */
export const BASE_TAGS = ['universidad-latino', 'admisiones', 'uv-1'];
