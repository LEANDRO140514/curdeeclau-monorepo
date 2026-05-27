// ── IDs ──────────────────────────────────────────────────
export {
  VALID_PREFIXES,
  isValidId,
  getPrefix,
  matchesPrefix,
  assertId,
} from './ids/EntityId';
export type {
  EntityId,
  ConversationId,
  WorkflowId,
  TenantId,
  ContactId,
  OpportunityId,
  PipelineId,
  CampaignId,
  EventId,
  ExecutionId,
  UserId,
  CalendarId,
  TimeSlotId,
  ReservationId,
  ReminderId,
  IdPrefix,
} from './ids/EntityId';

// ── Events ───────────────────────────────────────────────
export { createDomainEvent, isDomainEvent } from './events/DomainEvent';
export type { DomainEvent } from './events/DomainEvent';
export { uuidv7 } from './events/uuid7';

// ── Runtime ──────────────────────────────────────────────
export { createConversationContext } from './runtime/ConversationContext';
export type { ConversationContext } from './runtime/ConversationContext';

export { createExecutionContext } from './runtime/ExecutionContext';
export type { ExecutionContext } from './runtime/ExecutionContext';

export {
  createOwnershipRecord,
  isTransferAllowed,
} from './runtime/Ownership';
export type { ConversationOwner, OwnershipRecord } from './runtime/Ownership';

export {
  SUPPRESSION_MATRIX,
  createSuppressionRecord,
  getPermissions,
} from './runtime/Suppression';
export type {
  SuppressionMode,
  SuppressionPermissions,
  SuppressionRecord,
} from './runtime/Suppression';

export type {
  RuntimeEventType,
  RuntimeEventHandler,
  RuntimeEventDispatcher,
} from './runtime/EventCatalog';

export type { Engine } from './runtime/EngineContract';

export { createProviderError, wrapProviderError } from './runtime/ProviderError';
export type { ProviderFailureType, ProviderError } from './runtime/ProviderError';

// ── CRM ──────────────────────────────────────────────────
export { createContact } from './crm/Contact';
export type { CRMContact } from './crm/Contact';

export { createOpportunity } from './crm/Opportunity';
export type { CRMOpportunity, OpportunityStatus } from './crm/Opportunity';

export { createPipeline } from './crm/Pipeline';
export type { CRMPipeline, PipelineStage } from './crm/Pipeline';

export { createCampaign } from './crm/Campaign';
export type { CRMCampaign, CampaignStatus } from './crm/Campaign';

// ── Workflow ─────────────────────────────────────────────
export type {
  StepResult,
  StepStatus,
} from './workflow/WorkflowContext';

// Backward compat — CanonicalWorkflowContext merged into ExecutionContext (RT-2.4)
export type { ExecutionContext as CanonicalWorkflowContext } from './runtime/ExecutionContext';
export { createExecutionContext as createWorkflowContext } from './runtime/ExecutionContext';

export { createWorkflowState } from './workflow/WorkflowState';
export type {
  CanonicalWorkflowState,
  WorkflowStateDefinition,
  StateTransition,
} from './workflow/WorkflowState';

// ── Calendar ─────────────────────────────────────────────
export { createCalendar } from './calendar/Calendar';
export type { Calendar, AvailabilityWindow } from './calendar/Calendar';

export { createTimeSlot } from './calendar/TimeSlot';
export type { TimeSlot, TimeSlotStatus } from './calendar/TimeSlot';

export { createReservation } from './calendar/Reservation';
export type { Reservation, ReservationStatus } from './calendar/Reservation';

export { createReminder } from './calendar/Reminder';
export type { Reminder, ReminderType, ReminderChannel, ReminderStatus } from './calendar/Reminder';
