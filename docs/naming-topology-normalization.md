---
ESTADO: SUPERSEDIDO COMO AUTORIDAD ACTIVA
Fecha: 2026-06-11
Supersedido por: .claude/memory/institutional/constitucion.md
Motivo: Pekín Foundation establece la autoridad constitucional activa de CURDEECLAU. Este documento declara "constitutionally protected" nombres que son convenciones de Nivel 2 (Governance), no Nivel 1 (Constitution). Su contenido técnico de normalización semántica y topología permanece válido como propuesta de diseño.
Uso permitido: consulta histórica, propuesta técnica de normalización semántica, referencia para futura evaluación por El Senado.
Uso prohibido: citar protecciones "constitucionales" sobre nombres. El naming es Nivel 2 (Governance) bajo Pekín.
---

# Runtime Naming & Topology Normalization Plan

> **Phase:** Pre-RT-2 semantic normalization.
> **Status:** Design document. Zero physical changes authorized.
> **Authority:** Derived from RT-1.5 Constitution.

---

## 0. Normalization Principles

1. **Capability over origin.** Names describe what a component DOES, not where it came from.
2. **Provider names are leaf labels, not engine names.** "GHL" is an adapter, not an engine capability.
3. **"Algorithmus" is a transitional brand.** It predates the vertical concept. It should not appear in canonical package names.
4. **Layers are exclusive.** An engine is not a provider. A provider is not a vertical. A vertical is not a runtime.
5. **Stable names survive decomposition.** A component being extracted from a monolith keeps the same canonical name before and after extraction.

---

## 1. `algorithmus-platform`

| Field | Value |
|---|---|
| **Current name** | `@curdeeclau/algorithmus-platform` |
| **Current location** | `packages/algorithmus/algorithmus-platform/` |
| **Actual responsibility** | Express HTTP server. Entry point for WhatsApp webhook traffic. Composes FSM + LLM + RAG + validation into a PlatformOrchestrator. Exposes attention module for output dispatch. |
| **Why incorrect** | "Platform" implies a framework or SDK. It is a **runtime server** — a deployable application, not a platform. "Algorithmus" is a historical project name that predates the dental vertical. |
| **Semantic category** | Application server (deployable entry point) |
| **Canonical name** | `dental-runtime` |
| **Canonical location** | `apps/dental-runtime/` |
| **Runtime layer** | Application Layer — the HTTP entry point for the dental vertical runtime |
| **Classification** | **Transitional — decomposing.** Not a permanent package. Its responsibilities will split: WhatsApp webhook → channel provider; orchestrator composition → workflow-orchestrator init; Express server → thin app entry point. |
| **Migration** | **Frozen.** Do not rename, move, or restructure. Extract FROM it; do not modify it. The canonical name and location are TARGET STATE after decomposition completes. |

---

## 2. `algorithmus-core-engine`

| Field | Value |
|---|---|
| **Current name** | `@curdeeclau/algorithmus-core-engine` |
| **Current location** | `packages/algorithmus/algorithmus-core-engine/` |
| **Actual responsibility** | Monolithic runtime library containing: FSM engine, LLM gateway, RAG service (Pinecone), AI validation layer (validator + decision matrix + hard gates), message ingestion pipeline, channel abstractions, identity resolution, observability (Pino + Prometheus), WhatsApp worker (BullMQ + Redis), PostgreSQL leads repository, Supabase client. |
| **Why incorrect** | Package.json description: "Deterministic sports mathematical engine — reductions, matrices, probabilities, validators, scoring, contest logic, optimization." The description describes a quiniela math engine. The actual source code is a **dental AI receptionist runtime**. Name is factually wrong in two dimensions: it's not about sports math, and "core-engine" is vacuous — every engine is "core" to something. "Algorithmus" is transitional. |
| **Semantic category** | Monolithic runtime library (being decomposed) |
| **Canonical future** | **No single canonical replacement.** This package decomposes into: |
| | → `packages/engines/workflow-orchestrator/` (FSM + orchestration) |
| | → `packages/engines/handoff-engine/` (ownership + suppression + recovery) |
| | → `packages/providers/channel-whatsapp/` (WhatsApp webhook + worker) |
| | → `packages/providers/pinecone-knowledge/` (RAG vector search) |
| | → `packages/engines/knowledge-engine/` (RAG orchestration — already extracted) |
| | → `packages/shared/` (canonical types that emerge from extraction) |
| **Classification** | **Transitional — decomposing to extinction.** This package will not exist in the canonical topology. |
| **Migration** | **Frozen.** Do not rename, move, refactor, or "clean up." It is the reference implementation. Extract engines from it; let it shrink. When empty, archive and remove. |

