---
ESTADO: SUPERSEDIDO COMO AUTORIDAD ACTIVA
Fecha: 2026-06-11
Supersedido por: .claude/memory/institutional/constitucion.md
Motivo: Pekín Foundation establece la autoridad constitucional activa de CURDEECLAU. Este documento pertenece a la etapa pre-Pekín / RT-1.5 y queda preservado como antecedente histórico o referencia técnica. Su contenido técnico permanece válido como referencia hasta su absorción formal por Pekín.
Uso permitido: consulta histórica, extracción de patrones, referencia técnica, absorción institucional.
Uso prohibido: citarlo como autoridad constitucional, gobernanza activa o fuente superior a Pekín.
---

# RT-1.5 — Semantic Freeze Constitution

> **Nature:** Constitutive. Not aspirational, not descriptive.
> **Effective:** RT-1 onward. Supersedes all prior implicit architectural assumptions.
> **Amendment:** Requires explicit governance commit with semantic justification. No silent amendments.

---

## Preamble

This constitution **declares** the semantic order of the Algorithmus runtime. It does not describe how the system currently behaves. It defines what is architecturally lawful.

Code that predates this constitution is **legacy-organic**, not authoritative. Governance is now authoritative even where implementation has not yet converged.

Every engine, provider, vertical, workflow, and event is subject to this constitution. No component is exempt.

---

## Article I — Canonical Ontology

### 1.1 — Runtime Entities

The platform recognizes exactly these canonical entities:

| Entity | Canonical ID Prefix | Defined In | Cardinality |
|---|---|---|---|
| **Conversation** | `conv_` | `shared/src/runtime/ConversationContext.ts` | One per interaction session |
| **Execution** | `exec_` | `shared/src/runtime/ExecutionContext.ts` | One per workflow invocation |
| **Workflow** | `wfl_` | `shared/src/workflow/WorkflowContext.ts` | One per workflow definition |
| **DomainEvent** | `evt_` | `shared/src/events/DomainEvent.ts` | One per state mutation |
| **Tenant** | `tnt_` | `shared/src/ids/EntityId.ts` | One per tenant |
| **Contact** | `cnt_` | `shared/src/crm/Contact.ts` | One per CRM contact |
| **Opportunity** | `opp_` | `shared/src/crm/Opportunity.ts` | One per CRM opportunity |
| **Pipeline** | `pip_` | `shared/src/crm/Pipeline.ts` | One per CRM pipeline |
| **Campaign** | `cmp_` | `shared/src/crm/Campaign.ts` | One per CRM campaign |
| **Calendar** | `cal_` | `shared/src/calendar/Calendar.ts` | One per calendar |
| **TimeSlot** | `tsl_` | `shared/src/calendar/TimeSlot.ts` | One per availability slot |
| **Reservation** | `rsv_` | `shared/src/calendar/Reservation.ts` | One per booking |
| **Reminder** | `rmd_` | `shared/src/calendar/Reminder.ts` | One per scheduled reminder |

### 1.2 — Governance Entities

These entities exist ONLY at the governance layer. They are NOT persisted as domain entities:

| Entity | Defined In | Purpose |
|---|---|---|
| **Ownership** | `shared/src/runtime/Ownership.ts` | Runtime governance gate |
| **Suppression** | `shared/src/runtime/Suppression.ts` | AI behavioral constraint |

### 1.3 — Entity Authority

- **Canonical shape** of every entity is defined EXACTLY ONCE in `packages/shared/src/`.
- No engine, provider, or vertical may redefine the shape of a canonical entity.
- Extensions go in `metadata` fields, never in the structural fields of canonical types.
- Provider-specific IDs (GHL contact IDs, Chatwoot conversation IDs) are NOT canonical IDs. They live in provider adapter metadata.

### 1.4 — Ontological Stability

- New canonical entities require an OpenSpec proposal with semantic justification.
- Removing a canonical entity requires a deprecation period spanning at least one governance version.
- Renaming a canonical entity IS removing + adding — same governance bar applies.

---

## Article II — Runtime Invariants

### 2.1 — Event Invariants

