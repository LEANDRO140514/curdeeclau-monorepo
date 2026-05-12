import type {
  DecisionAction,
  HardGate,
  HardGateInput,
  HardGateOutput,
} from "./AIValidationLayer";

const VALID_DECISION_ACTIONS: readonly DecisionAction[] = [
  "accept",
  "retry",
  "fallback",
  "handover",
];

/**
 * Gate bloqueante final. NO permite bypass. Bloquea SI alguna condición falla:
 *
 *   - !validation.flags.isSafe
 *   - !validation.flags.isWithinFSM
 *   - decision.action fuera de {accept, retry, fallback, handover}
 *   - !fsmTransition.allowed
 *
 * El orquestador interpreta `allowed=true` como autorización para emitir el
 * output IA cuando además `decision.action === "accept"`. En cualquier otro
 * caso debe enviarse un mensaje de fallback seguro.
 */
export class BasicHardGate implements HardGate {
  authorize(input: HardGateInput): HardGateOutput {
    const { validation, decision, fsmTransition } = input;

    if (!validation.flags.isSafe) {
      return { allowed: false, reason: "blocked_unsafe" };
    }

    if (!validation.flags.isWithinFSM) {
      return { allowed: false, reason: "blocked_outside_fsm" };
    }

    if (!VALID_DECISION_ACTIONS.includes(decision.action)) {
      return { allowed: false, reason: "blocked_invalid_decision" };
    }

    if (!fsmTransition.allowed) {
      return { allowed: false, reason: "blocked_fsm_transition" };
    }

    return { allowed: true, reason: "allowed" };
  }
}
