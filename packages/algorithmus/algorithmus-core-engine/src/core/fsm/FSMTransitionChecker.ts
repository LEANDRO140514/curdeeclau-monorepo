import type { FSMEngine } from "./FSMEngine";
import type {
  FSMContext,
  FSMResult,
  FSMTransitionResult,
} from "./fsm.types";

export interface FSMTransitionCheckerInput {
  readonly context: FSMContext;
}

/**
 * Envuelve la evaluación determinística del `FSMEngine` en un `FSMTransitionResult`.
 *
 * Skeleton: aplica un control mínimo real — `allowed` requiere que el engine
 * haya producido un resultado (`fsmResult != null`). Si la evaluación falla
 * o devuelve nulo, el HardGate bloqueará vía `blocked_fsm_transition`.
 * No introduce lógica de negocio FSM.
 */
export class FSMTransitionChecker {
  private readonly fsm: FSMEngine;

  constructor(fsm: FSMEngine) {
    this.fsm = fsm;
  }

  check(input: FSMTransitionCheckerInput): FSMTransitionResult {
    const { context } = input;

    let fsmResult: FSMResult | null = null;
    try {
      fsmResult = this.fsm.evaluate(context);
    } catch {
      fsmResult = null;
    }

    const allowed = fsmResult != null;

    if (allowed && fsmResult) {
      return {
        allowed,
        fromState: context.currentState,
        toState: fsmResult.nextState,
        action: fsmResult.action,
        reasonCodes: ["transition_allowed"],
      };
    }

    return {
      allowed,
      fromState: context.currentState,
      toState: context.currentState,
      reasonCodes: ["transition_blocked"],
    };
  }
}