- **I-E1:** Every mutation of observable runtime state MUST emit exactly one `DomainEvent`.
- **I-E2:** Every `DomainEvent` within a single workflow execution MUST share the same `correlationId`.
- **I-E3:** Every `DomainEvent` that is a direct reaction to a prior event MUST carry `causationId` pointing to that prior event's `id`.
- **I-E4:** Every `DomainEvent` MUST carry `actorId` identifying the triggering agent (engine name, user ID, or `"system"`).
- **I-E5:** `DomainEvent` is immutable after creation. No field may be updated, deleted, or nullified post-emission.
- **I-E6:** Event IDs MUST be globally unique. ULID or UUIDv7 is required. Monotonic counters are forbidden.
- **I-E7:** Provider-specific data lives in `metadata`, never in `payload` structure.
- **I-E8:** `DomainEvent` is the ONLY mechanism for cross-engine communication. No shared mutable state between engines. No direct engine-to-engine method calls.

### 2.2 — Execution Invariants

- **I-X1:** Every workflow execution has a unique `executionId`.
- **I-X2:** Every step execution emits either `WorkflowStepExecuted` or `WorkflowStepFailed`.
- **I-X3:** `WorkflowCompleted` MUST carry `totalSteps` and `completedSteps` in its payload.
- **I-X4:** State transitions MUST be declared in the workflow's state machine definition. Undeclared transitions are unlawful.
- **I-X5:** Unknown engines produce `step.status = 'failed'` with structured error. Throwing is prohibited.

### 2.3 — Ownership Invariants

- **I-O1:** Ownership is per-conversation. Two conversations may have different owners.
- **I-O2:** Only `handoff-engine` may mutate ownership. All other engines read ownership; they never write it.
- **I-O3:** `LOCKED` ownership blocks ALL write operations across ALL engines. No engine may bypass this.
- **I-O4:** Every ownership transition emits `OwnershipChanged` with `previousOwner`, `newOwner`, and `reason`.
- **I-O5:** Ownership records are immutable. No updates, no deletes.

### 2.4 — Provider Invariants

- **I-P1:** No engine may directly call a provider API. All provider access goes through a provider interface defined in the engine.
- **I-P2:** Provider IDs are stored in `metadata.providerId`, NOT in canonical entity fields.
- **I-P3:** Provider events (webhooks, callbacks) MUST be mapped to canonical `DomainEvent` types before entering the runtime.
- **I-P4:** Provider unavailability is a transient error. It is retried with backoff. It never corrupts runtime state.

### 2.5 — Determinism Invariant

- **I-D1:** Same `(engine, action, context)` → same `(result, events)`. Engines are pure-ish. AI may enrich context; it never decides state transitions.

---

## Article III — Contract Authority Rules

### 3.1 — Authority Hierarchy

```
1. RT Constitution (this document)     ← Supreme. Cannot be overridden.
2. OpenSpec governance/               ← Authoritative for specific domains (events, ownership, orchestration)
3. OpenSpec changes/<engine>/specs/   ← Authoritative for individual engine behavior
4. packages/shared/src/               ← Canonical TypeScript contracts. Bind all consumers.
5. Engine implementations             ← Must conform to 1-4. Non-conformance is drift to be corrected.
6. Vertical config                    ← Domain-specific policy. Must not contradict 1-5.
7. Provider adapters                  ← Must implement engine-defined interfaces. Leaf nodes.
```

### 3.2 — Conflict Resolution

- If `shared/` contradicts this constitution, the constitution wins. Fix `shared/`.
- If an engine implementation contradicts its OpenSpec, the spec wins. Fix the engine.
- If a vertical config contradicts an engine spec, the spec wins. Fix the config.
- If two governance documents contradict each other, this constitution arbitrates.

### 3.3 — Type Authority

- `packages/shared/src/` is the **sole authoritative source** for canonical entity shapes, event structure, context shapes, ownership types, and suppression types.
- Engines MAY define engine-specific types (config, error codes, input shapes) but MUST import canonical types from `@curdeeclau/shared`.
- Redefining a canonical type locally (even if structurally identical) is a governance violation.

### 3.4 — Import Direction

```
shared/          ← imports nothing from engines or verticals
engines/         ← imports from shared/ only (except orchestrator, which coordinates engines)
verticals/       ← imports from shared/, references engines by name only
providers/       ← imports from shared/ and the engine interface they implement
apps/            ← imports from shared/, engines/, verticals/
```

---

## Article IV — Dependency Direction Rules

### 4.1 — Layer Access

