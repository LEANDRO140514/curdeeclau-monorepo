import type { FSMContext } from "@core/core/fsm/fsm.types";
import type { OrchestratorProcessResult } from "@core/core/orchestrator/Orchestrator";

/** Evento de entrada hacia el core (mismo contrato que `FSMContext`). */
export type CoreInputEvent = FSMContext;

/** Resultado del pipeline del orquestador (sin transformación en el adapter). */
export type CoreOutputEvent = OrchestratorProcessResult;
