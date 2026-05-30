// ── Canonical Runtime Event Catalog ─────────────────────
//
// The authoritative namespace for all runtime-visible events.
// Every engine emits events with types drawn from this catalog.
// The workflow-orchestrator consumes and dispatches them.
//
// INVARIANT (governance):
//   Runtime events cannot exist outside the governed namespace.
//   Every runtime-visible event type MUST be declared here first.
//
// INVARIANT (evolution):
//   This catalog is NOT final. It grows as engines converge into
//   the governed runtime. The catalog IS the namespace — it is
//   NOT a frozen snapshot.
//
// Extending: add the literal here, then emit from the engine.
// Never define runtime event type literals in engine-local files.

import type { DomainEvent } from '../events/DomainEvent';

export type RuntimeEventType =
  // ── Message Buffer ──────────────────────────────
  | 'MessageBuffered'
  | 'ConversationReadyToFlush'
  | 'ConversationFlushed'
  | 'ConversationCleared'
  // ── Workflow Orchestration ──────────────────────
  | 'WorkflowStarted'
  | 'WorkflowStepExecuted'
  | 'WorkflowStepFailed'
  | 'WorkflowCompleted'
  | 'WorkflowFailed'
  // ── State ───────────────────────────────────────
  | 'StateTransitioned'
  // ── Handoff ─────────────────────────────────────
  | 'HandoffRequested'
  | 'HandoffAccepted'
  | 'HandoffRejected'
  | 'OwnershipChanged'
  | 'SuppressionActivated'
  | 'AIRecoveryStarted'
  | 'AIRecovered'
  | 'HandoffClosed'
  // ── CRM ─────────────────────────────────────────
  | 'ContactCreated'
  | 'ContactUpdated'
  | 'OpportunityCreated'
  | 'OpportunityMoved'
  | 'TagAdded'
  | 'TagRemoved'
  | 'PipelineCreated'
  | 'CampaignCreated'
  | 'CampaignPaused'
  | 'CampaignResumed'
  // ── Calendar ────────────────────────────────────
  | 'AvailabilityChecked'
  | 'ReservationCreated'
  | 'ReservationCancelled'
  | 'ReservationRescheduled'
  | 'TimeSlotBlocked'
  | 'TimeSlotReleased'
  | 'ReminderCreated'
  | 'ReminderTriggered'
  | 'ReminderCancelled'
  // ── Telegram Provider ──────────────────────────
  | 'TelegramMessageReceived'
  // ── Future verticals ────────────────────────────
  | 'AppointmentBooked';

export type RuntimeEventHandler = (event: DomainEvent) => void | Promise<void>;

export interface RuntimeEventDispatcher {
  dispatch(event: DomainEvent): Promise<void>;
  on(eventType: RuntimeEventType | '*', handler: RuntimeEventHandler): void;
  off(eventType: RuntimeEventType | '*', handler: RuntimeEventHandler): void;
  listenerCount(eventType: RuntimeEventType): number;
}