| Layer | May Import From | May NOT Import From |
|---|---|---|
| `shared/` | Nothing internal (stdlib only) | Engines, providers, verticals, apps |
| `engines/` | `shared/` | Other engines (except orchestrator), verticals, apps |
| `workflow-orchestrator` | `shared/`, all engine registries | Verticals, apps, providers directly |
| `verticals/` | `shared/` (types only) | Engine internals, provider internals |
| `providers/` | `shared/`, engine interfaces they implement | Other providers, verticals, apps |
| `apps/` | `shared/`, engine public APIs, vertical config | Engine internals, provider internals |

### 4.2 — Cross-Engine Communication

- Engines communicate ONLY through the orchestrator + `DomainEvent` dispatch.
- Engine A never calls Engine B's `execute()` method directly.
- The orchestrator is the sole coordination point. There is no peer-to-peer engine communication.

### 4.3 — Provider Isolation

- Provider A (GHL) and Provider B (Chatwoot) have zero knowledge of each other.
- A provider adapter depends on: (a) `shared/` types, (b) the engine interface it implements. Nothing else.
- Switching providers MUST require ONLY swapping the adapter. Zero engine code changes.

---

## Article V — Event Governance Semantics

### 5.1 — Event as Universal Primitive

The `DomainEvent` is the **universal communication primitive** of the runtime. Every observable state change is an event. Every coordination between engines is mediated by events.

### 5.2 — Event Shape (Non-Negotiable)

```typescript
interface DomainEvent {
  id: string;              // ULID or UUIDv7 — globally unique
  type: string;            // Past-tense PascalCase discriminator
  timestamp: number;       // Unix ms
  tenantId?: string;       // tnt_ prefix
  workspaceId?: string;    // wsp_ prefix
  conversationId?: string; // conv_ prefix
  workflowId?: string;     // wfl_ prefix
  correlationId?: string;  // Ties events in same causal flow
  causationId?: string;    // Points to immediate parent event
  actorId?: string;        // Who triggered (engine name, userId, "system")
  verticalId?: string;     // Domain discriminator
  payload?: unknown;       // Event-specific data
  metadata?: Record<string, unknown>; // Provider traces, observability
}
```

**No field is optional in governance.** Every field that is semantically available MUST be populated when relevant. `causationId` is required on every reaction event. `actorId` is required on every event.

### 5.3 — Event Naming Convention

- Past tense, PascalCase: `ContactCreated`, `OpportunityMoved`, `HandoffRequested`.
- Domain implicit in type name. No engine prefix noise.
- New event types require OpenSpec justification. The event catalog is finite and governed.

### 5.4 — Event Catalog (Governed Set)

| Category | Event Types |
|---|---|
| Workflow | `WorkflowStarted`, `WorkflowStepExecuted`, `WorkflowStepFailed`, `WorkflowCompleted`, `WorkflowFailed` |
| Handoff | `HandoffRequested`, `HandoffAccepted`, `HandoffRejected`, `OwnershipChanged`, `SuppressionActivated`, `AIRecoveryStarted`, `AIRecovered`, `HandoffClosed` |
| CRM | `ContactCreated`, `ContactUpdated`, `OpportunityCreated`, `OpportunityMoved`, `TagAdded`, `TagRemoved`, `PipelineCreated`, `CampaignCreated`, `CampaignPaused`, `CampaignResumed` |
| Messaging | `MessageBuffered`, `ConversationReadyToFlush` |
| Calendar | `TimeSlotReserved`, `ReservationCancelled`, `ReminderTriggered` |
| State | `StateTransitioned` |

**Adding to this catalog requires an OpenSpec proposal.** No engine may invent event types outside this governed set.

### 5.5 — Event Chain Integrity

Events form a Directed Acyclic Graph. The `correlationId` chains every event in a workflow execution. The `causationId` reconstructs the exact causal path. Both chains MUST be intact at all times. Dropping `causationId` breaks audit trail. Dropping `correlationId` breaks traceability.

---

## Article VI — Context Propagation Semantics

### 6.1 — Context is the Execution Envelope

Context flows from orchestrator → engines → back to orchestrator. It carries everything an engine needs to execute deterministically.

### 6.2 — Required Context Fields

Every `engine.execute(action, context)` call MUST receive a context carrying:

```
conversationId   — Parent conversation (conv_)
workflowId       — Workflow being executed (wfl_)
executionId      — Unique execution (exec_)
correlationId    — Event correlation chain
tenantId         — Tenant scope (tnt_)
actorId          — Triggering agent
verticalId       — Domain discriminator
currentState     — State machine position
state            — Accumulated step outputs (Record<string, unknown>)
```

