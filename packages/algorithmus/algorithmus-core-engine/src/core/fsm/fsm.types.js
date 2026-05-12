"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllowedActionsForState = getAllowedActionsForState;
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
function getAllowedActionsForState(state) {
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
            const _exhaustive = state;
            void _exhaustive;
            return [];
        }
    }
}
