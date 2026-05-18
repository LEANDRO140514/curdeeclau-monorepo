# Contract Consolidation Plan

**Phase:** RT-1
**Date:** 2026-05-18
**Status:** Proposal — no implementation yet

---

## Objective

Consolidate all runtime contracts into `@curdeeclau/shared` as the single canonical source of truth. Eliminate type duplication across engines and conversational runtime.

---

## Current State: Type Fragmentation

### DomainEvent — defined in 3 places

| Location | Variant | Consumers |
|---|---|---|
| `@curdeeclau/shared/src/events/DomainEvent.ts` | CANONICAL — full shape with correlationId, causationId, tenantId, etc. | crm-engine, calendar-engine |
| `handoff-engine/src/types.ts` | Local `HandoffDomainEvent` — subset of canonical | handoff-engine (self) |
| `workflow-orchestrator/src/events/DomainEvent.ts` | Local `createEvent()` — different factory, different shape | workflow-orchestrator (self) |

### Ownership — defined in 4 places

| Location | Variant | Consumers |
|---|---|---|
| `@curdeeclau/shared/src/runtime/Ownership.ts` | CANONICAL — `ConversationOwner`, `isTransferAllowed()` | crm-engine, calendar-engine |
| `handoff-engine/src/types.ts` | `HandoffState` enum (7 states) — owns the state machine | handoff-engine (self) |
| `crm-engine/src/runtime/OwnershipGuard.ts` | Wraps shared Ownership with CRM-specific rules | crm-engine (self) |
| `calendar-engine/src/runtime/OwnershipGuard.ts` | Wraps shared Ownership with calendar-specific rules | calendar-engine (self) |

**Verdict:** CRM and Calendar correctly extend shared. Handoff-engine should import `ConversationOwner` from shared instead of defining its own `HandoffState` in isolation.

### Engine interface — defined in 3 places

| Location | Variant |
|---|---|
| `workflow-orchestrator/src/types.ts` | `Engine` — `{ engineName, execute(action, context) }` |
| `crm-engine/src/types.ts` | `CRMEngine` class — not an interface, a concrete class |
| `calendar-engine/src/types.ts` | `CalendarEngine` class — not an interface, a concrete class |

**Verdict:** Only the orchestrator defines the engine contract. Engines don't implement a shared interface. This is the root cause of fragmentation.

### ExecutionContext — defined in 2 places

| Location | Variant |
|---|---|
| `@curdeeclau/shared/src/runtime/ExecutionContext.ts` | CANONICAL |
| `handoff-engine/src/types.ts` | `HandoffContext` — similar shape, different name |

---

## Target State: Contract Consolidation

### Contract 1: DomainEvent (consolidate)

**Action:** Handoff-engine and workflow-orchestrator MUST import from `@curdeeclau/shared` instead of defining local variants.

**Canonical shape (already in shared):**

```typescript
interface DomainEvent<T = Record<string, unknown>> {
  id: string;                          // "evt_" + ULID
  type: string;                        // PascalCase past-tense: "ContactCreated"
  timestamp: string;                   // ISO 8601
  tenantId: string;                    // "ten_" + ULID
  workspaceId?: string;
  verticalId?: string;
  conversationId?: string;
  workflowId?: string;
  correlationId: string;              // Groups events in same flow
  causationId?: string;               // Parent event
  actorId: string;                    // "usr_" or "sys_" + ULID
  payload: T;
  metadata?: Record<string, unknown>;
}
```

**Migration for handoff-engine:**
- Replace `HandoffDomainEvent` → `DomainEvent<HandoffPayload>`
- Use `correlationId`/`causationId` for traceability (already in shared shape)

**Migration for workflow-orchestrator:**
- Replace local `createEvent()` → `createDomainEvent()` from `@curdeeclau/shared`
- Use shared `DomainEvent` type in `WorkflowExecutor` and `EventDispatcher`

### Contract 2: IEngine (NEW)

**Action:** Create in `@curdeeclau/shared/src/engine/IEngine.ts`

```typescript
interface IEngine<TContext = Record<string, unknown>> {
  readonly engineName: string;
  readonly engineVersion: string;
  execute(action: string, context: TContext): Promise<EngineResult>;
}

interface EngineResult {
  readonly success: boolean;
  readonly data?: Record<string, unknown>;
  readonly error?: EngineError;
  readonly events: DomainEvent[];
}

interface EngineError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}
```

