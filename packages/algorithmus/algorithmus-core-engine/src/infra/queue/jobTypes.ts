import type { FSMState } from "../../core/fsm/FSMEngine";

export const WHATSAPP_INBOUND_QUEUE = "whatsapp_inbound";

/** Nombre del job dentro de la cola (BullMQ `Queue#add`). */
export const WHATSAPP_INBOUND_JOB_NAME = "whatsapp_inbound";

const FSM_STATES: readonly FSMState[] = [
  "INIT",
  "QUALIFYING",
  "SUPPORT_RAG",
  "BOOKING",
  "HUMAN_HANDOVER",
];

/** Coerción alineada con el webhook (estado inválido → INIT). */
export function coerceJobFsmState(raw: string): FSMState {
  return FSM_STATES.includes(raw as FSMState) ? (raw as FSMState) : "INIT";
}

export interface WhatsAppInboundJobPayload {
  tenantId: string;
  leadId: string;
  /** Serializado como string en Redis/BullMQ; se coerciona en el worker. */
  currentState: string;
  traceId: string;

  inboundMessage: {
    messageId: string;
    from: string;
    text: string;
    channel: string;
    timestamp?: number;
  };
}
