# Runtime Reorganization Proposal

**Phase:** RT-1 — Runtime Topology Consolidation
**Date:** 2026-05-18
**Status:** Proposal — no code modified
**Depends on:** `runtime-topology-report.md`

---

## Executive Summary

The monorepo has grown organically across multiple development streams (Forge apps, OpenSpec engines, Algorithmus production runtime, n8n blueprints). This has produced structural incoherence: engines with duplicate types, a conversational orchestrator misnamed as a math engine, 72 math files buried inside an app, and two parallel runtimes (Forge/Engine + n8n) with no bridge.

**This proposal defines the canonical topology** — the structural target the monorepo should converge toward. No migration is performed here. Migration sequencing lives in `migration-roadmap.md`.

---

## Problem Statement

Six structural problems, ranked by severity:

| # | Problem | Severity | Impact |
|---|---|---|---|
| P1 | `algorithmus-core-engine` contains conversational FSM/LLM, not math engine | **CRITICAL** | Naming lies to every reader |
| P2 | Real math engine (72 files) trapped in `apps/quiniela-2026/src/lib/quiniela/` | **CRITICAL** | Blocks reuse, violates monorepo contract |
| P3 | Only 2/7 engines consume `@curdeeclau/shared` — 5 define duplicate types | **HIGH** | Semantic drift, type fragmentation |
| P4 | 39 n8n blueprints + 7 TypeScript engines = two parallel execution worlds | **HIGH** | No path from blueprint to engine |
| P5 | Provider leakage: YCloud, Pinecone hardcoded in orchestrator | **MEDIUM** | Blocks multi-provider, multi-channel |
| P6 | Knowledge engine carries dental-specific schemas | **MEDIUM** | Blocks other verticals |

---

## Design Principles

1. **Deterministic first, AI second.** The runtime executes rules. AI is a tool call, not the runtime.
2. **One canonical type per concept.** `@curdeeclau/shared` is the single source of truth.
3. **Engine = deterministic execution unit.** Every engine has a formal OpenSpec with invariants.
4. **Provider = replaceable adapter.** Engines never import provider SDKs directly.
5. **Vertical = domain configuration.** Knowledge, schemas, prompts, policies — zero code.
6. **App = UI composition.** Apps consume engines and verticals, they don't define runtime logic.
7. **Workflow = orchestrated engine sequence.** Blueprints (n8n or otherwise) are references, not the runtime.

---

## Target Structure

