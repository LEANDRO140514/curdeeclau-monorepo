import type {
  DecisionAction,
  DecisionMatrix,
  DecisionMatrixInput,
  DecisionMatrixOutput,
  DecisionReasonCode,
} from "./AIValidationLayer";

const CONFIDENCE_THRESHOLD = 0.5;

/**
 * Matriz de decisión determinista. NO depende del FSM. Reglas EXACTAS:
 *
 *   1. !isSafe                       -> handover
 *   2. !isWithinFSM                  -> handover
 *   3. !isGrounded                   -> fallback
 *   4. !isComplete                   -> retry
 *   5. confidence < 0.5              -> retry
 *   6. default                       -> accept
 */
export class BasicDecisionMatrix implements DecisionMatrix {
  decide(input: DecisionMatrixInput): DecisionMatrixOutput {
    const { validation } = input;
    const { flags, scores } = validation;

    let action: DecisionAction;
    const reasonCodes: DecisionReasonCode[] = [];

    if (flags.isSafe !== true) {
      action = "handover";
      reasonCodes.push("validation_risky", "handover_required");
    } else if (flags.isWithinFSM !== true) {
      action = "handover";
      reasonCodes.push("validation_risky", "handover_required");
    } else if (flags.isGrounded !== true) {
      action = "fallback";
      reasonCodes.push("validation_risky", "fallback_available");
    } else if (flags.isComplete !== true) {
      action = "retry";
      reasonCodes.push("validation_risky", "retry_available");
    } else if (scores.confidence < CONFIDENCE_THRESHOLD) {
      action = "retry";
      reasonCodes.push("validation_risky", "retry_available");
    } else {
      action = "accept";
      reasonCodes.push("validation_safe");
    }

    return {
      action,
      reasonCodes,
      metadata: {
        matrixName: "BasicDecisionMatrix",
        matrixVersion: "0.1.0-skeleton",
        evaluatedAtIso: new Date().toISOString(),
      },
    };
  }
}
