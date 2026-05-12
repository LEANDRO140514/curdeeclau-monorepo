"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FSMTransitionChecker = void 0;
/**
 * Envuelve la evaluación determinística del `FSMEngine` en un `FSMTransitionResult`.
 *
 * Skeleton: aplica un control mínimo real — `allowed` requiere que el engine
 * haya producido un resultado (`fsmResult != null`). Si la evaluación falla
 * o devuelve nulo, el HardGate bloqueará vía `blocked_fsm_transition`.
 * No introduce lógica de negocio FSM.
 */
class FSMTransitionChecker {
    fsm;
    constructor(fsm) {
        this.fsm = fsm;
    }
    check(input) {
        const { context } = input;
        let fsmResult = null;
        try {
            fsmResult = this.fsm.evaluate(context);
        }
        catch {
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
exports.FSMTransitionChecker = FSMTransitionChecker;