```
curdeeclau-monorepo/
│
├── CLAUDE.md                          # Agent instructions (runtime governance)
├── pnpm-workspace.yaml                # workspace root
│
├── apps/                              # UI applications
│   ├── quiniela-2026/                 # Progol + Private 11 + Survivor UI
│   ├── landing/                       # Oraculo Society landing
│   ├── dental-receptionist/           # Azul dental receptionist UI
│   └── survivor-world-cup/            # World Cup survivor (spec → future app)
│
├── packages/                          # All shareable code
│   │
│   ├── shared/                        # CANONICAL CONTRACTS — layer 0
│   │   └── @curdeeclau/shared
│   │       ├── events/DomainEvent.ts
│   │       ├── runtime/Ownership.ts
│   │       ├── runtime/ExecutionContext.ts
│   │       ├── runtime/Suppression.ts
│   │       ├── ids/EntityId.ts
│   │       ├── engine/IEngine.ts          # NEW — canonical Engine contract
│   │       ├── engine/IProvider.ts        # NEW — canonical Provider contract
│   │       ├── channels/IChannel.ts       # NEW — canonical Channel contract
│   │       ├── events/EventCatalog.ts     # NEW — central event taxonomy
│   │       ├── workflow/WorkflowState.ts
│   │       ├── workflow/WorkflowContext.ts
│   │       ├── crm/                       # CRM canonical entities
│   │       ├── calendar/                  # Calendar canonical entities
│   │       └── tests/
│   │
│   ├── engines/                       # DETERMINISTIC RUNTIME — layer 1
│   │   ├── crm-engine/                # @curdeeclau/crm-engine ✅
│   │   ├── calendar-engine/           # @curdeeclau/calendar-engine ✅
│   │   ├── handoff-engine/            # @curdeeclau/handoff-engine ✅
│   │   ├── workflow-orchestrator/     # @curdeeclau/workflow-orchestrator ✅
│   │   ├── message-buffer-engine/     # @curdeeclau/message-buffer-engine ✅
│   │   ├── knowledge-engine/          # @curdeeclau/knowledge-engine (extract dental)
│   │   ├── ghl-engine/                # @curdeeclau/ghl-engine (stub)
│   │   └── media-delivery-engine/     # @curdeeclau/media-delivery-engine (stub)
│   │
│   ├── math/                          # MATH RUNTIME — layer 2
│   │   ├── math-engine-ts/            # Extracted from apps/quiniela-2026/lib/quiniela/
│   │   │                               # Matrices, reductions, probabilities, algorithms
│   │   └── math-engine-py/            # Python OR-Tools solver (renamed from math-engine)
│   │
│   ├── conversational/                # CONVERSATIONAL RUNTIME — layer 3
│   │   ├── conversational-core/       # Renamed from algorithmus-core-engine
│   │   │                               # FSM, LLM gateway, RAG, validation pipeline
│   │   └── conversational-platform/   # Renamed from algorithmus-platform
│   │                                   # Orchestrator, attention layer, channel adapters
│   │
│   └── algorithmus/                   # Algorithmus-specific — keep as-is for now
│       └── forge/                     # Forge V3.1 frontend (duplicate of landing)
│
├── providers/                         # PROVIDER ADAPTERS — layer 4 [NEW]
│   ├── whatsapp-ycloud/               # YCloud WhatsApp adapter
│   ├── whatsapp-twilio/               # Twilio WhatsApp adapter (future)
│   ├── telegram/                      # Telegram Bot API adapter
│   ├── llm-openai/                    # OpenAI LLM adapter
│   ├── llm-openrouter/                # OpenRouter LLM adapter
│   ├── llm-gemini/                    # Gemini LLM adapter
│   ├── vector-pinecone/               # Pinecone vector adapter
│   ├── vector-qdrant/                 # Qdrant vector adapter
│   ├── crm-ghl/                       # GoHighLevel CRM adapter
│   ├── calendar-google/               # Google Calendar adapter
│   ├── email-resend/                  # Resend email adapter
│   └── payment-mercadopago/           # Mercado Pago adapter
│
├── verticals/                         # DOMAIN CONFIGURATION — layer 5
│   └── dental/                        # Dental vertical (es-MX)
│       ├── manifest.json
│       ├── config/
│       ├── knowledge/                 # Domain knowledge JSON
│       ├── schemas/                   # Domain-specific Zod/JSON schemas
│       ├── prompts/
│       ├── policies/
│       ├── states/
│       ├── tools/
│       └── workflows/
│
├── workflows/                         # WORKFLOW BLUEPRINTS — layer 6
│   ├── blueprints/                    # n8n JSON exports (reference)
│   └── extracted-patterns/            # Pattern documentation
│
├── openspec/                          # GOVERNANCE — layer 7
│   ├── governance/
│   ├── conventions/
│   ├── templates/
│   └── changes/
│
└── docs/                              # ARCHITECTURE DOCS
    └── architecture/
        ├── runtime-topology-report.md
        ├── runtime-reorganization-proposal.md    # ← this file
        ├── canonical-topology.md
        ├── renaming-proposal.md
        ├── contract-consolidation-plan.md
        ├── leakage-audit.md
        ├── migration-roadmap.md
        └── memory-governance.md
```

---

## Layer Responsibilities

### Layer 0 — Canonical Contracts (`packages/shared/`)
- Single source of truth for ALL types
- Every engine imports from here, never defines its own variant
- Contains: DomainEvent, Ownership, ExecutionContext, IEngine, IProvider, IChannel, entity types
- Zero dependencies on other packages

### Layer 1 — Deterministic Engines (`packages/engines/`)
- Pure logic, no provider SDKs
- Each engine has an OpenSpec with invariants
- Engine class receives providers via constructor (dependency injection)
- Emits DomainEvents via shared event shape
- Phase 1 always InMemory provider

### Layer 2 — Math Runtime (`packages/math/`)
- Extracted from quiniela app
- TypeScript engine + Python OR-Tools solver
- Zero UI dependencies, pure computation
- Consumable by any app