### 6.3 — Context Enrichment

- Each step's output enriches `context.state` for downstream steps.
- Context is read-only within a single step execution. A step returns output; the orchestrator merges it.
- Context is NOT a grab-bag. Keys in `context.state` follow naming conventions: `contactId`, `opportunityId`, `pipelineId`, etc.

### 6.4 — Context Isolation

- Context from execution A never leaks into execution B.
- Context from tenant A never leaks into tenant B.
- Cross-contamination is a governance violation of the highest severity.

---

## Article VII — Ownership Semantics

### 7.1 — Ownership Modes (Exhaustive)

```
AI      — AI agent in full control (default)
HUMAN   — Human operator has taken over
SHARED  — AI suggests, human approves
LOCKED  — All mutations frozen (legal hold, compliance)
```

**These four modes are EXHAUSTIVE.** No engine, vertical, or provider may introduce additional ownership modes. Sub-modes (e.g., "AI with elevated permissions") are forbidden — use metadata, not new modes.

### 7.2 — Ownership Authority

- `handoff-engine` is the SOLE writer of ownership state.
- All other engines READ ownership via `shared/src/runtime/Ownership.ts` and GATE actions on it.
- The `isTransferAllowed()` function in `shared/` is the definitive arbiter of valid transitions. No engine may implement its own transfer validation.

### 7.3 — Ownership Gating Matrix

| Action Class | AI | HUMAN | SHARED | LOCKED |
|---|---|---|---|---|
| Read | ✓ | ✓ | ✓ | ✓ |
| Create (low risk: contacts, tags) | ✓ | ✓ | ✓ | ✗ |
| Create (high risk: opportunities, pipelines) | ✗ | ✓ | ✗¹ | ✗ |
| Update (low risk) | ✓ | ✓ | ✓ | ✗ |
| Update (high risk: stage changes, campaign state) | ✗ | ✓ | ✗¹ | ✗ |
| Delete (any) | ✗ | ✓ | ✗ | ✗ |

¹ Allowed if context carries explicit human approval (`approvedBy`).

### 7.4 — Ownership-Suppression Coupling

```
AI      → NONE
HUMAN   → FULL_SUPPRESSION
SHARED  → ASSIST_MODE
LOCKED  → FULL_SUPPRESSION
```

When ownership changes, suppression updates automatically. This coupling is enforced by `handoff-engine` — never by individual engines.

---

## Article VIII — Provider Boundaries

### 8.1 — Provider Definition

A provider is an **external system** that the runtime communicates with: GHL, Chatwoot, WhatsApp, Pinecone, Supabase. Providers are NOT part of the Algorithmus runtime. They are external dependencies behind adapters.

### 8.2 — Adapter Pattern (Mandatory)

Every provider MUST be accessed through an adapter that implements an engine-defined interface:

```
Engine defines:  CRMProvider { createContact, updateContact, getContact, ... }
Adapter implements: GHLAdapter implements CRMProvider { ... }
Engine calls:    this.provider.createContact(input)  ← never this.ghlApi.contacts.create()
```

### 8.3 — ID Separation

- Canonical IDs (`cnt_`, `opp_`, etc.) are generated by the runtime.
- Provider IDs (GHL's `contact.id`, Chatwoot's `conversation.id`) are stored in entity `metadata.providerId`.
- The runtime NEVER uses provider IDs as primary keys.
- Lookup by provider ID is an adapter concern: `findContactByProviderId(provider, providerId)`.

### 8.4 — Event Mapping

Provider events (GHL webhooks, WhatsApp callbacks) do NOT enter the runtime directly. The adapter maps them to canonical `DomainEvent` types:

```
GHL webhook "contact.create"  →  adapter  →  DomainEvent { type: "ContactCreated" }
```

Raw provider events are adapter-internal. The runtime only sees canonical events.

### 8.5 — Provider Failure Semantics

- Provider errors are transient. They produce `PROVIDER_UNAVAILABLE` or `PROVIDER_TIMEOUT` errors.
- Transient errors retry with exponential backoff (1s, 4s, 16s). Max 3 attempts.
- After max retries: escalate to human via handoff.
- Provider failure NEVER corrupts runtime state. In-memory state remains consistent.

---

## Article IX — Vertical Isolation Rules

### 9.1 — Vertical Definition

