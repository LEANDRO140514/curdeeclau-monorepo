import type {
  FSMContext,
  FSMTransitionResult,
} from "../fsm/fsm.types";

export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | { readonly [key: string]: JsonValue }
  | readonly JsonValue[];

export type AIValidationTask =
  | "classify_intent"
  | "extract_slots"
  | "rag_answer"
  | "generate_reply";

export type ValidationReasonCode =
  | "unsafe_content"
  | "ungrounded_output"
  | "incomplete_output"
  | "outside_fsm"
  | "low_confidence"
  | "invalid_structure"
  | "missing_required_field"
  | "port_unavailable";

export type DecisionAction = "accept" | "retry" | "fallback" | "handover";

export type DecisionReasonCode =
  | "validation_safe"
  | "validation_risky"
  | "retry_available"
  | "retry_exhausted"
  | "fallback_available"
  | "handover_required";

export type HardGateReasonCode =
  | "allowed"
  | "blocked_unsafe"
  | "blocked_outside_fsm"
  | "blocked_invalid_decision"
  | "blocked_fsm_transition";

export interface GroundingReference {
  readonly id: string;
  readonly source: string;
  readonly score?: number;
  readonly excerpt?: string;
}

export interface ValidationContext {
  readonly tenantId: string;
  readonly leadId: string;
  readonly traceId?: string;
  readonly task: AIValidationTask;
  /**
   * Accion/intencion que el orquestador propone para esta llamada IA.
   *
   * El validator debe evaluar `isWithinFSM` como
   * `fsmContext.allowedActions.includes(expectedAction)`. Coincide con
   * `task` salvo extensiones futuras donde una sola tarea pueda mapear a
   * acciones FSM distintas. NO se acopla a `FSMEngine`; es un dato del
   * orquestador para el validator.
   */
  readonly expectedAction: AIValidationTask;
  readonly userMessage: string;
  readonly aiOutput: {
    readonly text?: string;
    readonly data?: { readonly [key: string]: JsonValue };
    readonly confidence?: number;
  };
  readonly groundingReferences?: readonly GroundingReference[];
  readonly fsmContext: FSMContext;
}

export interface ValidationScores {
  readonly confidence: number;
}

export interface ValidationFlags {
  readonly isSafe: boolean;
  readonly isGrounded: boolean;
  readonly isComplete: boolean;
  readonly isWithinFSM: boolean;
}

export interface ValidationMetadata {
  readonly validationId?: string;
  readonly validatorName?: string;
  readonly validatorVersion?: string;
  readonly evaluatedAtIso?: string;
  readonly latencyMs?: number;
  readonly safetyLabels?: readonly string[];
  readonly groundingReferenceIds?: readonly string[];
  readonly missingFields?: readonly string[];
}

export interface ValidationResult {
  readonly flags: ValidationFlags;
  readonly scores: ValidationScores;
  readonly reasonCodes: readonly ValidationReasonCode[];
  readonly metadata?: ValidationMetadata;
}

export interface AIValidator {
  validate(context: ValidationContext): Promise<ValidationResult>;
}

export interface DecisionMatrixInput {
  readonly validation: ValidationResult;
  readonly attemptNumber: number;
  readonly maxRetries: number;
  readonly fallbackAvailable: boolean;
  readonly handoverAvailable: boolean;
}

export interface DecisionMatrixMetadata {
  readonly matrixName?: string;
  readonly matrixVersion?: string;
  readonly evaluatedAtIso?: string;
}

export interface DecisionMatrixOutput {
  readonly action: DecisionAction;
  readonly reasonCodes: readonly DecisionReasonCode[];
  readonly retryAfterMs?: number;
  readonly fallbackReason?: string;
  readonly metadata?: DecisionMatrixMetadata;
}

export interface DecisionMatrix {
  decide(input: DecisionMatrixInput): DecisionMatrixOutput;
}

/**
 * Pipeline obligatorio:
 *   Validation → Decision → FSM transition check → HardGate → Output
 *
 * El HardGate debe BLOQUEAR cuando alguna de estas condiciones se cumpla:
 *   - validation.flags.isSafe       !== true
 *   - validation.flags.isWithinFSM  !== true
 *   - decision.action no es una DecisionAction válida
 *   - fsmTransition.allowed         !== true
 */
export interface HardGateInput {
  readonly validation: ValidationResult;
  readonly decision: DecisionMatrixOutput;
  readonly fsmTransition: FSMTransitionResult;
}

export interface HardGateOutput {
  readonly allowed: boolean;
  readonly reason: HardGateReasonCode;
}

export interface HardGate {
  authorize(input: HardGateInput): HardGateOutput;
}

export interface OrchestratorValidationContract {
  readonly validator: AIValidator;
  readonly decisionMatrix: DecisionMatrix;
  readonly hardGate: HardGate;
}

export interface OrchestratorValidationOutput {
  readonly validation: ValidationResult;
  readonly decision: DecisionMatrixOutput;
  readonly fsmTransition: FSMTransitionResult;
  readonly hardGate: HardGateOutput;
}

export interface SafetyPortInput {
  readonly tenantId: string;
  readonly traceId?: string;
  readonly userMessage: string;
  readonly aiOutputText?: string;
}

export interface SafetyPortOutput {
  readonly isSafe: boolean;
  readonly reasonCodes: readonly ValidationReasonCode[];
  readonly labels?: readonly string[];
}

export interface SafetyPort {
  evaluate(input: SafetyPortInput): Promise<SafetyPortOutput>;
}

export interface GroundingPortInput {
  readonly tenantId: string;
  readonly traceId?: string;
  readonly aiOutputText: string;
  readonly references: readonly GroundingReference[];
}

export interface GroundingPortOutput {
  readonly isGrounded: boolean;
  readonly confidence: number;
  readonly reasonCodes: readonly ValidationReasonCode[];
  readonly referenceIds?: readonly string[];
}

export interface GroundingPort {
  evaluate(input: GroundingPortInput): Promise<GroundingPortOutput>;
}

export interface ValidationMetricsEvent {
  readonly tenantId: string;
  readonly traceId?: string;
  readonly task: AIValidationTask;
  readonly validation: ValidationResult;
  readonly decision?: DecisionMatrixOutput;
  readonly fsmTransition?: FSMTransitionResult;
  readonly hardGate?: HardGateOutput;
}

export interface MetricsPort {
  recordValidation(event: ValidationMetricsEvent): void;
  recordDecision(event: ValidationMetricsEvent): void;
  recordHardGate(event: ValidationMetricsEvent): void;
}