### Layer 3 — Conversational Runtime (`packages/conversational/`)
- FSM-driven conversational orchestrator
- LLM gateway with fallback chain
- AI Validation Pipeline (Validator → Decision → FSM Check → HardGate)
- Provider-agnostic: receives LLM/vector/channel providers via DI

### Layer 4 — Provider Adapters (`providers/`)
- NEW layer — extracted from engines and conversational runtime
- Each provider is a thin adapter implementing a canonical interface
- Knows provider SDK details, nothing else
- Testable in isolation

### Layer 5 — Verticals (`verticals/`)
- Zero code — pure configuration
- Knowledge JSON, schemas, prompts, policies, state machines
- Consumed by engines at runtime
- Each vertical is self-contained, no cross-vertical references

### Layer 6 — Workflow Blueprints (`workflows/`)
- Reference patterns, not the runtime
- n8n JSON exports are frozen as documentation
- Future: migrate to engine workflow definitions

### Layer 7 — Governance (`openspec/`)
- Formal specs before implementation
- Invariants, conventions, templates
- Change proposals tracked here

---

## Key Structural Changes

### Critical (P1-P2)

| Change | From | To | Rationale |
|---|---|---|---|
| Rename algorithmus-core-engine | `packages/algorithmus/algorithmus-core-engine/` | `packages/conversational/conversational-core/` | Name reflects actual content: FSM + LLM + RAG + Validation |
| Rename algorithmus-platform | `packages/algorithmus/algorithmus-platform/` | `packages/conversational/conversational-platform/` | Name reflects actual role: orchestrator + attention layer |
| Extract math engine | `apps/quiniela-2026/src/lib/quiniela/` | `packages/math/math-engine-ts/` | Reusable, zero-UI math runtime |
| Rename math-engine | `packages/math-engine/` | `packages/math/math-engine-py/` | Clarifies Python runtime, groups with TS counterpart |

### High (P3-P4)

| Change | From | To | Rationale |
|---|---|---|---|
| Add IEngine to shared | (doesn't exist) | `packages/shared/src/engine/IEngine.ts` | Single contract for all engines |
| Add IProvider to shared | (doesn't exist) | `packages/shared/src/engine/IProvider.ts` | Single contract for all providers |
| Wire handoff-engine → shared | Own types | Import from `@curdeeclau/shared` | Eliminate DomainEvent duplication |
| Wire workflow-orchestrator → shared | Own types | Import from `@curdeeclau/shared` | Eliminate Engine interface duplication |
| Wire message-buffer → shared | Own types | Import from `@curdeeclau/shared` | Eliminate context duplication |

### Medium (P5-P6)

| Change | From | To | Rationale |
|---|---|---|---|
| Extract YCloud to provider | `algorithmus-core-engine/src/infra/providers/ycloud/` | `providers/whatsapp-ycloud/` | Provider isolation |
| Extract Pinecone to provider | `algorithmus-core-engine/src/infra/pinecone/` | `providers/vector-pinecone/` | Provider isolation |
| Move dental schemas out of knowledge-engine | `knowledge-engine/src/schemas/` | `verticals/dental/schemas/` | Vertical isolation |
| Merge Forge CLAUDE.md | Two identical copies | Single source in `packages/algorithmus/forge/` | Eliminate fork risk |

---

## What Does NOT Change

These are explicitly preserved:

- All 7 engine packages keep their internal logic
- All OpenSpec governance documents
- All ADRs (algorithmus-core-engine)
- All workflow blueprints (frozen as reference)
- All vertical dental configuration
- quiniela-2026 app code (only lib/ is extracted)
- All test suites
- Forge hooks, prompts, El Yunque
- pnpm workspace configuration (updated for new paths)

---

## Success Criteria

After RT-1 consolidation:

1. ✅ Every engine imports `@curdeeclau/shared` for DomainEvent and Ownership
2. ✅ `IEngine` and `IProvider` exist as canonical contracts in shared
3. ✅ Zero provider SDK imports in engine packages
4. ✅ Package names reflect actual content
5. ✅ Math engine is a reusable package, not trapped in an app
6. ✅ Knowledge engine has zero vertical-specific schemas
7. ✅ Conversational runtime is clearly separated from math runtime
8. ✅ All existing tests pass with new import paths
9. ✅ No n8n blueprints modified
10. ✅ No new features added
