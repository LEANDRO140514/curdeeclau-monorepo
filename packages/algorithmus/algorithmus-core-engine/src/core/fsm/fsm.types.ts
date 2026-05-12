export type FSMState =
  | "INIT"
  | "QUALIFYING"
  | "SUPPORT_RAG"
  | "BOOKING"
  | "HUMAN_HANDOVER";

export type FSMAction =
  | "classify_intent"
  | "extract_slots"
  | "query_rag"
  | "book_appointment"
  | "handover_human"
  | "reply";

export type ExtractedData = {
  intent?: "venta" | "soporte";
  qualifyingComplete?: boolean;
  lowRagConfidence?: boolean;
  ragConfidence?: number;
  ragAttempts?: number;
  bookingAvailabilityMissing?: boolean;
  bookingConfirmed?: boolean;
};

export type FSMContext = {
  leadId: string;
  tenantId: string;
  currentState: FSMState;
  message: string;
  traceId?: string;
  extractedData?: ExtractedData;
  /**
   * Conjunto de acciones IA permitidas dado `currentState`.
   *
   * Derivado por `getAllowedActionsForState(currentState)`. Lo popula el
   * orquestador antes de construir el `ValidationContext` para que el
   * validator pueda auditar `expectedAction` sin acoplarse al `FSMEngine`.
   *
   * Opcional para preservar compatibilidad con consumidores legacy del tipo;
   * el validator trata `undefined` como conjunto vacío -> `isWithinFSM=false`.
   */
  readonly allowedActions?: readonly string[];
};

export type FSMResult = {
  nextState: FSMState;
  action: FSMAction;
};

export type FSMTransitionReasonCode =
  | "transition_allowed"
  | "transition_blocked"
  | "invalid_state"
  | "missing_context";

export interface FSMTransitionResult {
  readonly allowed: boolean;
  readonly fromState: FSMState;
  readonly toState: FSMState;
  readonly action?: FSMAction;
  readonly reasonCodes?: readonly FSMTransitionReasonCode[];
}

/**
 * Mapa puro `FSMState -> tareas IA permitidas en ese estado`.
 *
 * Vocabulario alineado con `AIValidationTask` (no con `FSMAction`) porque
 * el `expectedAction` que el orquestador propone al validator es la tarea
 * IA en ejecucion. La funcion es deterministica, sin dependencias del
 * `FSMEngine`, y sirve como unica fuente para `FSMContext.allowedActions`.
 *
 * Mantener sincronizado con `AIValidationTask` y con los `case` del
 * `Orchestrator.process` que disparan llamadas al LLM.
 */
export function getAllowedActionsForState(
  state: FSMState,
): readonly string[] {
  switch (state) {
    case "INIT":
      return [
        "classify_intent",
        "extract_slots",
        "rag_answer",
        "generate_reply",
      ];
    case "QUALIFYING":
      return ["extract_slots", "generate_reply"];
    case "SUPPORT_RAG":
      return ["rag_answer", "generate_reply"];
    case "BOOKING":
      return ["generate_reply"];
    case "HUMAN_HANDOVER":
      return [];
    default: {
      const _exhaustive: never = state;
      void _exhaustive;
      return [];
    }
  }
}
