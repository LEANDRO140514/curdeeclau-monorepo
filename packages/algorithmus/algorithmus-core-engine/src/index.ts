// ── @curdeeclau/algorithmus-core-engine — Public API Surface ──
//
// FASE 2A: Conservative barrel exports.
// Only stable, wired, production APIs are exported.
// Internal modules (app/, config/, workers/, demo/, infra internals)
// are deliberately excluded from the public surface.
//
// Autoridad: CORE-HARD-2A

// ── Orchestrator ──────────────────────────────────────────
export { Orchestrator } from './core/orchestrator/Orchestrator';
export type {
  OrchestratorProcessResult,
  OrchestratorDeps,
  OrchestratorRagDiagnostic,
} from './core/orchestrator/Orchestrator';

// ── FSM ───────────────────────────────────────────────────
export { FSMEngine } from './core/fsm/FSMEngine';
export { FSMTransitionChecker } from './core/fsm/FSMTransitionChecker';
export {
  getAllowedActionsForState,
} from './core/fsm/fsm.types';
export type {
  FSMState,
  FSMAction,
  ExtractedData,
  FSMContext,
  FSMResult,
  FSMTransitionResult,
  FSMTransitionReasonCode,
} from './core/fsm/fsm.types';

// ── LLM Gateway ───────────────────────────────────────────
export { LLMGateway } from './core/llm/LLMGateway';

// ── RAG ───────────────────────────────────────────────────
export { RAGService } from './core/rag/RAGService';
export { PineconeRAGAdapter } from './core/rag/PineconeRAGAdapter';

// ── Validation ────────────────────────────────────────────
export { BasicAIValidator } from './core/validation/AIValidatorImpl';
export { BasicDecisionMatrix } from './core/validation/DecisionMatrixImpl';
export { BasicHardGate } from './core/validation/HardGateImpl';
export { NoopValidationMetricsPort } from './core/validation/NoopMetricsPort';
export { ProductionAIValidator } from './core/validation/ProductionAIValidator';
export type {
  AIValidator,
  DecisionMatrix,
  HardGate,
  SafetyPort,
  SafetyPortInput,
  SafetyPortOutput,
  GroundingPort,
  GroundingPortInput,
  GroundingPortOutput,
  MetricsPort,
  ValidationResult,
  ValidationFlags,
  ValidationContext,
  ValidationScores,
  DecisionAction,
  DecisionReasonCode,
  HardGateReasonCode,
  GroundingReference,
  OrchestratorValidationContract,
  OrchestratorValidationOutput,
  AIValidationTask,
} from './core/validation/AIValidationLayer';

// ── Identity ──────────────────────────────────────────────
export { IdentityManager } from './core/identity/IdentityManager';

// ── Leads ─────────────────────────────────────────────────
export { LeadCaptureService } from './core/leads/LeadCaptureService';
export type {
  LeadStore,
  GHLContactSync,
} from './core/leads/LeadCaptureService';
export {
  INTERES_TO_PIPELINE_STAGE,
  BASE_TAGS,
} from './core/leads/types';
export type {
  Carrera,
  Horario,
  CanalOrigen,
  NivelInteres,
  LeadCapturePayload,
  LeadCaptureResult,
  ValidationError as LeadValidationError,
  ValidationResult as LeadValidationResult,
  NormalizedLead,
} from './core/leads/types';

// ── Postgres ──────────────────────────────────────────────
export { LeadsRepository } from './infra/postgres/LeadsRepository';
export type {
  LeadRecord,
  ExternalIdentityRecord,
  FindExternalIdentityInput,
  CreateExternalIdentityInput,
  FindLeadByIdInput,
  CreateLeadWithExternalIdentityInput,
  UpsertLeadInput,
  UpdateFsmStateInput,
} from './infra/postgres/LeadsRepository';

// ── Embedding ─────────────────────────────────────────────
export { EmbeddingService } from './core/embedding/EmbeddingService';

// ── Observability ─────────────────────────────────────────
export type { Metrics } from './core/observability/Metrics';

// ── Channels ──────────────────────────────────────────────
export type { InboundChannelMessage } from './core/channels/channelMessage';
export type { OutboundChannelMessage } from './core/channels/outboundMessage';
