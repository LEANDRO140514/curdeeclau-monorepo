import type { AIValidationTask } from "./AIValidationLayer";

/**
 * Politica de evaluacion de grounding (lexical v1).
 *
 * El `ProductionAIValidator` usa esta politica para decidir cuando invocar
 * el `GroundingPort` y como interpretar su `confidence`. La politica es
 * pura (datos), no contiene logica de scoring; el adapter es quien implementa
 * la heuristica concreta (lexical n-gram coverage en v1).
 */
export type GroundingPolicy = {
  /**
   * Umbral minimo de `confidence` (0..1) para considerar un output como
   * `isGrounded=true`. Aplicado por el adapter; el validator no decide.
   * Default: 0.3 (n-gram coverage lexical).
   */
  readonly minConfidence: number;
  /**
   * Largo minimo (en chars, post-trim) del `aiOutputText` para que el adapter
   * lo evalue. Por debajo se devuelve `empty_input` (NO error de port). El
   * validator traduce a `isGrounded=false` + `ungrounded_output`.
   */
  readonly minOutputCharsForEvaluation: number;
  /**
   * Conjunto de tareas que el validator evalua via `GroundingPort`. Para
   * tareas fuera de este set el validator preserva la flag `isGrounded`
   * proveniente del `BasicAIValidator` (heuristica `length > 0`).
   *
   * Default: solo `rag_answer` (unica tarea con referencias reales hoy).
   */
  readonly evaluatedTasks: ReadonlySet<AIValidationTask>;
};

export const DEFAULT_GROUNDING_POLICY: GroundingPolicy = {
  minConfidence: 0.3,
  minOutputCharsForEvaluation: 20,
  evaluatedTasks: new Set<AIValidationTask>(["rag_answer"]),
};