A vertical is a **domain-specific instantiation** of the Algorithmus runtime: dental/Sarah, academic/EVA. Each vertical has its own workflows, policies, knowledge base, prompts, and configuration.

### 9.2 — Isolation Guarantees

- **State isolation:** Vertical A's conversation state is inaccessible to Vertical B.
- **Knowledge isolation:** Vertical A's RAG knowledge is never queried by Vertical B.
- **Policy isolation:** Vertical A's handoff policies, suppression rules, and workflow definitions apply only to Vertical A.
- **Event isolation:** Events carry `verticalId`. Consumers filter by vertical. Cross-vertical event leakage is a governance violation.

### 9.3 — Shared vs Vertical-Specific

| Concern | Shared (Platform) | Vertical-Specific |
|---|---|---|
| Canonical entities | ✓ | — |
| Engine implementations | ✓ | — |
| Workflow definitions | — | ✓ |
| Handoff policies | — | ✓ |
| Knowledge base (RAG) | — | ✓ |
| Prompts / AI templates | — | ✓ |
| Suppression rules | Default matrix | Override per vertical |
| Provider configuration | Interface | Credentials + instance |

### 9.4 — Multi-Vertical Invariant

Adding a new vertical MUST NOT require changes to any engine, any canonical type, or any existing vertical. The platform is vertical-agnostic; verticals are platform consumers.

---

## Article X — Forbidden Architectural Patterns

### 10.1 — Prohibited by Constitution

The following patterns are architecturally unlawful. Code exhibiting them is in violation of this constitution, regardless of when it was written.

#### X.1 — Canonical Type Redefinition

**Prohibited:** Defining a type in an engine, provider, or vertical that shadows a canonical type from `shared/`.

```typescript
// VIOLATION — redefines DomainEvent locally
// In workflow-orchestrator/src/types.ts:
export interface DomainEvent { ... }
```

**Required:** Import from `@curdeeclau/shared`.

#### X.2 — Direct Provider Coupling

**Prohibited:** An engine calling a provider API directly without an adapter interface.

