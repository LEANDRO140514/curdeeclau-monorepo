# Runtime Topology Report — curdeeclau-monorepo

**Date:** 2026-05-18
**Branch:** main
**Scope:** Full monorepo runtime architecture analysis
**Method:** Read-only deep exploration — no code modified

---

## 1. Runtime Topology Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          APPS LAYER (5 apps)                             │
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌────────────────┐  │
│  │ quiniela-2026        │  │ landing_oraculo     │  │ dental-ai      │  │
│  │ (Vite+React+Zustand) │  │ (Next.js+Supabase)  │  │ (Next.js)      │  │
│  │ ★ MOST MATURE        │  │ △ scaffold          │  │ △ scaffold     │  │
│  └──────┬───────────────┘  └─────────────────────┘  └──────┬─────────┘  │
│         │            internal engine                        │            │
│         │     lib/quiniela/* (72 files)                     │            │
│         │                                                   │            │
│  ┌──────┴───────────────────────────────────────────────────┴─────────┐  │
│  │ survivor-world-cup (spec only)   │ reducidas-2026 (standalone HTML) │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ workspace:*
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     ENGINE LAYER (7 engines)                             │
│                                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ crm-engine   │ │ calendar-eng │ │ handoff-eng  │ │ workflow-orc │   │
│  │ 19 src files │ │ 17 src files │ │ 14 src files │ │ 10 src files │   │
│  │ ★ CANONICAL  │ │ ★ CANONICAL  │ │ ★ CANONICAL  │ │ ★ CANONICAL  │   │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘   │
│         │                │                │                │            │
│  ┌──────┴───────┐ ┌──────┴───────┐ ┌──────┴───────┐                    │
│  │ msg-buffer   │ │ ghl-engine   │ │ media-deliv  │                    │
│  │ 9 src files  │ │ 3 src files  │ │ 3 src files  │                    │
│  │ ★ CANONICAL  │ │ ◐ STUB       │ │ ◐ STUB       │                    │
│  └──────────────┘ └──────────────┘ └──────────────┘                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ workspace:*
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    SHARED CONTRACTS LAYER                                │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ @curdeeclau/shared (10 src files)                             │       │
│  │ DomainEvent · Ownership · Suppression · EntityIds · Context   │       │
│  │ CRM · Calendar · Workflow · Execution                        │       │
│  │ ★ SOURCE OF TRUTH for canonical types                        │       │
│  └──────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ workspace:*
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE LAYER                                       │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ @curdeeclau/knowledge-engine (12 src files)                   │       │
│  │ Pinecone RAG · Zod schemas · Chunking · Embedding · Retrieval │       │
│  │ ★ CANONICAL — heavy dental vertical coupling in schemas       │       │
│  └──────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (Python, separate runtime)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    MATH LAYER                                            │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ math-engine (Python · FastAPI · OR-Tools CP-SAT)              │       │
│  │ Covering design solver for quiniela reductions                │       │
│  │ ★ CANONICAL — isolated Python runtime                         │       │
│  └──────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (production conversational runtime)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    ALGORITHMUS LAYER (production runtime)                │
│                                                                          │
│  ┌──────────────────────────┐  ┌──────────────────────────┐            │
│  │ algorithmus-core-engine  │  │ algorithmus-platform     │            │
│  │ 42+ src files            │  │ 12 src files             │            │
│  │ Express + BullMQ + Redis │  │ Express v5 orchestrator  │            │
│  │ + PostgreSQL + Pinecone  │  │ attention/whatsapp layer │            │
│  │ FSM · LLM · RAG · Valid  │  │                          │            │
│  │ ★ PRODUCTION RUNTIME     │  │ ★ ORCHESTRATION LAYER    │            │
│  └──────────────────────────┘  └──────────────────────────┘            │
│                                                                          │
│  ┌──────────────────────────┐                                           │
│  │ forge (Next.js app)      │                                           │
│  │ Forge V3.1 frontend      │                                           │
│  │ △ DUPLICATE of landing   │                                           │
│  └──────────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (domain configuration)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    VERTICALS LAYER (1 vertical)                          │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ verticals/dental/ (26 files)                                  │       │
│  │ manifest · config · knowledge(8) · schemas(5) · prompts(3)   │       │
│  │ policies(3) · states · tools · workflows(2)                  │       │
│  │ ★ REFERENCE VERTICAL — fully specified, partially implemented │       │
│  └──────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (n8n workflow definitions)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW BLUEPRINTS LAYER                             │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ workflows/blueprints/ (39 JSON + 13 _meta.json)               │       │
│  │ workflows/extracted-patterns/ (13 .md pattern docs)           │       │
│  │ 13 domains: agents·calendar·crm·data·handoff·lovable·media   │       │
│  │             message-buffer·payments·rag·reservas·scraping·voice│      │
│  │ ★ REFERENCE BLUEPRINTS — n8n exports, not engine code         │       │
│  └──────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (architectural governance)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    GOVERNANCE LAYER (OpenSpec)                           │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │ openspec/ (24 files)                                          │       │
│  │ governance/(5) · conventions/(3) · templates/(4)              │       │
│  │ changes/(3 proposals: ghl-engine, calendar-engine, knowledge) │       │
│  │ ★ CANONICAL GOVERNANCE — formal spec before implementation    │       │
│  └──────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Runtime Layer Classification

### Layer 0 — Canonical Contracts (source of truth)

| Artifact | Files | Status |
|---|---|---|
| `@curdeeclau/shared` | 10 src + 5 test | **CANONICAL** — all engines depend on this |
| `openspec/governance/*` | 5 docs | **CANONICAL** — formal governance model |
| `docs/architecture/memory-governance.md` | 1 doc | **CANONICAL** — memory philosophy |

### Layer 1 — Engine Runtime (deterministic execution)

| Engine | Files | Status | Completeness |
|---|---|---|---|
| `crm-engine` | 19 src + 7 test | **CANONICAL** | ✅ InMemory provider, GHL stub |
| `calendar-engine` | 17 src + 7 test | **CANONICAL** | ✅ InMemory provider, Google stub |
| `handoff-engine` | 14 src + 5 test | **CANONICAL** | ✅ Full implementation |
| `workflow-orchestrator` | 10 src + 4 test | **CANONICAL** | ✅ InMemory execution |
| `message-buffer-engine` | 9 src + 4 test | **CANONICAL** | ✅ InMemory store |
| `ghl-engine` | 3 src | **STUB** | ◐ Types only, no implementation |
| `media-delivery-engine` | 3 src | **STUB** | ◐ Types only, no implementation |

### Layer 2 — Knowledge & AI

| Engine | Files | Status | Completeness |
|---|---|---|---|
| `knowledge-engine` | 12 src | **CANONICAL** | ◐ Chunking working, RAG stubs |
| `math-engine` (Python) | 3 src + test | **CANONICAL** | ✅ Solver working, API scaffolded |

### Layer 3 — Production Conversational Runtime

| Engine | Files | Status | Completeness |
|---|---|---|---|
| `algorithmus-core-engine` | 42+ src + tests | **PRODUCTION** | ✅ FSM + LLM + RAG + Validation |
| `algorithmus-platform` | 12 src | **PRODUCTION** | ✅ Orchestrator + WhatsApp adapter |

### Layer 4 — Application Layer

| App | Files | Status | Maturity |
|---|---|---|---|
| `quiniela-2026_deepclaude` | 72 src files | **PRODUCTION** | ★ Most mature |
| `landing_oraculo_society_forge` | Scaffold | **EXPERIMENTAL** | △ Boilerplate only |
| `dental-ai-receptionist` | Scaffold | **EXPERIMENTAL** | △ Boilerplate only |
| `reducidas-2026` | 1 HTML | **DEPRECATED** | ✗ Standalone, superseded by quiniela |
| `survivor-world-cup` | 7 spec docs | **EXPERIMENTAL** | △ Spec only, no code |

### Layer 5 — Vertical Configuration

| Vertical | Files | Status | Completeness |
|---|---|---|---|
| `verticals/dental/` | 26 files | **REFERENCE** | ✅ Fully specified, partially wired |

### Layer 6 — Workflow Blueprints

| Category | Files | Status |
|---|---|---|
| `workflows/blueprints/` | 39 JSON + 13 meta | **REFERENCE** — n8n exports |
| `workflows/extracted-patterns/` | 13 .md | **REFERENCE** — pattern docs |

---

## 3. Dependency Map

```
┌────────────────────────────────────────────────────────────────────┐
│                        DEPENDENCY FLOW                             │
│                                                                    │
│  apps/quiniela-2026                                                │
│    └── (internal lib/quiniela/* — self-contained, zero ext deps)   │
│                                                                    │
│  apps/dental-ai-receptionist                                       │
│    └── @curdeeclau/knowledge-engine (workspace:*)                  │
│                                                                    │
│  apps/landing_oraculo_society_forge                                │
│    └── @supabase/supabase-js + @supabase/ssr (external)            │
│                                                                    │
│  packages/engines/calendar-engine                                  │
│    └── @curdeeclau/shared (workspace:*)                            │
│                                                                    │
│  packages/engines/crm-engine                                       │
│    └── @curdeeclau/shared (workspace:*)                            │
│                                                                    │
│  packages/engines/handoff-engine                                   │
│    └── (standalone — defines own types, no shared dep)             │
│                                                                    │
│  packages/engines/workflow-orchestrator                            │
│    └── (standalone — defines own types, no shared dep)             │
│                                                                    │
│  packages/engines/message-buffer-engine                            │
│    └── (standalone — defines own types)                            │
│                                                                    │
│  packages/engines/ghl-engine                                       │
│    └── (standalone — types only)                                   │
│                                                                    │
│  packages/engines/media-delivery-engine                            │
│    └── (standalone — types only)                                   │
│                                                                    │
│  packages/knowledge-engine                                         │
│    └── @pinecone-database/pinecone + zod (external)                │
│                                                                    │
│  packages/math-engine (Python)                                     │
│    └── fastapi + uvicorn + ortools (external)                      │
│                                                                    │
│  packages/algorithmus/algorithmus-core-engine                      │
│    └── Express + BullMQ + Redis + PostgreSQL + Pinecone + Sentry   │
│    └── OpenAI + OpenRouter + Gemini (LLM providers)                │
│    └── YCloud (WhatsApp provider)                                  │
│                                                                    │
│  packages/algorithmus/algorithmus-platform                         │
│    └── algorithmus-core-engine (@core alias via tsconfig paths)    │
│    └── Express v5                                                  │
└────────────────────────────────────────────────────────────────────┘
```

**Critical observation:** Only 2 of 7 engines consume `@curdeeclau/shared`. The rest (handoff, workflow-orchestrator, message-buffer, ghl, media-delivery) define their own types internally, creating **duplicate type definitions** for concepts like `DomainEvent`, `Ownership`, and `ExecutionContext`.

---

## 4. Classification Matrix

### CANONICAL

| Artifact | Rationale |
|---|---|
| `@curdeeclau/shared` | Single source of truth for entity types, events, ownership |
| `crm-engine` | Full implementation with formal OpenSpec, 22 invariants |
| `calendar-engine` | Full implementation with formal OpenSpec, 30 invariants |
| `handoff-engine` | Full implementation, ownership state machine |
| `workflow-orchestrator` | Deterministic orchestration runtime |
| `message-buffer-engine` | Full implementation, conversation buffering |
| `knowledge-engine` | RAG retrieval with Zod schemas |
| `math-engine` (Python) | CP-SAT covering design solver |
| `openspec/governance/*` | Formal governance models |
| `docs/architecture/*` | Architectural decision records |

### REUSABLE

| Artifact | Rationale |
|---|---|
| `workflows/blueprints/*` | n8n workflow templates reusable across verticals |
| `workflows/extracted-patterns/*` | Design pattern documentation |
| `openspec/templates/*` | Spec/design/proposal templates |
| `quiniela-2026/src/lib/quiniela/*` | Math engine (portable, zero UI deps) — should be extracted to packages |

### EXPERIMENTAL

| Artifact | Rationale |
|---|---|
| `apps/dental-ai-receptionist` | Scaffold only, no implementation |
| `apps/landing_oraculo_society_forge` | Scaffold only, no implementation |
| `apps/survivor-world-cup` | Spec documents only, no code |
| `algorithmus-core-engine` FSM+LLM pipeline | Production but still evolving validation layer |

### DEPRECATED

| Artifact | Rationale |
|---|---|
| `apps/reducidas-2026` | Standalone HTML superseded by quiniela-2026 app |

### PROVIDER-SPECIFIC

| Artifact | Provider | Risk |
|---|---|---|
| `algorithmus-core-engine` YCloud integration | YCloud (WhatsApp API) | Provider lock-in risk |
| `algorithmus-core-engine` OpenAI moderation | OpenAI Moderation API | Provider coupling in safety path |
| `algorithmus-core-engine` Pinecone RAG | Pinecone vector DB | Provider coupling in retrieval |
| `algorithmus-core-engine` Supabase client | Supabase (legacy path) | Dual persistence ambiguity |
| `ghl-engine` types | GoHighLevel CRM | Design-time coupling |
| `knowledge-engine` Pinecone | Pinecone vector DB | Provider coupling |
| `workflows/blueprints/*` | Google Calendar + Sheets + Gmail + Chatwoot | Heavy provider coupling in n8n layer |
| `landing_oraculo_society_forge` | Supabase Auth | Expected, acceptable |

### VERTICAL-SPECIFIC

| Artifact | Vertical | Coupling |
|---|---|---|
| `verticals/dental/*` | Dental (es-MX) | Intended — reference vertical |
| `knowledge-engine/src/schemas/*` | Dental | **LEAKAGE** — schemas reference dental-specific entities (appointment, patient, procedure) in a supposedly generic engine |
| `knowledge-engine/src/loaders/*` | Dental path convention | **LEAKAGE** — `verticals/{vertical}/knowledge/*.json` is a convention, not enforced in contracts |

---

## 5. Architectural Boundaries

### Well-Defined Boundaries ✅

| Boundary | Between | Enforcement |
|---|---|---|
| **Governance ↔ Implementation** | OpenSpec specs ↔ Engine code | Invariant verification in tests |
| **Engine ↔ Provider** | Engine class ↔ Provider interface | TypeScript interfaces, InMemory as canonical |
| **Shared ↔ Engines** | `@curdeeclau/shared` ↔ Engine packages | workspace dependency |
| **Vertical ↔ Runtime** | `verticals/` config ↔ Engine runtime | manifest.json, Sarah runtime manifest |
| **App ↔ Engine** | `quiniela-2026` lib ↔ React UI | `lib/quiniela/` has zero React/browser imports |

### Leaky Boundaries ⚠️

| Boundary | Leak | Severity |
|---|---|---|
| **knowledge-engine ↔ dental vertical** | Schemas contain dental-specific entities (Patient, Procedure, Appointment) | **HIGH** — engine is not vertical-agnostic as claimed |
| **algorithmus-core-engine ↔ math engine** | Conversational FSM/LLM lives in a package named "core-engine" alongside math stubs | **HIGH** — documented mismatch in `docs/openspec/monorepo-alignment.md` |
| **quiniela-2026 lib ↔ packages/engines** | Full math engine (72 files) lives inside an app, not in `packages/` | **HIGH** — prevents reuse, violates monorepo contract |
| **workflows/blueprints ↔ providers** | n8n JSON hardcodes Google OAuth2, Chatwoot, Redis, Qdrant credentials | **MEDIUM** — blueprints are reference-only, but tight coupling to specific SaaS |
| **handoff-engine ↔ @curdeeclau/shared** | Handoff engine defines its own `HandoffDomainEvent` instead of using shared `DomainEvent` | **MEDIUM** — semantic duplication |
| **workflow-orchestrator ↔ @curdeeclau/shared** | Orchestrator defines its own event types instead of using `@curdeeclau/shared` | **MEDIUM** — semantic duplication |

---

## 6. Duplications Identified

### Type Duplications

| Concept | Defined In | Should Be |
|---|---|---|
| `DomainEvent` | `shared/`, `handoff-engine/`, `workflow-orchestrator/` | `@curdeeclau/shared` only |
| `Ownership` / `ConversationOwner` | `shared/`, `handoff-engine/`, `crm-engine/`, `calendar-engine/` | `@curdeeclau/shared` (already there, others should import) |
| `ExecutionContext` / `WorkflowContext` | `shared/`, `workflow-orchestrator/`, `handoff-engine/` | `@curdeeclau/shared` only |
| `Engine` interface | `workflow-orchestrator/`, each engine's `types.ts` | `@curdeeclau/shared` canonical contract |

### Code Duplications

| Pattern | Locations | Risk |
|---|---|---|
| Forge CLAUDE.md | `packages/algorithmus/forge/`, `apps/landing_oraculo_society_forge/` | **IDENTICAL COPIES** — drift risk |
| InMemory providers | Every engine has its own InMemory*Provider | Acceptable pattern, but no shared InMemory base |
| FSM definitions | `algorithmus-core-engine`, `verticals/dental/states/` | Different formats (TypeScript vs JSON), same concept |
| Event emitters | `CalendarEventEmitter`, `CRMEventEmitter`, `EventDispatcher` (orchestrator) | Each engine has its own — no shared event bus |

### Structural Duplications

| Pattern | Locations |
|---|---|
| Feature-first folder structure | `landing_oraculo_society_forge`, `packages/algorithmus/forge` |
| tsconfig ES2022 + strict + declarations | All 7 engine packages (identical JSON) |
| Barrel export pattern | Every package has `src/index.ts` |

---

## 7. Implicit Contracts (Undocumented)

| Contract | Implied By | Risk |
|---|---|---|
| Engine `execute(action, context)` signature | All engines + workflow-orchestrator | No formal interface in shared package |
| `verticals/{name}/knowledge/*.json` path convention | `knowledge-engine` loaders | No JSON Schema for the convention itself |
| `verticals/{name}/manifest.json` structure | `verticals/dental/` as reference | No formal spec for manifest shape |
| Agent naming convention (ATLAS, ORACULO, HERMES, IRIS) | `quiniela-2026` agents | No governance doc, only app code |
| FSM state machine shape | `algorithmus-core-engine` + `verticals/dental/states/` | Two different formats, no canonical schema |

---

## 8. Missing Contracts (Should Exist)

| Missing Contract | Why Needed |
|---|---|
| **`IEngine` canonical interface** | 7 engines, multiple definitions — needs single source of truth in `@curdeeclau/shared` |
| **Engine Registry contract** | `workflow-orchestrator` defines registry, but no formal spec |
| **Vertical manifest schema** | Only `dental/` exists — no JSON Schema to validate future verticals |
| **Workflow blueprint schema** | 39 n8n JSON files with no structural validation |
| **Event catalog** | Events spread across engines with no central registry |
| **Agent contract** | Agent types (ATLAS/ORACULO/HERMES/IRIS) in quiniela only — no shared types |
| **Channel abstraction** | WhatsApp, Telegram, Web — each defined ad-hoc |
| **Math engine contract** | Python solver has no TypeScript contract — implicit HTTP API |

---

## 9. Provider Leakage Analysis

### Direct Provider Couplings

```
algorithmus-core-engine:
  ├── YCloud (WhatsApp) — ycloudClient, ycloudSender, ycloudWebhookParser
  ├── OpenAI — OpenAIModerationClient (safety path)
  ├── Pinecone — client, RAG adapter
  ├── Supabase — supabase_client.ts (legacy)
  ├── PostgreSQL — pg pool + LeadsRepository
  ├── Redis — client, locking, idempotency
  ├── BullMQ — queue client, worker
  ├── Sentry — error tracking
  └── Prometheus — metrics

knowledge-engine:
  └── Pinecone — @pinecone-database/pinecone (hard dependency in package.json)

quiniela-2026:
  └── Telegram — template system (injectable, good pattern)

workflows/blueprints/:
  ├── Google (Calendar, Sheets, Gmail, Drive) — 20+ blueprints
  ├── Chatwoot — 10+ blueprints
  ├── Redis — buffer pattern
  ├── Qdrant — RAG pattern
  ├── OpenAI — LLM, embeddings, transcription
  ├── Gemini — LLM via Google/OpenRouter
  ├── VAPI — voice
  ├── Mercado Pago — payments
  ├── Bright Data — scraping
  ├── n8n — execution runtime
  ├── Postgres — chat memory
  └── SMTP — email
```

### Leakage Severity Map

| Provider | Severity | Reason |
|---|---|---|
| YCloud (WhatsApp) | **HIGH** | Hardcoded in core orchestrator flow |
| Pinecone | **HIGH** | Hard dependency in package.json, no abstraction |
| OpenAI Moderation | **MEDIUM** | Behind SafetyPort interface, but only implementation |
| Supabase (legacy) | **MEDIUM** | ADR-006 migrating away, ambiguity remains |
| Google Suite | **MEDIUM** | Only in n8n blueprints (reference), not engine code |
| Chatwoot | **MEDIUM** | Only in n8n blueprints, not engine code |

---

## 10. Vertical Leakage Analysis

| Leak | Location | Description |
|---|---|---|
| **Dental schemas in knowledge-engine** | `packages/knowledge-engine/src/schemas/` | `PatientSchema`, `AppointmentSchema`, `ProcedureSchema` are dental-specific |
| **Dental path convention** | `packages/knowledge-engine/src/loaders/` | `verticals/{vertical}/knowledge/*.json` hardcoded, only dental implements it |
| **es-MX locale** | `verticals/dental/`, `apps/dental-ai-receptionist/`, `apps/quiniela-2026/` | Spanish-Mexico is the only locale — acceptable for MVP but not multitenant |
| **MXN currency** | `verticals/dental/config/vertical.json` | Hardcoded, no multi-currency support |

---

## 11. Ownership Semantics Map

```
┌──────────────────────────────────────────────────────────────┐
│                    OWNERSHIP RUNTIME                          │
│                                                               │
│  @curdeeclau/shared defines:                                  │
│    ConversationOwner = 'AI' | 'HUMAN' | 'SHARED' | 'LOCKED'  │
│    isTransferAllowed(from, to): boolean                       │
│                                                               │
│  Engines consuming ownership:                                 │
│    ✅ crm-engine — OwnershipGuard per action                  │
│    ✅ calendar-engine — OwnershipGuard per action             │
│    ✅ handoff-engine — OwnershipManager (state machine)       │
│    ❌ workflow-orchestrator — no ownership awareness          │
│    ❌ message-buffer-engine — no ownership awareness          │
│    ❌ knowledge-engine — no ownership awareness               │
│    ❌ ghl-engine — types only                                 │
│    ❌ media-delivery-engine — types only                      │
│                                                               │
│  Ownership Transitions (from openspec):                       │
│    AI → HUMAN (handoff request)                               │
│    AI → LOCKED (incident)                                     │
│    HUMAN → AI (recovery complete)                             │
│    HUMAN → SHARED (collaboration)                             │
│    SHARED → AI (human leaves)                                 │
│    LOCKED → AI (admin override)                               │
│                                                               │
│  Only handoff-engine can modify ownership.                    │
│  LOCKED blocks ALL engine writes.                             │
└──────────────────────────────────────────────────────────────┘
```

---

## 12. Event Lifecycle Map

```
┌──────────────────────────────────────────────────────────────┐
│                    EVENT LIFECYCLE                            │
│                                                               │
│  Canonical shape (@curdeeclau/shared):                        │
│    {                                                          │
│      id: "evt_...",         // ULID/UUIDv7                    │
│      type: "PascalCase",    // e.g., "ContactCreated"        │
│      timestamp: ISO8601,                                     │
│      tenantId: "ten_...",                                    │
│      conversationId: "conv_...",                             │
│      workflowId: "wfl_...",                                  │
│      correlationId: "corr_...",  // groups events in flow    │
│      causationId: "evt_...",     // parent event             │
│      actorId: "usr_...",                                      │
│      verticalId: "ver_...",                                  │
│      payload: { ... },                                        │
│      metadata: { ... }                                       │
│    }                                                          │
│                                                               │
│  Engines emitting events:                                    │
│    ✅ crm-engine — CRMEventEmitter, 7 event types             │
│    ✅ calendar-engine — CalendarEventEmitter, 9 event types   │
│    ✅ handoff-engine — HandoffEvents, 8 event types           │
│    ✅ workflow-orchestrator — EventDispatcher (wildcard)      │
│    ❌ message-buffer-engine — no event emission               │
│    ❌ knowledge-engine — no event emission                    │
│                                                               │
│  Event chaining model (DAG):                                  │
│    causationId creates event parent chain                     │
│    correlationId groups events in same flow                   │
│                                                               │
│  GAP: No central event bus across engines.                    │
│  Each engine has its own emitter.                             │
│  workflow-orchestrator EventDispatcher does not                │
│  connect to engine-level emitters.                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 13. Orchestration Layers

### Layer A: Engine-level orchestration (deterministic)

```
workflow-orchestrator:
  └── WorkflowDefinition → WorkflowStep[] → Engine.execute(action)
      └── StateResolver → validates transition
      └── WorkflowExecutor → sequential step execution
      └── EventDispatcher → emits workflow events
```

### Layer B: Conversational orchestration (AI + deterministic)

```
algorithmus-core-engine Orchestrator:
  └── FSM.evaluate() → route to action
      ├── classify_intent → LLM → Validation → Decision → HardGate
      ├── extract_slots → LLM → Validation → Decision → HardGate
      ├── query_rag → Pinecone → LLM → Validation → Decision → HardGate
      ├── reply → LLM → Validation → Decision → HardGate
      ├── book_appointment → deterministic
      └── handover_human → deterministic
  
  Validation Pipeline:
    AIValidator → DecisionMatrix → FSMTransitionCheck → HardGate
```

### Layer C: Product orchestration (quiniela-specific)

```
quiniela-2026 orchestrator:
  └── 6-phase product loop:
      analysis → purchase → unlock_private11 → compete
      → telegram_update → return_next_matchday
```

### Orchestration Gaps

| Gap | Description |
|---|---|
| **No cross-engine orchestration** | `workflow-orchestrator` can sequence engines but no workflow definition connects CRM ↔ Calendar ↔ Handoff yet |
| **algorithmus ↔ quiniela disconnect** | Production conversational runtime (algorithmus) has no path to math engine runtime (quiniela lib) |
| **n8n ↔ engine disconnect** | 39 workflow blueprints in n8n format, zero in engine format — two parallel execution worlds |

---

## 14. Runtime Dependency Health

### Healthy Dependencies ✅

| Dependency | Reason |
|---|---|
| `crm-engine` → `@curdeeclau/shared` | Properly consumes canonical contracts |
| `calendar-engine` → `@curdeeclau/shared` | Properly consumes canonical contracts |
| Engines → InMemory providers | Correct Phase 1 pattern per OpenSpec |
| `quiniela-2026` lib/ → React UI | Clean separation, no browser APIs in lib |

### Unhealthy Dependencies ⚠️

| Dependency | Issue |
|---|---|
| `knowledge-engine` → Pinecone (hard) | No abstraction layer, direct SDK dependency |
| `handoff-engine` → (none) | Should consume `@curdeeclau/shared` for DomainEvent |
| `workflow-orchestrator` → (none) | Should consume `@curdeeclau/shared` for Engine interface |
| `message-buffer-engine` → (none) | Should consume `@curdeeclau/shared` for ConversationContext |
| `algorithmus-core-engine` → 8 providers | Too many hard provider dependencies in single package |

---

## 15. Semantic Risks

| Risk | Probability | Impact |
|---|---|---|
| **Type drift between shared and engines** | MEDIUM | engines redefine types already in shared |
| **Provider lock-in (YCloud + Pinecone)** | HIGH | core orchestrator depends on specific providers |
| **Knowledge engine vertical coupling** | MEDIUM | dental schemas prevent reuse for other verticals |
| **Math engine trapped in app** | HIGH | 72 files of math logic not reusable outside quiniela |
| **n8n divergence** | MEDIUM | Blueprint workflows may never be migrated to engine format |
| **Forge CLAUDE.md fork** | LOW | Two identical copies in monorepo, drift over time |
| **Dual persistence (Supabase + PostgreSQL)** | MEDIUM | ADR-006 migrates away but legacy path remains |
| **No shared event bus** | HIGH | Each engine emits events in isolation, no cross-engine observability |

---

## 16. Governance Gaps

| Gap | Description |
|---|---|
| **No Engine interface contract in shared** | Each engine and the orchestrator define `Engine` separately |
| **No vertical manifest schema** | Only `dental/` exists, no JSON Schema to validate manifests |
| **No workflow definition schema** | 39 blueprints in n8n format, 0 validated against a canonical schema |
| **No agent taxonomy** | Agents (ATLAS, ORACULO, HERMES, IRIS, Azul, Sarah) have no formal classification |
| **No channel abstraction contract** | WhatsApp, Telegram, Web, Voice — each ad-hoc |
| **No central event catalog** | Events spread across engines with no registry |
| **No math engine contract** | Python solver has no TypeScript client contract |

---

## 17. Recommendations

### Immediate (this week)

1. **Add `IEngine` canonical interface to `@curdeeclau/shared`** — single source of truth consumed by all engines and orchestrator
2. **Wire `handoff-engine` and `workflow-orchestrator` to consume `@curdeeclau/shared`** — eliminate duplicate DomainEvent/Ownership types
3. **Extract dental schemas from `knowledge-engine`** — move to `verticals/dental/schemas/` where they belong

### Short-term (2-4 weeks)

4. **Extract `quiniela-2026/src/lib/quiniela/` to `packages/math-engine-ts/`** — per `docs/openspec/monorepo-alignment.md`
5. **Create vertical manifest JSON Schema** — before any second vertical is created
6. **Create central event catalog** — document all DomainEvent types across engines
7. **Resolve Supabase/PostgreSQL dual path** — complete ADR-006 migration, remove Supabase client

### Medium-term (1-3 months)

8. **Build cross-engine orchestration** — wire CRM ↔ Calendar ↔ Handoff via workflow-orchestrator
9. **Create Pinecone provider abstraction** — decouple `knowledge-engine` and `algorithmus-core-engine` from Pinecone SDK
10. **Migrate n8n blueprints to engine workflows** — convert reference blueprints to `workflow-orchestrator` definitions
11. **Merge or de-duplicate Forge CL AUDE.md** — single source of truth for Forge methodology

---

## 18. Summary Metrics

| Metric | Value |
|---|---|
| Total packages | 16 (across all layers) |
| Total source files | ~250 (TypeScript) + 3 (Python) |
| Engines with full implementation | 5 of 7 |
| Engines consuming shared contracts | 2 of 7 |
| Engines with formal OpenSpec | 3 of 7 |
| Apps in production | 1 of 5 |
| Verticals defined | 1 |
| Workflow blueprints | 39 |
| Extracted patterns | 13 |
| OpenSpec documents | 24 |
| ADRs | 6 |
| Provider-specific couplings | 12+ |
| Identified duplications | 8 |
| Missing contracts | 7 |
| Governance gaps | 7 |
| Architecture mismatches | 1 critical (algorithmus-core-engine) |