---

## 3. `packages/engines/` — Individual Engine Audit

### 3.1 `workflow-orchestrator`

| Field | Value |
|---|---|
| **Current** | `packages/engines/workflow-orchestrator/` |
| **Name correctness** | **CORRECT.** It orchestrates workflows. |
| **Classification** | **Authoritative — target state.** |
| **Location correctness** | **CORRECT.** `packages/engines/` is the engine layer. |
| **Migration** | **None.** Name and location are canonical. |

### 3.2 `handoff-engine`

| Field | Value |
|---|---|
| **Current** | `packages/engines/handoff-engine/` |
| **Name correctness** | **CORRECT.** It manages handoffs between AI and human. |
| **Classification** | **Authoritative — target state.** |
| **Location correctness** | **CORRECT.** |
| **Migration** | **None.** |

### 3.3 `crm-engine`

| Field | Value |
|---|---|
| **Current** | `packages/engines/crm-engine/` |
| **Name correctness** | **CORRECT.** CRM entity management (contacts, opportunities, pipelines, campaigns, tags). |
| **Classification** | **Authoritative — target state.** |
| **Location correctness** | **CORRECT.** |
| **Migration** | **None.** |

### 3.4 `calendar-engine`

| Field | Value |
|---|---|
| **Current** | `packages/engines/calendar-engine/` |
| **Name correctness** | **CORRECT.** Temporal resource coordination (availability, reservations, time slots, reminders). |
| **Classification** | **Authoritative — target state.** |
| **Location correctness** | **CORRECT.** |
| **Migration** | **None.** |

### 3.5 `ghl-engine`

| Field | Value |
|---|---|
| **Current** | `packages/engines/ghl-engine/` |
| **Name correctness** | **INCORRECT — fundamental category error.** The name describes a PROVIDER (GoHighLevel), not a CAPABILITY. This package defines `GHLContact`, `GHLOpportunity`, `GHLWebhookEvent` — raw GHL API shapes. It is NOT an engine. It is a provider type stub. |
| **Actual responsibility** | GHL API type definitions. No engine logic. No provider interface implementation. |
| **Why incorrect** | The constitution states: "Provider names are leaf labels, not engine names." An engine named after a provider violates Article IV.3 (Provider Isolation) and Article VIII.2 (Adapter Pattern). GHL is a CRM provider — it should implement `CRMProvider`, not be a standalone package. |
| **Canonical future** | **Absorbed into `packages/providers/ghl-crm/`** as a provider adapter implementing the `CRMProvider` interface from `crm-engine`. |
| **Classification** | **Deprecated — to be absorbed.** NOT an engine. |
| **Migration** | **Delayed.** Absorb during RT-2 provider normalization. Do not touch until `CRMProvider` interface is finalized in shared/. |

### 3.6 `message-buffer-engine`

| Field | Value |
|---|---|
| **Current** | `packages/engines/message-buffer-engine/` |
| **Name correctness** | **CORRECT.** Conversation-oriented message buffering with dedup, debounce, and batching. |
| **Classification** | **Authoritative — target state.** (Requires Engine contract + DomainEvent integration per enforcement assessment V-C3.) |
| **Location correctness** | **CORRECT.** |
| **Migration** | **None.** |

### 3.7 `media-delivery-engine`

| Field | Value |
|---|---|
| **Current** | `packages/engines/media-delivery-engine/` |
| **Name correctness** | **CORRECT.** Media delivery coordination. |
| **Classification** | **Authoritative — target state.** (Currently stub — types only.) |
| **Location correctness** | **CORRECT.** |
| **Migration** | **None.** |

---

## 4. `packages/knowledge-engine/`