```typescript
// VIOLATION — direct HTTP to GHL
const contact = await fetch(`https://rest.gohighlevel.com/v1/contacts/${id}`);
```

**Required:** `this.provider.getContact(id)` where `provider` implements the engine's provider interface.

#### X.3 — Provider ID as Canonical ID

**Prohibited:** Using an external system's ID as a canonical entity ID.

```typescript
// VIOLATION
contact.id = ghlContact.id;  // GHL's "abc123" becomes canonical cnt_abc123
```

**Required:** Generate canonical ID (`cnt_<ulid>`). Store GHL ID in `metadata.providerId`.

#### X.4 — Ownership Bypass

**Prohibited:** Any engine performing a gated action without checking ownership.

```typescript
// VIOLATION
async moveOpportunity(id, stage) {
  // No ownership check — moves opportunity even under LOCKED
  return this.provider.moveOpportunity(id, stage);
}
```

**Required:** Gate through `OwnershipGuard` before every write operation.

#### X.5 — Silent State Change

**Prohibited:** Mutating runtime state without emitting a `DomainEvent`.

```typescript
// VIOLATION
this.contacts.set(id, updatedContact);  // No event emitted
return { success: true };
```

**Required:** Emit event, then mutate state, then return result.

#### X.6 — Cross-Engine Direct Call

**Prohibited:** Engine A calling `engineB.execute()` directly.

```typescript
// VIOLATION
const result = await this.handoffEngine.accept(conversationId);
```

**Required:** Go through orchestrator. Engine A emits event → orchestrator routes → Engine B handles.

#### X.7 — Engine Throwing Exceptions

**Prohibited:** Using `throw` for business logic errors or invalid states.

```typescript
// VIOLATION
if (!contact) throw new Error('Contact not found');
```

**Required:** Return structured error: `{ error: 'CONTACT_NOT_FOUND', message: '...' }`.

#### X.8 — Framework Coupling

**Prohibited:** Engine code importing framework-specific modules (Next.js, Express, React).

```typescript
// VIOLATION
import { NextRequest } from 'next/server';
```

**Required:** Engines are framework-agnostic. They run in any Node.js runtime.

#### X.9 — AI-Decided State Transitions

**Prohibited:** Using AI model output to directly determine state transitions or workflow routing.

```typescript
// VIOLATION
const decision = await ai.classify(message);
if (decision === 'handoff') { ... }  // AI decides routing
```

**Required:** AI enriches context (classification, sentiment, intent as metadata). Rule-based engine evaluates context against policy and decides routing deterministically.

#### X.10 — Event Suppression

**Prohibited:** Conditionally not emitting an event that should have been emitted. Filtering or silencing events for operational convenience.

**Required:** Every mutation emits. Subscribers filter if needed; emitters never suppress.

---

## Article XI — Amendment Protocol

### 11.1 — Amendment Gravity

- **Minor:** Clarification of existing semantics, typo fixes, non-semantic improvements to governance docs. Requires: governance commit with clear change description.
- **Standard:** New invariant, new forbidden pattern, new canonical entity, event catalog change. Requires: OpenSpec proposal + governance commit.
- **Constitutional:** Changing existing invariants, ownership modes, authority hierarchy, dependency direction. Requires: OpenSpec proposal + governance commit + explicit semantic justification addressing backward compatibility.

### 11.2 — Amendment Trace

Every amendment MUST cite the commit hash where it was enacted. The constitution carries an amendment log.

### 11.3 — Versioning

```
RT-1.0 — Initial runtime topology
RT-1.5 — Semantic freeze (this document)
RT-2.0 — Enforcement complete (all engines converged)
```

---

## Appendix A — Governed File Registry

These files are under constitutional protection. Their semantics cannot be changed without amendment.

| File | Governed Aspect |
|---|---|
| `packages/shared/src/events/DomainEvent.ts` | Event shape, factory, type guard |
| `packages/shared/src/runtime/Ownership.ts` | Ownership modes, transfer validation, record shape |
| `packages/shared/src/runtime/Suppression.ts` | Suppression modes, permission matrix, record shape |
| `packages/shared/src/runtime/ExecutionContext.ts` | Execution context shape, factory |
| `packages/shared/src/runtime/ConversationContext.ts` | Conversation context shape, factory |
| `packages/shared/src/workflow/WorkflowContext.ts` | Workflow context shape, step result shape |
| `packages/shared/src/ids/EntityId.ts` | ID prefixes, branded types, validation |
| `packages/shared/src/crm/Contact.ts` | CRM contact shape, factory |
| `packages/shared/src/crm/Opportunity.ts` | CRM opportunity shape, status type |
| `packages/shared/src/crm/Pipeline.ts` | CRM pipeline shape, stage type |
| `packages/shared/src/crm/Campaign.ts` | CRM campaign shape, status type |
| `openspec/governance/ownership-model.md` | Ownership semantics, permission matrix |
| `openspec/governance/event-model.md` | Event catalog, causality model, dispatch |
| `openspec/governance/runtime-semantics.md` | Lifecycle, failure modes, retry philosophy |

---

## Appendix B — Drift Catalog (RT-1 Baseline)

Known divergences between constitution and current implementation. These are **documented drift**, not authority — the constitution governs; code will converge.

| Drift ID | Location | Divergence | Severity |
|---|---|---|---|
| D-001 | `workflow-orchestrator/src/types.ts` | Redefines DomainEvent without causationId, actorId, verticalId, workspaceId, metadata | Critical |
| D-002 | `workflow-orchestrator/src/types.ts` | Redefines WorkflowContext, StepResult, StepStatus instead of importing from shared/ | Critical |
| D-003 | `workflow-orchestrator/src/events/DomainEvent.ts` | Event ID uses monotonic counter, not ULID/UUIDv7 (violates I-E6) | High |
| D-004 | `handoff-engine/src/types.ts` | Defines HandoffDomainEvent as parallel event universe instead of extending canonical DomainEvent | High |
| D-005 | `ghl-engine/src/types.ts` | Exports GHL-shaped entities (GHLContact, GHLOpportunity) with no canonical mapping | High |
| D-006 | `ghl-engine/` | No adapter implementing CRMProvider interface from crm-engine | High |
| D-007 | `crm-engine/src/types.ts` | Defines CRMEngineContext diverging from shared/ ExecutionContext | Medium |
| D-008 | `handoff-engine/` | No OpenSpec change folder (governs ownership/suppression/recovery — most critical runtime concepts) | Medium |
| D-009 | `workflow-orchestrator/` | No OpenSpec change folder | Medium |
| D-010 | `math-engine/` | Python project outside pnpm workspace; no shared contract integration | Low |

---

*Constitution enacted RT-1.5. All architectural authority derives from this document.*
