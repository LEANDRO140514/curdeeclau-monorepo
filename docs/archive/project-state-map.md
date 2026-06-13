# Project State Map — RT-1.5

> **Purpose:** Orientation. What each folder IS, not what it should become.
> **Status:** Semantic freeze in progress. No refactors, no renames, no migrations.

---

## 1. Original Vertical Target

### `apps/dental-ai-receptionist/`

**What it is:** Next.js 16 frontend for the dental AI receptionist. Thin app — mainly UI. Depends on `@curdeeclau/knowledge-engine`.

**Domain:** Dental clinics. Spanish (es-MX). WhatsApp-based patient attention.

**Original goal:** AI receptionist that handles FAQ, appointment scheduling, emergency triage, and treatment inquiries via WhatsApp.

**Status:** Target vertical. Active development.

---

## 2. What `algorithmus-platform` Currently Represents

### `packages/algorithmus/algorithmus-platform/`

**What it is:** The runtime EXECUTION SERVER. An Express app that:

- Wires together the runtime components (FSM engine, LLM gateway, RAG service, validation layer)
- Exposes WhatsApp webhook routes (`src/routes/whatsapp.webhook.ts`)
- Contains the attention module (`src/attention/`) — core-adapter, output dispatcher, WhatsApp integration
- Creates the `PlatformOrchestrator` by composing core-engine components

**NOT:** A library, a framework, or a platform SDK.

**Transitional status:** This is the OLD monolith runtime server. It directly imports from `algorithmus-core-engine` via `@core/*` path aliases. The NEW architecture (`packages/engines/workflow-orchestrator`) will eventually replace its orchestration logic, but the webhook routes and attention module are vertical-specific and will remain.

**DO NOT:** Refactor, rename, or decompose this folder yet.

---

## 3. What `algorithmus-core-engine` Currently Represents

### `packages/algorithmus/algorithmus-core-engine/`

**What it is:** The ORIGINAL monolith runtime library. Contains:

| Module | Path | What It Does |
|---|---|---|
| **Orchestrator** | `src/core/orchestrator/` | Central coordinator — wires FSM + LLM + RAG + validation |
| **FSM Engine** | `src/core/fsm/` | Finite state machine for conversation routing |
| **LLM Gateway** | `src/core/llm/` | LLM abstraction for classification and enrichment |
| **RAG Service** | `src/core/rag/` | Knowledge retrieval (Pinecone) |
| **Validation Layer** | `src/core/validation/` | AI output validation with hard gates |
| **Ingestion** | `src/core/ingestion/` | Message ingestion pipeline |
| **Channels** | `src/core/channels/` | Communication channel abstractions |
| **Identity** | `src/core/identity/` | User/lead identity resolution |
| **Observability** | `src/core/observability/` | Logging, metrics, tracing |
| **Workers** | `src/workers/whatsappWorker.ts` | Background job processing (BullMQ + Redis) |
| **Infra** | `src/infra/` | PostgreSQL (LeadsRepository), Supabase client |
| **App** | `src/app/` | Express server composition, routes, API |

**⚠️ The package.json description is STALE.** It says "Deterministic sports mathematical engine — reductions, matrices, probabilities" but the actual source code is a **dental AI receptionist runtime with WhatsApp integration**. The description likely dates from before the dental vertical existed. Do not trust the package.json label.

**Transitional status:** This is the OLD architecture — a monolithic runtime where FSM + LLM + RAG + validation are tightly coupled. The NEW architecture in `packages/engines/` decomposes these concerns into separate engines (workflow-orchestrator, handoff-engine, crm-engine, etc.) governed by OpenSpec.

**DO NOT:** Refactor, rename, or decompose this folder yet. It is the working reference implementation. The engines in `packages/engines/` are being extracted FROM this monolith, not replacing it yet.

---

## 4. Transitional Names

These folders/packages are **transitional** — their names and locations will likely change during monorepo normalization:

| Folder | Current Name | Why Transitional |
|---|---|---|
| `packages/algorithmus/algorithmus-core-engine/` | `@curdeeclau/algorithmus-core-engine` | Package.json description is wrong; name reflects old scope before dental vertical existed |
| `packages/algorithmus/algorithmus-platform/` | `@curdeeclau/algorithmus-platform` | Contains the runtime server; may be renamed to reflect its role (e.g., `dental-runtime-server`) |
| `packages/algorithmus/forge/` | Forge Free (Next.js app) | Forge scaffolding tool — separate from dental runtime |

