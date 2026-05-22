// ── Canonical Contracts ─────────────────────────────────
import type { DomainEvent, ExecutionContext, WorkflowStateDefinition } from '@curdeeclau/shared';
export type { DomainEvent } from '@curdeeclau/shared';
export type { StepResult, StepStatus } from '@curdeeclau/shared';
export type { StateTransition } from '@curdeeclau/shared';

// ── Event Handler ───────────────────────────────────────

import type { RuntimeEventHandler } from '@curdeeclau/shared';
export type EventHandler = RuntimeEventHandler;

// ── Event Types ─────────────────────────────────────────

import type { RuntimeEventType } from '@curdeeclau/shared';
export type EventType = RuntimeEventType;

// ── Engine Contract ─────────────────────────────────────

import type { Engine } from '@curdeeclau/shared';
export type { Engine };

// ── Workflow Definition ─────────────────────────────────

export type StepType = 'action' | 'decision' | 'wait' | 'parallel' | 'terminate';

export interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  engine: string;
  action: string;
  input?: Record<string, unknown>;
  conditions?: StepCondition[];
  onFailure?: FailurePolicy;
  timeoutMs?: number;
  dependsOn?: string[];
}

export interface StepCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'exists';
  value: unknown;
  nextStep: string;
}

export interface FailurePolicy {
  retry: { maxAttempts: number; backoffMs: number };
  fallbackStep?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  verticalId: string;
  steps: WorkflowStep[];
  initialState?: Record<string, unknown>;
  description?: string;
}

// ── Execution Context ───────────────────────────────────
// Canonical envelope from shared/runtime. The orchestrator
// constructs ExecutionContext; engines receive it via execute().
export type WorkflowContext = ExecutionContext;

// ── State Machine ───────────────────────────────────────
// StateDefinition aliases the canonical WorkflowStateDefinition.
// StateMachine is orchestrator-internal infrastructure (blueprint,
// not runtime record — that's CanonicalWorkflowState in shared/).

export type StateDefinition = WorkflowStateDefinition;

export interface StateMachine {
  id: string;
  verticalId: string;
  version: string;
  initial: string;
  states: StateDefinition[];
}

// ── Registry Interfaces ─────────────────────────────────

export interface EngineRegistry {
  register(engine: Engine): void;
  get(name: string): Engine | undefined;
  has(name: string): boolean;
  list(): string[];
}

export interface WorkflowRegistry {
  register(definition: WorkflowDefinition): void;
  get(id: string): WorkflowDefinition | undefined;
  has(id: string): boolean;
  list(): string[];
  findByVertical(verticalId: string): WorkflowDefinition[];
}

// ── Event Dispatcher ────────────────────────────────────

import type { RuntimeEventDispatcher } from '@curdeeclau/shared';
export type EventDispatcher = RuntimeEventDispatcher;

// ── Orchestrator Config & Interface ─────────────────────

export interface OrchestratorConfig {
  verticalId: string;
  maxConcurrentSteps: number;
  defaultTimeoutMs: number;
}

export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  verticalId: 'dental',
  maxConcurrentSteps: 1,
  defaultTimeoutMs: 30_000,
};

export interface IWorkflowOrchestrator {
  loadWorkflow(definition: WorkflowDefinition): void;
  loadStateMachine(machine: StateMachine): void;
  registerEngine(engine: Engine): void;
  execute(workflowId: string, input?: Record<string, unknown>): Promise<WorkflowContext>;
  handleEvent(event: DomainEvent): Promise<void>;
  getDispatcher(): EventDispatcher;
}
