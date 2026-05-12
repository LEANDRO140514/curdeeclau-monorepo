import type {
  ExtractedData,
  FSMContext,
  FSMResult,
  FSMState,
} from "./fsm.types";

export type {
  ExtractedData,
  FSMAction,
  FSMContext,
  FSMResult,
  FSMState,
  FSMTransitionReasonCode,
  FSMTransitionResult,
} from "./fsm.types";

export { getAllowedActionsForState } from "./fsm.types";

const RAG_CONFIDENCE_LOW_THRESHOLD = 0.5;

/** Intención ya clasificada (solo valores aceptados en runtime). */
function readIntent(data: ExtractedData | undefined): "venta" | "soporte" | undefined {
  const v = data?.intent;
  if (v === "venta" || v === "soporte") return v;
  return undefined;
}

function shouldHandoverByRagAttempts(data: ExtractedData | undefined): boolean {
  const n = data?.ragAttempts;
  return typeof n === "number" && Number.isFinite(n) && n >= 2;
}

/** Solo `true` explícito cuenta como “datos completos”. */
function isQualifyingComplete(data: ExtractedData | undefined): boolean {
  return data?.qualifyingComplete === true;
}

function isRagLowConfidence(data: ExtractedData | undefined): boolean {
  if (data?.lowRagConfidence === true) return true;
  const c = data?.ragConfidence;
  if (typeof c === "number" && Number.isFinite(c)) {
    return c < RAG_CONFIDENCE_LOW_THRESHOLD;
  }
  return false;
}

function isBookingAvailabilityMissing(data: ExtractedData | undefined): boolean {
  return data?.bookingAvailabilityMissing === true;
}

function isBookingConfirmed(data: ExtractedData | undefined): boolean {
  return data?.bookingConfirmed === true;
}

/**
 * Máquina de estados conversacional determinística.
 * No llama a LLM ni servicios externos; solo evalúa contexto estructurado validado.
 */
export class FSMEngine {
  evaluate(context: FSMContext): FSMResult {
    switch (context.currentState) {
      case "INIT":
        return this.handleInit(context);

      case "QUALIFYING":
        return this.handleQualifying(context);

      case "SUPPORT_RAG":
        return this.handleSupport(context);

      case "BOOKING":
        return this.handleBooking(context);

      case "HUMAN_HANDOVER":
        return this.handleHandover(context);

      default: {
        const _exhaustive: never = context.currentState;
        throw new Error(`Invalid FSM state: ${_exhaustive}`);
      }
    }
  }

  private handleInit(context: FSMContext): FSMResult {
    const intent = readIntent(context.extractedData);

    if (intent === undefined) {
      return { nextState: "INIT", action: "reply" };
    }

    if (intent === "venta") {
      return { nextState: "QUALIFYING", action: "extract_slots" };
    }

    return { nextState: "SUPPORT_RAG", action: "query_rag" };
  }

  private handleQualifying(context: FSMContext): FSMResult {
    if (isQualifyingComplete(context.extractedData)) {
      return { nextState: "BOOKING", action: "book_appointment" };
    }

    return { nextState: "QUALIFYING", action: "extract_slots" };
  }

  private handleSupport(context: FSMContext): FSMResult {
    const data = context.extractedData;

    if (shouldHandoverByRagAttempts(data)) {
      return { nextState: "HUMAN_HANDOVER", action: "handover_human" };
    }

    if (isRagLowConfidence(data)) {
      return { nextState: "HUMAN_HANDOVER", action: "handover_human" };
    }

    return { nextState: "SUPPORT_RAG", action: "reply" };
  }

  private handleBooking(context: FSMContext): FSMResult {
    const data = context.extractedData;

    if (isBookingConfirmed(data)) {
      return { nextState: "INIT", action: "reply" };
    }

    if (isBookingAvailabilityMissing(data)) {
      return { nextState: "BOOKING", action: "reply" };
    }

    return { nextState: "BOOKING", action: "book_appointment" };
  }

  private handleHandover(_context: FSMContext): FSMResult {
    return { nextState: "HUMAN_HANDOVER", action: "handover_human" };
  }
}
