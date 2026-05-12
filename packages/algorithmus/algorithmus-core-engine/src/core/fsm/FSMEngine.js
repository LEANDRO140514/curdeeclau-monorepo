"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FSMEngine = exports.getAllowedActionsForState = void 0;
var fsm_types_1 = require("./fsm.types");
Object.defineProperty(exports, "getAllowedActionsForState", { enumerable: true, get: function () { return fsm_types_1.getAllowedActionsForState; } });
const RAG_CONFIDENCE_LOW_THRESHOLD = 0.5;
/** Intención ya clasificada (solo valores aceptados en runtime). */
function readIntent(data) {
    const v = data?.intent;
    if (v === "venta" || v === "soporte")
        return v;
    return undefined;
}
function shouldHandoverByRagAttempts(data) {
    const n = data?.ragAttempts;
    return typeof n === "number" && Number.isFinite(n) && n >= 2;
}
/** Solo `true` explícito cuenta como “datos completos”. */
function isQualifyingComplete(data) {
    return data?.qualifyingComplete === true;
}
function isRagLowConfidence(data) {
    if (data?.lowRagConfidence === true)
        return true;
    const c = data?.ragConfidence;
    if (typeof c === "number" && Number.isFinite(c)) {
        return c < RAG_CONFIDENCE_LOW_THRESHOLD;
    }
    return false;
}
function isBookingAvailabilityMissing(data) {
    return data?.bookingAvailabilityMissing === true;
}
function isBookingConfirmed(data) {
    return data?.bookingConfirmed === true;
}
/**
 * Máquina de estados conversacional determinística.
 * No llama a LLM ni servicios externos; solo evalúa contexto estructurado validado.
 */
class FSMEngine {
    evaluate(context) {
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
                const _exhaustive = context.currentState;
                throw new Error(`Invalid FSM state: ${_exhaustive}`);
            }
        }
    }
    handleInit(context) {
        const intent = readIntent(context.extractedData);
        if (intent === undefined) {
            return { nextState: "INIT", action: "reply" };
        }
        if (intent === "venta") {
            return { nextState: "QUALIFYING", action: "extract_slots" };
        }
        return { nextState: "SUPPORT_RAG", action: "query_rag" };
    }
    handleQualifying(context) {
        if (isQualifyingComplete(context.extractedData)) {
            return { nextState: "BOOKING", action: "book_appointment" };
        }
        return { nextState: "QUALIFYING", action: "extract_slots" };
    }
    handleSupport(context) {
        const data = context.extractedData;
        if (shouldHandoverByRagAttempts(data)) {
            return { nextState: "HUMAN_HANDOVER", action: "handover_human" };
        }
        if (isRagLowConfidence(data)) {
            return { nextState: "HUMAN_HANDOVER", action: "handover_human" };
        }
        return { nextState: "SUPPORT_RAG", action: "reply" };
    }
    handleBooking(context) {
        const data = context.extractedData;
        if (isBookingConfirmed(data)) {
            return { nextState: "INIT", action: "reply" };
        }
        if (isBookingAvailabilityMissing(data)) {
            return { nextState: "BOOKING", action: "reply" };
        }
        return { nextState: "BOOKING", action: "book_appointment" };
    }
    handleHandover(_context) {
        return { nextState: "HUMAN_HANDOVER", action: "handover_human" };
    }
}
exports.FSMEngine = FSMEngine;
