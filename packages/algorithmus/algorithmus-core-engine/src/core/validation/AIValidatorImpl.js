"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicAIValidator = void 0;
const DEFAULT_CONFIDENCE = 0.5;
/**
 * Validador esqueleto: SOLO evalua, NO decide.
 *
 * Reglas minimas:
 *   - isSafe       = true (placeholder; SafetyPort real aun no instalado)
 *   - isComplete   = texto presente y no vacio tras trim
 *   - isGrounded   = referencias presentes (length > 0)
 *   - isWithinFSM  = `fsmContext.allowedActions` contiene `expectedAction`.
 *                   `allowedActions` ausente -> conjunto vacio -> false.
 *   - confidence   = aiOutput.confidence ?? 0.5
 *
 * No depende de `FSMEngine`. Solo consume datos puros del `ValidationContext`
 * (estado actual + acciones permitidas + accion esperada por el orquestador).
 */
class BasicAIValidator {
    async validate(context) {
        const reasonCodes = [];
        const isSafe = true;
        const isComplete = !!context.aiOutput.text && context.aiOutput.text.trim().length > 0;
        const isGrounded = Array.isArray(context.groundingReferences) &&
            context.groundingReferences.length > 0;
        const allowedActions = context.fsmContext.allowedActions ?? [];
        const isWithinFSM = allowedActions.includes(context.expectedAction);
        if (!isComplete) {
            reasonCodes.push("incomplete_output");
        }
        if (!isGrounded) {
            reasonCodes.push("ungrounded_output");
        }
        if (!isWithinFSM) {
            reasonCodes.push("outside_fsm");
        }
        const flags = {
            isSafe,
            isGrounded,
            isComplete,
            isWithinFSM,
        };
        const scores = {
            confidence: context.aiOutput.confidence ?? DEFAULT_CONFIDENCE,
        };
        return {
            flags,
            scores,
            reasonCodes,
            metadata: {
                validatorName: "BasicAIValidator",
                validatorVersion: "0.1.0-skeleton",
                evaluatedAtIso: new Date().toISOString(),
            },
        };
    }
}
exports.BasicAIValidator = BasicAIValidator;
