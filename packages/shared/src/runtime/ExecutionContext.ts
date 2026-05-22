// ── Canonical Execution Context ─────────────────────────
//
// Single authoritative execution envelope for the governed runtime.
// Created by the workflow-orchestrator. Consumed by every engine
// participating in a workflow step.
//
// This is a runtime execution primitive — it carries ONLY
// execution metadata. It does NOT carry:
//   - CRM semantics
//   - calendar semantics
//   - handoff semantics
//   - provider instances
//   - channel state
//   - AI state
//   - business entities

import type { StepResult } from '../workflow/WorkflowContext';
import type { ExecutionId, WorkflowId, ConversationId, TenantId } from '../ids/EntityId';

export interface ExecutionContext {
  /** Unique execution ID (exec_ prefix) */
  executionId: ExecutionId;

  /** Workflow being executed (wfl_ prefix) */
  workflowId: WorkflowId;

  /** Parent conversation */
  conversationId?: ConversationId;

  /** Tenant scope */
  tenantId?: TenantId;

  /** Vertical domain */
  verticalId?: string;

  /** Correlation ID tying events of this execution together */
  correlationId?: string;

  /** Current state-machine state name */
  currentState: string;

  /** Previous state-machine state name */
  previousState?: string;

  /** Input payload that triggered this execution */
  input: Record<string, unknown>;

  /** Mutable state bag shared across steps */
  state: Record<string, unknown>;

  /** Step results in execution order */
  steps: StepResult[];

  /** Unix ms when execution started */
  startedAt: number;

  /** Unix ms of last update */
  updatedAt: number;

  /** Extension point — observability, tracing, provider traces */
  metadata: Record<string, unknown>;
}

export function createExecutionContext(
  overrides: Partial<ExecutionContext> = {},
): ExecutionContext {
  const now = Date.now();
  return {
    executionId: overrides.executionId ?? ('exec_unknown' as ExecutionId),
    workflowId: overrides.workflowId ?? ('wfl_unknown' as WorkflowId),
    currentState: overrides.currentState ?? 'idle',
    input: overrides.input ?? {},
    state: overrides.state ?? {},
    steps: overrides.steps ?? [],
    startedAt: overrides.startedAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    metadata: overrides.metadata ?? {},
    conversationId: overrides.conversationId,
    tenantId: overrides.tenantId,
    verticalId: overrides.verticalId,
    previousState: overrides.previousState,
    correlationId: overrides.correlationId,
  };
}