**Consumers after migration:**
- `crm-engine` — `CRMEngine implements IEngine<CRMContext>`
- `calendar-engine` — `CalendarEngine implements IEngine<CalendarContext>`
- `handoff-engine` — `HandoffEngine implements IEngine<HandoffContext>`
- `message-buffer-engine` — `MessageBufferEngine implements IEngine<BufferContext>`
- `knowledge-engine` — `KnowledgeEngine implements IEngine<KnowledgeContext>`
- `workflow-orchestrator` — consumes `IEngine`, drops local `Engine` type

### Contract 3: IProvider (NEW)

**Action:** Create in `@curdeeclau/shared/src/engine/IProvider.ts`

```typescript
interface IProvider<TConfig = Record<string, unknown>> {
  readonly providerName: string;
  readonly providerVersion: string;
  initialize(config: TConfig): Promise<void>;
  healthCheck(): Promise<boolean>;
  shutdown(): Promise<void>;
}
```

**Provider interfaces extend IProvider:**

```typescript
// In crm-engine
interface CRMProvider extends IProvider<CRMProviderConfig> {
  createContact(input: CreateContactInput): Promise<CRMContact>;
  updateContact(id: string, input: UpdateContactInput): Promise<CRMContact>;
  // ... other CRM operations
}

// In calendar-engine
interface CalendarProvider extends IProvider<CalendarProviderConfig> {
  checkAvailability(input: AvailabilityInput): Promise<AvailabilityResult>;
  createReservation(input: ReservationInput): Promise<Reservation>;
  // ... other calendar operations
}
```

### Contract 4: IChannel (NEW)

**Action:** Create in `@curdeeclau/shared/src/channels/IChannel.ts`

```typescript
interface IChannel {
  readonly channelName: string;
  readonly supportedActions: ReadonlyArray<ChannelAction>;
  send(request: ChannelRequest): Promise<ChannelResponse>;
}

type ChannelAction =
  | 'send_text'
  | 'send_media'
  | 'send_template'
  | 'send_interactive'
  | 'receive_message'
  | 'receive_webhook';

interface ChannelRequest {
  to: string;
  content: ChannelContent;
  metadata?: Record<string, unknown>;
}

interface ChannelResponse {
  success: boolean;
  providerMessageId?: string;
  error?: string;
}
```

**Current channel implementations to align:**
- `algorithmus-core-engine/src/infra/providers/ycloud/ycloudSender.ts`
- `algorithmus-platform/src/attention/output/whatsapp.sender.ts`
- `algorithmus-platform/src/attention/output/output-dispatcher.ts`
- `algorithmus-platform/src/attention/whatsapp/whatsapp.adapter.ts`

**Future channels that would implement IChannel:**
- Telegram (`providers/telegram/`)
- Web (chat widget)
- Voice (VAPI)

### Contract 5: EventCatalog (NEW)

**Action:** Create in `@curdeeclau/shared/src/events/EventCatalog.ts`

Centralizes ALL event type strings used across engines. Prevents string typos and enables discoverability.