| Field | Value |
|---|---|
| **Current name** | `@curdeeclau/knowledge-engine` |
| **Current location** | `packages/knowledge-engine/` (workspace root, NOT inside `packages/engines/`) |
| **Actual responsibility** | RAG engine — Pinecone-based knowledge retrieval with dental domain schemas (FAQ, procedures, appointments, patients). Chunking, embedding, retrieval. |
| **Why location is wrong** | It IS an engine — it belongs in `packages/engines/` with the other engines. It currently sits at the workspace root level alongside `packages/shared/` and `packages/engines/`, making it structurally ambiguous: is it a peer of ALL engines or one OF the engines? |
| **Canonical location** | `packages/engines/knowledge-engine/` |
| **Classification** | **Authoritative — requires relocation.** |
| **Migration** | **Delayed.** Relocate to `packages/engines/knowledge-engine/` during RT-2 normalization. Update `dental-ai-receptionist` import path. |

---

## 5. `packages/math-engine/`

| Field | Value |
|---|---|
| **Current** | `packages/math-engine/` |
| **Actual responsibility** | Python FastAPI server wrapping OR-Tools CP-SAT solver for quiniela covering designs. |
| **Domain** | Sports betting mathematics. Unrelated to dental AI runtime. |
| **Why it's here** | Coexists in monorepo by historical accident. Not subject to Algorithmus governance. |
| **Classification** | **Orthogonal — external domain.** Not in the runtime topology. Not governed by the constitution. |
| **Migration** | **Frozen.** Do not touch. Not part of dental runtime normalization. If quiniela app consolidation occurs, this may move to its own repo. That decision is outside this plan's scope. |

---

## 6. `packages/shared/`

| Field | Value |
|---|---|
| **Current** | `packages/shared/` (`@curdeeclau/shared`) |
| **Name assessment** | "shared" is conventional in monorepos. It accurately describes the package's role: canonical contracts shared across all engines, providers, and verticals. |
| **Alternative considered** | `packages/contracts/` — more semantically precise. "Contracts" signals authority better than "shared." However, "shared" is the monorepo industry convention and carries lower cognitive overhead. |
| **Decision** | **Keep "shared."** The semantic precision gain of "contracts" doesn't justify the churn. The constitution's Appendix A already establishes this package's authority regardless of its name. |
| **Classification** | **Authoritative — permanent.** |
| **Location correctness** | **CORRECT.** `packages/shared/` is the standard monorepo location for canonical contracts. |
| **Migration** | **None.** |

---

## 7. `verticals/dental/`

| Field | Value |
|---|---|
| **Current** | `verticals/dental/` |
| **Name correctness** | **CORRECT.** It IS the dental vertical. |
| **Location correctness** | **CORRECT.** `verticals/` is the vertical layer. |
| **Internal naming** | The dental AI receptionist persona is named **Sarah**. This is reflected in `states/state-machine.json` (`sarah-dental-state-machine`) and `workflows/sarah-runtime.manifest.json`. The name "Sarah" should be preserved as the persona identifier within the dental vertical — it is NOT a package name. |
| **Classification** | **Authoritative — permanent.** |
| **Migration** | **None.** |

---

## 8. `workflows/` — Blueprints and Patterns

### 8.1 `workflows/blueprints/`

| Field | Value |
|---|---|
| **Current** | `workflows/blueprints/` (15 domain folders) |
| **Actual responsibility** | Original n8n workflow JSON exports. Raw source material for pattern extraction. |
| **Name correctness** | **CORRECT.** "Blueprints" accurately describes their role: original designs from which patterns were extracted. |
| **Classification** | **Reference artifact — historical record.** Not runtime. Not governance. These are the source documents of the extraction chain. |
| **Migration** | **Frozen.** Preserved as architectural provenance. Once all engines are extracted, they remain as documentation of extraction lineage. |

### 8.2 `workflows/extracted-patterns/`

| Field | Value |
|---|---|
| **Current** | `workflows/extracted-patterns/` (15 `.md` files) |
| **Why verbose** | "extracted-patterns" is redundant. They're in `workflows/` — the extraction context is implicit. |
| **Canonical name** | `patterns/` |
| **Canonical location** | `workflows/patterns/` |
| **Classification** | **Reference artifact — authoritative patterns.** These are the intermediate step between blueprints and engine specs. |
| **Migration** | **Delayed.** Rename to `workflows/patterns/` during RT-2 normalization. One-word names are stronger than compound names. |

