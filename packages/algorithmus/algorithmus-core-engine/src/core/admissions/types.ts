// ── UV-2: AI Admissions Assistant Types ──────────────────────
//
// Conversation state, input/output types, and knowledge base
// types for the Universidad Latino AI Admissions Assistant.
//
// Autoridad: UV-0, UV-1, UV-2

import type { Carrera, Horario, CanalOrigen, NivelInteres, LeadCapturePayload } from '../leads/types';

// ── Conversation State ────────────────────────────────────

export type AdmissionsConversationState =
  | 'GREETING'
  | 'COLLECTING'
  | 'CONFIRMING'
  | 'CAPTURING'
  | 'DONE'
  | 'ERROR';

// ── Collected Lead Data ───────────────────────────────────

/** Datos recolectados durante la conversacion */
export interface AdmissionsCollectedLeadData {
  nombre: string | null;
  telefono: string | null;
  carrera_interes: Carrera | null;
  horario_deseado: Horario | null;
  canal_origen: CanalOrigen | null;
  nivel_interes: NivelInteres | null;
}

/** Campos que el asistente debe recolectar */
export const REQUIRED_FIELDS: (keyof AdmissionsCollectedLeadData)[] = [
  'nombre',
  'telefono',
  'carrera_interes',
  'horario_deseado',
  'canal_origen',
];

/** Orden sugerido para solicitar campos faltantes */
export const FIELD_PROMPTS: Record<keyof AdmissionsCollectedLeadData, string> = {
  nombre: 'Cual es tu nombre completo?',
  telefono: 'Cual es tu numero de telefono con codigo de pais? Por ejemplo: +52 123 456 7890',
  carrera_interes: 'Que carrera te interesa estudiar?',
  horario_deseado: 'En que horario te gustaria estudiar? Tenemos Matutino, Vespertino, Sabatino y Online.',
  canal_origen: 'Por que medio nos contactaste? WhatsApp, Web, Telefono, Facebook o Instagram?',
  nivel_interes: '',
};

// ── Assistant Input/Output ────────────────────────────────

export interface AdmissionsAssistantInput {
  /** Mensaje del usuario */
  userMessage: string;
  /** Estado de la conversacion actual */
  state: AdmissionsConversationState;
  /** Datos recolectados hasta ahora */
  collectedData: AdmissionsCollectedLeadData;
  /** Tenant ID */
  tenantId: string;
  /** Canal de origen (si ya se conoce, se puede pre-llenar) */
  defaultCanal?: CanalOrigen;
}

export interface AdmissionsAssistantResponse {
  /** Texto de respuesta para el usuario */
  reply: string;
  /** Nuevo estado de la conversacion */
  newState: AdmissionsConversationState;
  /** Datos recolectados actualizados */
  collectedData: AdmissionsCollectedLeadData;
  /** Payload listo para LeadCaptureService (solo si newState es CAPTURING) */
  capturePayload?: LeadCapturePayload;
  /** Siguiente campo que se debe solicitar */
  nextField?: keyof AdmissionsCollectedLeadData;
  /** Indica si la conversacion termino */
  conversationEnded: boolean;
}

// ── Knowledge Base ────────────────────────────────────────

export interface AdmissionsKnowledge {
  /** Contenido del FAQ markdown */
  faq: string;
  /** Contenido de la oferta academica markdown */
  ofertaAcademica: string;
  /** Catalogo de carreras como tabla markdown (desde CSV) */
  catalogoCarreras?: string;
  /** Sistema de prompt template */
  systemPromptTemplate: string;
}

// ── Assistant Config ──────────────────────────────────────

export interface AIAdmissionsAssistantConfig {
  /** Default tenant ID */
  tenantId: string;
  /** Default canal de origen */
  defaultCanal?: CanalOrigen;
  /** Knowledge base content */
  knowledge: AdmissionsKnowledge;
}
