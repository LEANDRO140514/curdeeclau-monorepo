// ── Workflow Step Primitives ────────────────────────────
//
// Step-level execution primitives consumed by the canonical
// ExecutionContext (shared/src/runtime/ExecutionContext.ts).
//
// CanonicalWorkflowContext has been merged into ExecutionContext.
// Import ExecutionContext from @curdeeclau/shared for the full envelope.
//
// This file now hosts ONLY step-level types consumed by ExecutionContext.

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface StepResult {
  stepId: string;
  stepName: string;
  status: StepStatus;
  output?: Record<string, unknown>;
  error?: string;
  startedAt: number;
  completedAt?: number;
  attempts: number;
}