---

## 9. `openspec/`

| Field | Value |
|---|---|
| **Current** | `openspec/` |
| **Name correctness** | **CORRECT.** It IS the OpenSpec governance layer. |
| **Sub-structure** | `governance/` — runtime semantics, ownership model, event model, orchestration model, engine governance, constitution. `conventions/` — naming, lifecycle, invariant conventions. `changes/` — engine specs (3 active, 0 archived). `templates/` — reusable spec templates. |
| **Classification** | **Authoritative — permanent.** Constitutional protection per Appendix A. |
| **Migration** | **None.** Structure is semantically correct. |

---

## 10. Provider Layer — Currently Scattered

### Current state

Providers have no canonical location. They exist in three scattered places:

| Provider | Current Location | Type |
|---|---|---|
| GHL types | `packages/engines/ghl-engine/src/types.ts` | Stub |
| GHL CRM placeholder | `packages/engines/crm-engine/src/providers/ghl/GHLProvider.placeholder.ts` | Placeholder |
| InMemory CRM | `packages/engines/crm-engine/src/providers/memory/InMemoryCRMProvider.ts` | Test provider |
| InMemory Calendar | `packages/engines/calendar-engine/src/providers/InMemoryCalendarProvider.ts` | Test provider |
| Google Calendar | `packages/engines/calendar-engine/src/providers/GoogleCalendarProvider.ts` | Stub |
| WhatsApp | `packages/algorithmus/algorithmus-platform/src/attention/whatsapp/` | Working (monolith) |
| Pinecone | `packages/algorithmus/algorithmus-core-engine/src/core/rag/` + `packages/knowledge-engine/` | Working (monolith + extracted) |
| Supabase | `packages/algorithmus/algorithmus-core-engine/src/core/supabase_client.ts` | Working (monolith) |

### Canonical provider topology

Providers are packages that implement an engine-defined interface. They belong in `packages/providers/`.

**Provider interface lives in the engine. Provider implementation lives in `packages/providers/`.**

```
packages/providers/
├── ghl-crm/                  # Implements CRMProvider from crm-engine
├── channel-whatsapp/         # Implements ChannelProvider (to be defined)
├── pinecone-knowledge/       # Implements KnowledgeProvider from knowledge-engine
├── google-calendar/          # Implements CalendarProvider from calendar-engine
└── supabase-storage/         # Implements StorageProvider (to be defined)
```

### Provider naming convention

`<provider-name>-<engine-domain>` — e.g., `ghl-crm`, `google-calendar`, `channel-whatsapp`.

### InMemory providers

InMemory providers (test doubles) stay INSIDE their engine's `src/providers/` directory. They're test infrastructure, not deployable adapters.

### Classification

| Provider | Classification | Migration |
|---|---|---|
| `ghl-engine/` → `providers/ghl-crm/` | **Deprecated → target state** | Delayed — RT-2 |
| WhatsApp (monolith) → `providers/channel-whatsapp/` | **Transitional → target state** | Delayed — RT-2/RT-3 |
| Pinecone (monolith) → `providers/pinecone-knowledge/` | **Transitional → target state** | Delayed — RT-2 |
| Google Calendar stub → `providers/google-calendar/` | **Target state** | Delayed — RT-3 |
| InMemory providers | **Stay in engine** | None |

---

## 11. Channel Layer

| Field | Value |
|---|---|
| **Current state** | Channels are not a distinct layer. WhatsApp logic is inside the monolith (`algorithmus-platform/src/attention/whatsapp/`). Channel abstractions exist in `algorithmus-core-engine/src/core/channels/`. |
| **Semantic question** | Are channels a separate layer or a type of provider? |
| **Decision** | **Channels ARE providers.** A communication channel (WhatsApp, SMS, web) is an external system. The adapter pattern applies identically. Channels have a special role — they are the entry/exit points for conversations — but this is a ROLE distinction, not a LAYER distinction. |
| **Canonical model** | Channels are providers that implement a `ChannelProvider` interface. They live in `packages/providers/channel-*`. The `ChannelProvider` interface defines `send()` and `receive()` (webhook handler). It is defined in `packages/shared/` as a canonical interface. |
| **Classification** | **Sub-category of Provider layer.** Not a standalone top-level directory. |
| **Migration** | **Delayed.** Extract WhatsApp from monolith into `packages/providers/channel-whatsapp/` during RT-2/RT-3. Define `ChannelProvider` interface in shared/. |