```typescript
const EventCatalog = {
  // CRM
  CRM_CONTACT_CREATED: 'ContactCreated',
  CRM_CONTACT_UPDATED: 'ContactUpdated',
  CRM_OPPORTUNITY_CREATED: 'OpportunityCreated',
  CRM_OPPORTUNITY_MOVED: 'OpportunityMoved',
  CRM_TAG_ADDED: 'TagAdded',
  CRM_TAG_REMOVED: 'TagRemoved',
  CRM_PIPELINE_CREATED: 'PipelineCreated',
  CRM_CAMPAIGN_CREATED: 'CampaignCreated',
  CRM_CAMPAIGN_PAUSED: 'CampaignPaused',
  CRM_CAMPAIGN_RESUMED: 'CampaignResumed',

  // Calendar
  CALENDAR_AVAILABILITY_CHECKED: 'AvailabilityChecked',
  CALENDAR_RESERVATION_CREATED: 'ReservationCreated',
  CALENDAR_RESERVATION_CANCELLED: 'ReservationCancelled',
  CALENDAR_RESERVATION_RESCHEDULED: 'ReservationRescheduled',
  CALENDAR_TIMESLOT_BLOCKED: 'TimeSlotBlocked',
  CALENDAR_TIMESLOT_RELEASED: 'TimeSlotReleased',
  CALENDAR_REMINDER_CREATED: 'ReminderCreated',
  CALENDAR_REMINDER_TRIGGERED: 'ReminderTriggered',
  CALENDAR_REMINDER_CANCELLED: 'ReminderCancelled',

  // Handoff
  HANDOFF_REQUESTED: 'HandoffRequested',
  HANDOFF_ACCEPTED: 'HandoffAccepted',
  HANDOFF_REJECTED: 'HandoffRejected',
  HANDOFF_OWNERSHIP_CHANGED: 'OwnershipChanged',
  HANDOFF_SUPPRESSION_ACTIVATED: 'SuppressionActivated',
  HANDOFF_AI_RECOVERY_STARTED: 'AiRecoveryStarted',
  HANDOFF_AI_RECOVERED: 'AiRecovered',
  HANDOFF_CLOSED: 'HandoffClosed',

  // Workflow
  WORKFLOW_STARTED: 'WorkflowStarted',
  WORKFLOW_STEP_COMPLETED: 'WorkflowStepCompleted',
  WORKFLOW_COMPLETED: 'WorkflowCompleted',
  WORKFLOW_FAILED: 'WorkflowFailed',
  WORKFLOW_STATE_CHANGED: 'WorkflowStateChanged',

  // Conversational (future)
  CONVERSATION_STARTED: 'ConversationStarted',
  CONVERSATION_MESSAGE_RECEIVED: 'ConversationMessageReceived',
  CONVERSATION_MESSAGE_SENT: 'ConversationMessageSent',
  CONVERSATION_READY_TO_FLUSH: 'ConversationReadyToFlush',
  CONVERSATION_FLUSHED: 'ConversationFlushed',
  CONVERSATION_ENDED: 'ConversationEnded',
} as const;

type EventType = typeof EventCatalog[keyof typeof EventCatalog];
```

### Contract 6: Vertical Manifest Schema (NEW)

**Action:** Create JSON Schema in `openspec/schemas/vertical-manifest.schema.json`

Validates `verticals/{name}/manifest.json` structure. Currently only `dental/` exists, but this contract prevents future verticals from diverging.

### Contract 7: Workflow Definition Schema (NEW)

**Action:** Create JSON Schema in `openspec/schemas/workflow-definition.schema.json`

Defines the canonical workflow definition format that `workflow-orchestrator` consumes. This is the target format for n8n blueprint migration (future phase).

---

## Files to Create in @curdeeclau/shared

| File | Purpose |
|---|---|
| `src/engine/IEngine.ts` | Canonical Engine interface |
| `src/engine/IProvider.ts` | Canonical Provider base interface |
| `src/channels/IChannel.ts` | Canonical Channel abstraction |
| `src/events/EventCatalog.ts` | Central event type registry |

## Files to Create in openspec/

| File | Purpose |
|---|---|
| `schemas/vertical-manifest.schema.json` | Vertical manifest validation |
| `schemas/workflow-definition.schema.json` | Workflow definition validation |

## Files to MODIFY in existing engines

| File | Change |
|---|---|
| `handoff-engine/src/types.ts` | Replace `HandoffDomainEvent` with `DomainEvent<HandoffPayload>` from shared |
| `handoff-engine/src/engine/HandoffEngine.ts` | Implement `IEngine<HandoffContext>` |
| `workflow-orchestrator/src/types.ts` | Replace local `Engine` with `IEngine` from shared |
| `workflow-orchestrator/src/events/DomainEvent.ts` | Replace local `createEvent` with `createDomainEvent` from shared |
| `message-buffer-engine/src/types.ts` | Replace local context types with `ExecutionContext` from shared |
| `crm-engine/src/engine/CRMEngine.ts` | Add `implements IEngine<CRMContext>` |
| `calendar-engine/src/CalendarEngine.ts` | Add `implements IEngine<CalendarContext>` |

## Semantic Drift Prevention

After consolidation, the following CI checks prevent regression:

1. **No local DomainEvent definitions** — grep for `interface.*DomainEvent` outside `shared/`
2. **No local Ownership enums** — grep for `ConversationOwner` outside `shared/`
3. **All engines implement IEngine** — TypeScript typecheck
4. **All providers implement IProvider** — TypeScript typecheck
5. **No provider SDK imports in engines** — grep for `@pinecone`, `ycloud`, `@google` in `packages/engines/`