**Algorithmus** was the original project name before the vertical concept existed. It may persist as the platform brand or be renamed.

---

## 5. Runtime Layer

Everything that executes at runtime to process conversations:

| Component | Location | Role |
|---|---|---|
| **Orchestrator** | `algorithmus-core-engine/src/core/orchestrator/` | Central coordinator (monolith) |
| **FSM Engine** | `algorithmus-core-engine/src/core/fsm/` | Conversation state machine (monolith) |
| **LLM Gateway** | `algorithmus-core-engine/src/core/llm/` | AI model abstraction (monolith) |
| **RAG Service** | `algorithmus-core-engine/src/core/rag/` | Vector search retrieval (monolith) |
| **Validation** | `algorithmus-core-engine/src/core/validation/` | AI output hard gates (monolith) |
| **Ingestion** | `algorithmus-core-engine/src/core/ingestion/` | Message pipeline (monolith) |
| **Workflow Orchestrator** | `packages/engines/workflow-orchestrator/` | NEW: canonical orchestration engine |
| **Handoff Engine** | `packages/engines/handoff-engine/` | NEW: ownership + suppression + recovery |

The monolith runtime is the **working reference**. The `packages/engines/` runtime is the **target architecture**. Both coexist during RT-1.x.

---

## 6. Engine Layer

### New Architecture Engines (`packages/engines/`)

| Engine | Status | Has OpenSpec? | Imports from shared? |
|---|---|---|---|
| `workflow-orchestrator` | Implemented (not yet wired to runtime) | No | No — redefines types locally |
| `handoff-engine` | Implemented (not yet wired to runtime) | No | Partially — defines own event types |
| `crm-engine` | Implemented | No | Yes — imports from `@curdeeclau/shared` |
| `calendar-engine` | Implemented | Yes (`openspec/changes/create-calendar-engine/`) | Has shared/ in node_modules |
| `ghl-engine` | Stub (types only) | Yes (`openspec/changes/create-ghl-engine/`) | No |
| `message-buffer-engine` | Implemented | No | No |
| `media-delivery-engine` | Stub (types only) | No | No |

### Knowledge Engine (`packages/knowledge-engine/`)

Standalone RAG engine. Pinecone-based. Used by `dental-ai-receptionist` via `@curdeeclau/knowledge-engine`. Has its own schemas for dental domain (appointment, FAQ, patient, procedure, knowledge chunks).

### Math Engine (`packages/math-engine/`)

Python package (FastAPI + OR-Tools CP-SAT). **NOT part of the dental runtime.** Used by quiniela apps for covering design optimization. Outside pnpm workspace. Zero integration with `shared/` or governance.

---

## 7. Vertical Layer

### `verticals/dental/`

**What it is:** DECLARATIVE domain configuration for the dental vertical. NOT code — it's data that the runtime loads and executes.

| Subfolder | Content | Format |
|---|---|---|
| `knowledge/` | FAQ, procedures, terminology, policies, emergency protocols, insurance, pricing | JSON |
| `schemas/` | Domain entity schemas (appointment, patient, FAQ, procedure) | JSON Schema |
| `prompts/` | System prompt, personality config, escalation rules | TXT + JSON |
| `policies/` | Handoff policy, calendar policy, media policy | JSON |
| `states/` | Sarah state machine (12 states, 24 transitions) | JSON |
| `tools/` | Tool definitions (check availability, schedule, cancel, search, escalate) | JSON |
| `workflows/` | Workflow definitions (new patient, emergency triage, scheduling, treatment inquiry) | JSON |
| `config/` | Vertical configuration | JSON |

**Sarah** is the name of the dental AI receptionist persona.

**Status:** Domain is fully specified declaratively. Most components are marked `"status": "planned"` at `"phase": 3` — meaning the configuration exists but the runtime hasn't been validated against it yet.

---

## 8. Provider Layer

Providers are external integrations. Currently minimal:

| Provider | Location | Role |
|---|---|---|
| **WhatsApp** | `algorithmus-platform/src/attention/whatsapp/` + `algorithmus-platform/src/routes/whatsapp.webhook.ts` | Inbound/outbound message channel |
| **GHL (GoHighLevel)** | `packages/engines/ghl-engine/` (stub types) + `packages/engines/crm-engine/src/providers/ghl/` (placeholder) | CRM provider — NOT implemented |
| **Pinecone** | `packages/knowledge-engine/` + `algorithmus-core-engine/src/core/rag/` | Vector database for RAG |
| **Supabase** | `algorithmus-core-engine/src/core/supabase_client.ts` | Auth + database |
| **PostgreSQL** | `algorithmus-core-engine/src/infra/postgres/` | Leads repository (direct pg) |