---

## 12. Runtime Layer

| Field | Value |
|---|---|
| **Question** | Does "runtime" deserve its own top-level directory? |
| **Current state** | The runtime concept is distributed: `algorithmus-platform` (Express server), `algorithmus-core-engine` (orchestration library), `workflow-orchestrator` (new engine), WhatsApp worker (BullMQ). |
| **Decision** | **No.** "Runtime" is not a package — it is the CONFIGURATION of engines + providers + channels + vertical loaded by an application entry point. The runtime is an EMERGENT property of composition, not a package. |
| **Canonical model** | The runtime entry point for dental is `apps/dental-runtime/` (see §1). It imports and configures: workflow-orchestrator, all engines, channel providers, and vertical config. It starts the Express server and BullMQ workers. The "runtime" is the running process, not a directory. |
| **Classification** | **Concept, not a directory.** No `runtime/` top-level folder. |

---

## 13. `packages/algorithmus/` — Container Directory Fate

| Field | Value |
|---|---|
| **Current contents** | `algorithmus-core-engine/` (transitional), `algorithmus-platform/` (transitional), `forge/` (scaffolding tool), `algorithmus-platform.zip` (archive) |
| **Fate** | This directory **disappears** when its contents are fully decomposed or relocated. There is no canonical replacement. |
| **Forge disposition** | `forge/` is a Next.js app providing Forge Free scaffolding. It is not an engine, provider, or vertical. It is a development tool. Canonical location: `tools/forge/`. |
| **Classification** | **Transitional container — decomposing to extinction.** |
| **Migration** | **Frozen.** Do not restructure until core-engine and platform extraction is complete. When both are empty, move `forge/` to `tools/forge/` and delete `packages/algorithmus/`. |

---

## 14. Complete Canonical Topology (Target State)

```
curdeeclau-monorepo/
│
├── apps/                                 # Deployable applications
│   ├── dental-receptionist/              # Next.js admin dashboard (rename: drop "-ai-")
│   ├── dental-runtime/                   # WhatsApp webhook + runtime server (from algorithmus-platform)
│   ├── quiniela-2026/                    # Orthogonal — sports betting
│   ├── reducidas-2026/                   # Orthogonal
│   ├── survivor-world-cup/               # Orthogonal
│   └── landing-oraculo/                  # Orthogonal
│
├── packages/                             # Libraries and shared modules
│   ├── shared/                           # CANONICAL CONTRACTS — authoritative
│   │
│   ├── engines/                          # Deterministic runtime engines
│   │   ├── workflow-orchestrator/        # Central coordination
│   │   ├── handoff-engine/              # Ownership + suppression + recovery
│   │   ├── crm-engine/                  # CRM entity management
│   │   ├── calendar-engine/             # Temporal resource coordination
│   │   ├── message-buffer-engine/       # Conversation message buffering
│   │   ├── media-delivery-engine/       # Media delivery coordination
│   │   └── knowledge-engine/            # RAG knowledge retrieval (relocated)
│   │
│   ├── providers/                        # External system adapters (NEW LAYER)
│   │   ├── ghl-crm/                     # GHL adapter → implements CRMProvider
│   │   ├── channel-whatsapp/            # WhatsApp webhook + sending
│   │   ├── pinecone-knowledge/          # Pinecone vector search
│   │   ├── google-calendar/             # Google Calendar adapter
│   │   └── supabase-storage/            # Supabase client adapter
│   │
│   └── forge/                            # Dev tool — Forge Free scaffolding (relocated)
│
├── verticals/                            # Domain-specific configuration
│   └── dental/                           # Sarah — dental AI receptionist
│       ├── config/
│       ├── knowledge/
│       ├── schemas/
│       ├── prompts/
│       ├── policies/
│       ├── states/
│       ├── tools/
│       └── workflows/
│
├── workflows/                            # Reference artifacts (design provenance)
│   ├── blueprints/                       # Original n8n workflow exports
│   └── patterns/                         # Extracted architectural patterns (renamed)
│
├── openspec/                             # Governance layer (constitutional)
│   ├── governance/                       # rt-constitution, runtime-semantics, etc.
│   ├── conventions/                      # Naming, lifecycle, invariant conventions
│   ├── templates/                        # Spec templates
│   └── changes/                          # Engine specs (active + archive)
│
├── docs/                                 # Architecture documentation
│   ├── project-state-map.md
│   ├── enforcement-readiness-assessment.md
│   └── naming-topology-normalization.md  # This document
│
├── tools/                                # Development tools
│   └── forge/                            # (future — from packages/algorithmus/forge/)
│
├── pnpm-workspace.yaml
├── package.json
├── CLAUDE.md
└── README.md
```

---

## 15. Transitional Graveyard

These directories exist now and will NOT exist in the target state:

| Directory | Current Contents | Extraction Target | Disposition |
|---|---|---|---|
| `packages/algorithmus/algorithmus-core-engine/` | Monolith runtime library | `engines/*` + `providers/*` + `shared/` | Delete when empty |
| `packages/algorithmus/algorithmus-platform/` | Express server + WhatsApp | `apps/dental-runtime/` + `providers/channel-whatsapp/` | Delete when empty |
| `packages/algorithmus/` | Container directory | — | Delete when empty |
| `packages/engines/ghl-engine/` | GHL type stub | `providers/ghl-crm/` | Delete after absorption |
| `packages/knowledge-engine/` | RAG engine | `packages/engines/knowledge-engine/` | Move, don't delete |
| `workflows/extracted-patterns/` | Pattern docs | `workflows/patterns/` | Rename only |

---

## 16. Normalization Sequence (When Authorized)

| Phase | Action | Dependencies |
|---|---|---|
| RT-2.0 | Create `packages/providers/` directory | None |
| RT-2.1 | Move `packages/knowledge-engine/` → `packages/engines/knowledge-engine/` | Update `dental-ai-receptionist` import |
| RT-2.2 | Rename `workflows/extracted-patterns/` → `workflows/patterns/` | None |
| RT-2.3 | Absorb `packages/engines/ghl-engine/` types into `packages/providers/ghl-crm/` | `CRMProvider` interface finalized in shared/ |
| RT-2.4 | Extract WhatsApp from monolith into `packages/providers/channel-whatsapp/` | `ChannelProvider` interface defined in shared/ |
| RT-2.5 | Create `apps/dental-runtime/` from `algorithmus-platform` decomposition | WhatsApp extracted, orchestrator uses new engines |
| RT-3.0 | Delete `packages/algorithmus/` when core-engine and platform are empty | All monolith components extracted |
| RT-3.1 | Move `forge/` to `tools/forge/` | `packages/algorithmus/` deleted |
| RT-3.2 | Rename `apps/dental-ai-receptionist/` → `apps/dental-receptionist/` | Cosmetic |

---

## 17. Names That Must NOT Change

These names are constitutionally protected or architecturally load-bearing:

| Name | Reason |
|---|---|
| `shared/` | Industry convention. Appendix A protected. Changing it breaks every engine import. |
| `engines/` | Correct layer name. Constitution Article I domain. |
| `verticals/` | Correct layer name. Constitution Article IX domain. |
| `openspec/` | Correct governance layer name. Recognized standard. |
| `workflow-orchestrator` | Describes capability exactly. |
| `handoff-engine` | Describes capability exactly. |
| `crm-engine` | Describes capability exactly. |
| `calendar-engine` | Describes capability exactly. |
| `message-buffer-engine` | Describes capability exactly. |
| `DomainEvent` | Constitution Article V.2 — shape is frozen. |
| `ConversationOwner` | Constitution Article VII.1 — four modes are exhaustive. |
| `SuppressionMode` | Constitution Article VII.4 — coupled to ownership. |

---

*Normalization map complete. No physical changes authorized. This document governs all future renames, moves, and layer assignments.*