**Provider maturity:** WhatsApp is the only fully implemented channel. GHL CRM is a stub. Pinecone and Supabase are infrastructure dependencies of the monolith runtime.

---

## 9. Workflow / Pattern Layer

### `workflows/blueprints/` (15 domains)

Original n8n workflow definitions — the raw source material. Each blueprint folder contains JSON workflow definitions exported from n8n.

### `workflows/extracted-patterns/` (15 patterns)

Architectural patterns extracted FROM the blueprints. Each `.md` file describes:
- The problem the workflow solves
- The solution pattern
- States and transitions
- Inputs and outputs

**Extraction chain:**
```
n8n workflow JSON (blueprints/)
  → Extracted pattern .md (extracted-patterns/)
    → Engine design (packages/engines/)
      → OpenSpec formal spec (openspec/changes/)
```

**Status:** All 15 blueprints have corresponding extracted patterns. Engine extraction has begun for calendar, CRM, GHL, and knowledge domains.

---

## 10. What Should NOT Be Touched Yet

### Frozen — semantic freeze active

| Zone | Reason |
|---|---|
| `openspec/governance/` | Constitution just enacted. Stabilizing. |
| `packages/shared/src/` | Canonical contracts under constitutional protection (Appendix A). |
| `verticals/dental/` | Domain config is complete for RT-1.x. No schema changes without dental domain expertise. |

### Do Not Touch — transitional

| Zone | Reason |
|---|---|
| `packages/algorithmus/algorithmus-core-engine/` | Working monolith. Reference implementation. Will be decomposed into `packages/engines/` but NOT during RT-1.x. |
| `packages/algorithmus/algorithmus-platform/` | Working runtime server. WhatsApp webhook is live path. Do not break. |
| `packages/algorithmus/forge/` | Forge scaffolding tool. Separate concern. |

### Orthogonal — not dental runtime

| Zone | Relationship to Dental Runtime |
|---|---|
| `apps/quiniela-2026_deepclaude/` | Sports betting app. Unrelated domain. Coexists in monorepo. |
| `apps/reducidas-2026/` | Sports betting app. Unrelated. |
| `apps/survivor-world-cup/` | Sports betting app. Unrelated. |
| `packages/math-engine/` | Python covering design solver. Unrelated. |
| `apps/landing_oraculo_society_forge/` | Landing page. Separate concern. |

These apps are NOT governed by the Algorithmus runtime constitution. They predate governance and have their own architecture. They do not import from `shared/` and are not subject to OpenSpec.

### Target architecture — not yet wired

| Zone | Reason |
|---|---|
| `packages/engines/workflow-orchestrator/` | New orchestrator defined. NOT connected to the running `algorithmus-platform` server. |
| `packages/engines/handoff-engine/` | Ownership + suppression engine defined. NOT connected. |
| `packages/engines/crm-engine/` | CRM engine with provider interface. NOT connected to GHL. |
| `packages/engines/calendar-engine/` | Calendar engine spec exists. Implementation exists. NOT connected. |
| `packages/engines/ghl-engine/` | GHL types stub. No adapter implementation. |
| `packages/engines/message-buffer-engine/` | Message buffering. NOT connected to WhatsApp ingestion. |
| `packages/engines/media-delivery-engine/` | Types stub only. |

---

## Summary — What's Connected vs What's Declared

```
CONNECTED (working today):
  WhatsApp → algorithmus-platform → algorithmus-core-engine
    ├── FSM Engine (conversation states)
    ├── LLM Gateway (classification + responses)
    ├── RAG Service (Pinecone knowledge retrieval)
    ├── Validation Layer (AI output gating)
    ├── LeadsRepository (PostgreSQL)
    └── WhatsApp Worker (BullMQ + Redis)

DECLARED (target architecture, not yet connected):
  WhatsApp → workflow-orchestrator
    ├── handoff-engine (ownership + suppression)
    ├── crm-engine + CRMProvider → GHL adapter
    ├── calendar-engine + CalendarProvider
    ├── message-buffer-engine
    ├── knowledge-engine (RAG)
    └── media-delivery-engine
      governed by: OpenSpec + shared/ contracts + rt-constitution
```

The monolith runs today. The governed engines are the destination. RT-1.x is the transition window where both coexist and the constitution holds them accountable.
