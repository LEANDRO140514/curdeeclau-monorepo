# Canonical Runtime Topology

**Phase:** RT-1
**Date:** 2026-05-18
**Status:** Proposal — target architecture definition

---

## Topology Overview

```
                         ┌──────────────────┐
                         │   APPS (layer 4)  │
                         │   UI composition   │
                         └────────┬─────────┘
                                  │ consumes
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  CONVERSATIONAL │   │   MATH RUNTIME  │   │   PROVIDERS     │
│  (layer 3)      │   │   (layer 2)     │   │   (layer 4)     │
│  FSM·LLM·RAG    │   │   reductions    │   │   adapters      │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │ consumes
                               ▼
                    ┌─────────────────────┐
                    │  ENGINES (layer 1)  │
                    │  deterministic      │
                    │  CRM·Calendar·      │
                    │  Handoff·Buffer·    │
                    │  Orchestrator       │
                    └──────────┬──────────┘
                               │ consumes
                               ▼
                    ┌─────────────────────┐
                    │  SHARED (layer 0)   │
                    │  canonical contracts│
                    │  DomainEvent·       │
                    │  Ownership·IEngine  │
                    └─────────────────────┘

          ┌───────────────────────────────────────┐
          │  VERTICALS ─── domain configuration   │
          │  WORKFLOWS ─── reference blueprints   │
          │  OPENSPEC  ─── governance layer       │
          └───────────────────────────────────────┘
```

---

## Layer 0 — Canonical Contracts

**Package:** `@curdeeclau/shared`
**Location:** `packages/shared/`
**Dependency direction:** Zero dependencies on other workspace packages
**Consumed by:** All engines, conversational runtime, math runtime, apps

### Contract Inventory

```
packages/shared/src/
├── index.ts                          # Barrel — all public exports
│
├── events/
│   ├── DomainEvent.ts                # Canonical event shape
│   └── EventCatalog.ts               # [NEW] Central event type registry
│
├── runtime/
│   ├── Ownership.ts                  # AI | HUMAN | SHARED | LOCKED
│   ├── Suppression.ts                # FULL | SILENT | ASSIST | NONE
│   ├── ExecutionContext.ts           # Runtime envelope
│   └── ConversationContext.ts        # Conversation-scoped context
│
├── engine/
│   ├── IEngine.ts                    # [NEW] Canonical Engine interface
│   └── IProvider.ts                  # [NEW] Canonical Provider interface
│
├── channels/
│   └── IChannel.ts                   # [NEW] Canonical Channel abstraction
│
├── ids/
│   └── EntityId.ts                   # Prefixed IDs (usr_, conv_, wfl_, etc.)
│
├── crm/
│   ├── Contact.ts                    # CRMContact interface
│   ├── Opportunity.ts                # CRMOpportunity interface
│   ├── Pipeline.ts                   # CRMPipeline interface
│   └── Campaign.ts                   # CRMCampaign interface
│
├── calendar/
│   ├── Calendar.ts                   # Calendar interface
│   ├── TimeSlot.ts                   # TimeSlot interface
│   ├── Reservation.ts                # Reservation interface
│   └── Reminder.ts                   # Reminder interface
│
├── workflow/
│   ├── WorkflowState.ts              # CanonicalWorkflowState
│   └── WorkflowContext.ts            # CanonicalWorkflowContext
│
└── tests/
    ├── events.test.ts
    ├── runtime.test.ts
    ├── crm.test.ts
    ├── workflow.test.ts
    └── ids.test.ts
```

### NEW Contracts (to be created)

#### IEngine

```typescript
interface IEngine<TContext = Record<string, unknown>> {
  readonly engineName: string;
  execute(action: string, context: TContext): Promise<EngineResult>;
}

interface EngineResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: { code: string; message: string };
  events: DomainEvent[];
}
```

#### IProvider

```typescript
interface IProvider<TConfig = Record<string, unknown>> {
  readonly providerName: string;
  readonly providerVersion: string;
  initialize(config: TConfig): Promise<void>;
  healthCheck(): Promise<boolean>;
}
```

#### IChannel

```typescript
interface IChannel {
  readonly channelName: string;
  readonly supportedActions: ChannelAction[];
  send(request: ChannelRequest): Promise<ChannelResponse>;
  receive(payload: unknown): Promise<ChannelMessage>;
}

type ChannelAction = 'send_text' | 'send_media' | 'send_template' | 'receive_message' | 'receive_webhook';
```

---

## Layer 1 — Deterministic Engines

**Location:** `packages/engines/`
**Dependency direction:** Consumes `@curdeeclau/shared`, NEVER imports provider SDKs
**Provided by:** Layer 4 providers (dependency injection)

### Engine Inventory

| Engine | Package | OpenSpec | Invariants | InMemory Provider | Real Provider |
|---|---|---|---|---|---|
| CRM | `@curdeeclau/crm-engine` | ✅ `create-ghl-engine/` | I1-I22 | ✅ InMemoryCRMProvider | GHL (stub) |
| Calendar | `@curdeeclau/calendar-engine` | ✅ `create-calendar-engine/` | I1-I30 | ✅ InMemoryCalendarProvider | Google (stub) |
| Handoff | `@curdeeclau/handoff-engine` | △ (types only, no formal spec) | Implicit | N/A | N/A |
| Workflow Orchestrator | `@curdeeclau/workflow-orchestrator` | ✅ `orchestration-model.md` | 6 invariants | InMemory execution | N/A |
| Message Buffer | `@curdeeclau/message-buffer-engine` | △ (no formal spec) | Implicit | ✅ InMemoryBufferStore | Redis (future) |
| Knowledge | `@curdeeclau/knowledge-engine` | ✅ `create-knowledge-engine/` | K1-K25 | InMemory vector | Pinecone |
| GHL | `@curdeeclau/ghl-engine` | ✅ `create-ghl-engine/` spec | I1-I22 | N/A (types only) | GHL API |
| Media Delivery | `@curdeeclau/media-delivery-engine` | △ (no formal spec) | None | N/A (types only) | Multi-channel |

### Engine Contract Boundary

```
┌──────────────────────────────────────────────────┐
│                   ENGINE                          │
│                                                   │
│  ┌─────────────┐    ┌──────────────────┐         │
│  │ IEngine     │    │ Internal Logic   │         │
│  │ .execute()  │───▶│ - validation     │         │
│  │ .engineName │    │ - state machine  │         │
│  └─────────────┘    │ - invariants     │         │
│                      │ - event emission │         │
│                      └────────┬─────────┘         │
│                               │                   │
│                      ┌────────▼─────────┐         │
│                      │ IProvider<T>     │         │
│                      │ (injected via DI)│         │
│                      └──────────────────┘         │
│                                                   │
│  Engine NEVER:                                    │
│  ❌ imports provider SDKs directly               │
│  ❌ throws exceptions for business logic          │
│  ❌ has side effects without DomainEvent          │
│  ❌ bypasses ownership gates                      │
│  ❌ defines its own DomainEvent type              │
└──────────────────────────────────────────────────┘
```

---

## Layer 2 — Math Runtime

**Location:** `packages/math/`
**Dependency direction:** Consumes `@curdeeclau/shared` for types only, zero UI deps
**Consumed by:** `apps/quiniela-2026/` (via workspace:*), future apps

### Package Inventory

```
packages/math/
├── math-engine-ts/                   # Extracted from apps/quiniela-2026/src/lib/quiniela/
│   ├── package.json                  # @curdeeclau/math-engine-ts
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                  # Barrel — entire math engine
│   │   ├── types.ts                  # Signo, Columna, NivelGarantia, etc.
│   │   ├── engine/
│   │   │   ├── validate.ts
│   │   │   ├── pricing.ts
│   │   │   ├── direct.ts             # Mixed-radix expansion
│   │   │   └── reductions.ts         # 12 official catalogs
│   │   ├── matrices/
│   │   │   ├── schema.ts             # Bit-packed format (28-bit)
│   │   │   ├── packer.ts
│   │   │   ├── data.ts
│   │   │   ├── oficiales.ts
│   │   │   ├── metadata.ts
│   │   │   ├── loaders.ts
│   │   │   ├── compression.ts
│   │   │   └── validators.ts
│   │   ├── algorithms/
│   │   │   ├── coverage.ts
│   │   │   ├── heuristics.ts
│   │   │   └── setCover.ts
│   │   ├── probabilities/
│   │   │   ├── schema.ts
│   │   │   ├── validation.ts
│   │   │   ├── models.ts             # 6 probability models
│   │   │   ├── column.ts
│   │   │   ├── statistics.ts
│   │   │   ├── payout.ts
│   │   │   ├── ev.ts
│   │   │   ├── ranking.ts
│   │   │   ├── simulation.ts         # Monte Carlo
│   │   │   └── datasets.ts
│   │   ├── oraculo/
│   │   │   ├── probabilities.ts
│   │   │   └── analysis.ts
│   │   ├── reductions/
│   │   │   ├── catalog.ts            # R4-R132 products
│   │   │   └── compatibility.ts
│   │   ├── contest/
│   │   │   ├── formats.ts            # PROGOL_14, REVANCHA_7, etc.
│   │   │   ├── products.ts
│   │   │   ├── addons.ts
│   │   │   ├── pricing.ts
│   │   │   └── rules.ts
│   │   ├── entitlements/
│   │   │   └── index.ts
│   │   ├── communication/
│   │   │   ├── agents.ts             # ATLAS/ORACULO/HERMES/IRIS
│   │   │   └── telegram.ts           # Templates + IRIS dispatcher
│   │   ├── orchestrator/
│   │   │   ├── types.ts
│   │   │   └── loop.ts               # 6-phase product loop
│   │   ├── survivor/
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── tests/
│   │       ├── engine.test.ts
│   │       ├── product.test.ts
│   │       ├── probabilities.test.ts
│   │       ├── benchmark.test.ts
│   │       └── packed.test.ts
│   └── README.md
│
└── math-engine-py/                   # Renamed from packages/math-engine/
    ├── pyproject.toml                # @curdeeclau/math-engine-py
    ├── main.py                       # FastAPI: POST /solve, GET /health, GET /catalog
    ├── solver.py                     # OR-Tools CP-SAT solver
    └── test_solver.py
```

---

## Layer 3 — Conversational Runtime

**Location:** `packages/conversational/`
**Dependency direction:** Consumes engines (layer 1) + providers (layer 4) + `@curdeeclau/shared`
**Consumed by:** Apps that need AI-powered conversation

### Package Inventory

```
packages/conversational/
├── conversational-core/              # Renamed from algorithmus-core-engine
│   ├── package.json                  # @curdeeclau/conversational-core
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   ├── core/
│   │   │   ├── fsm/
│   │   │   │   ├── FSMEngine.ts
│   │   │   │   └── fsm.types.ts
│   │   │   ├── llm/
│   │   │   │   └── LLMGateway.ts     # Multi-provider fallback
│   │   │   ├── rag/
│   │   │   │   ├── RAGService.ts
│   │   │   │   └── RAGAdapter.ts     # Interface, not Pinecone-specific
│   │   │   ├── validation/
│   │   │   │   ├── AIValidator.ts
│   │   │   │   ├── DecisionMatrix.ts
│   │   │   │   ├── HardGate.ts
│   │   │   │   └── GroundingPolicy.ts
│   │   │   ├── orchestrator/
│   │   │   │   └── Orchestrator.ts
│   │   │   ├── identity/
│   │   │   │   └── IdentityManager.ts
│   │   │   ├── ingestion/
│   │   │   │   └── IngestionService.ts
│   │   │   ├── embedding/
│   │   │   │   └── EmbeddingService.ts
│   │   │   ├── observability/
│   │   │   │   └── Metrics.ts
│   │   │   └── channels/
│   │   │       ├── channelMessage.ts
│   │   │       └── outboundMessage.ts
│   │   ├── infra/                    # Thin wrappers over provider interfaces
│   │   │   ├── grounding/
│   │   │   ├── observability/
│   │   │   └── handlers/
│   │   ├── app/                      # Express server bootstrap
│   │   │   ├── server.ts
│   │   │   ├── compositionRoot.ts    # DI wiring
│   │   │   └── routes.ts
│   │   ├── workers/
│   │   │   └── whatsappWorker.ts
│   │   ├── config/
│   │   └── tests/
│   └── obsidian/ADR/                 # ADR-001 through ADR-006
│
└── conversational-platform/          # Renamed from algorithmus-platform
    ├── package.json                  # @curdeeclau/conversational-platform
    ├── tsconfig.json
    ├── src/
    │   ├── index.ts
    │   ├── app/
    │   │   ├── server.ts
    │   │   └── createPlatformOrchestrator.ts
    │   ├── attention/
    │   │   ├── core-adapter/
    │   │   │   ├── core-adapter.interface.ts
    │   │   │   ├── core-adapter.service.ts
    │   │   │   └── types.ts
    │   │   ├── output/
    │   │   │   ├── output-dispatcher.ts
    │   │   │   └── sender.interface.ts
    │   │   └── whatsapp/
    │   │       ├── whatsapp.adapter.ts
    │   │       └── whatsapp.sender.ts
    │   └── routes/
    │       └── whatsapp.webhook.ts
    └── tests/
```

---

## Layer 4 — Provider Adapters

**Location:** `providers/` (NEW directory)
**Dependency direction:** Implements `IProvider` from `@curdeeclau/shared`, may import provider SDKs
**Injected into:** Engines (layer 1), Conversational runtime (layer 3)

### Provider Inventory

```
providers/
├── whatsapp-ycloud/                  # Extracted from algorithmus-core-engine
│   ├── package.json                  # @curdeeclau/provider-whatsapp-ycloud
│   ├── src/
│   │   ├── index.ts
│   │   ├── YCloudProvider.ts         # implements IChannel
│   │   ├── ycloudClient.ts
│   │   ├── ycloudSender.ts
│   │   ├── ycloudIdempotency.ts
│   │   ├── ycloudWebhookParser.ts
│   │   ├── ycloudWebhookVerifier.ts
│   │   └── ycloudTypes.ts
│   └── tests/
│
├── llm-openai/                       # [NEW] Extracted from LLMGateway
│   ├── package.json                  # @curdeeclau/provider-llm-openai
│   ├── src/
│   │   ├── index.ts
│   │   ├── OpenAIProvider.ts         # implements ILLMProvider
│   │   └── OpenAIModerationClient.ts
│   └── tests/
│
├── llm-openrouter/                   # [NEW]
│   └── ...
│
├── llm-gemini/                       # [NEW]
│   └── ...
│
├── vector-pinecone/                  # Extracted from algorithmus-core-engine + knowledge-engine
│   ├── package.json                  # @curdeeclau/provider-vector-pinecone
│   ├── src/
│   │   ├── index.ts
│   │   ├── PineconeProvider.ts       # implements IVectorProvider
│   │   └── client.ts
│   └── tests/
│
├── crm-ghl/                          # [NEW] Extracted from ghl-engine stub
│   └── ...
│
├── calendar-google/                  # [NEW] Extracted from calendar-engine stub
│   └── ...
│
└── telegram/                         # [NEW] For future Telegram channel
    └── ...
```

### Provider Contract

Every provider package:
1. Implements a canonical interface from `@curdeeclau/shared` (`IProvider`, `IChannel`, etc.)
2. May import its specific provider SDK (e.g., `@pinecone-database/pinecone`)
3. Returns canonical types (not provider-specific types)
4. Has its own test suite
5. Is optional — apps choose which providers to install

---

## Layer 5 — Verticals

**Location:** `verticals/`
**Dependency direction:** Zero code dependencies — pure JSON/text configuration
**Consumed by:** Engines and conversational runtime at initialization

### Canonical Vertical Structure

```
verticals/{vertical-name}/
├── manifest.json                     # Required: id, name, version, language, timezone, domains
├── config/
│   └── vertical.json                 # Business hours, appointment rules, RAG params, channels
├── knowledge/                        # Domain-specific knowledge base
│   ├── faq.json
│   ├── procedures.json
│   ├── terminology.json
│   ├── policies.json
│   └── ...
├── schemas/                          # Domain-specific Zod/JSON schemas
│   ├── faq.schema.json
│   ├── procedure.schema.json
│   └── ...
├── prompts/                          # AI system prompts
│   ├── {agent}.system.txt
│   ├── {agent}.personality.json
│   └── escalation-rules.json
├── policies/                         # Engine policies
│   ├── handoff-policy.json
│   ├── calendar-policy.json
│   └── media-policy.json
├── states/
│   └── state-machine.json
├── tools/
│   └── manifest.json
└── workflows/
    └── manifest.json
```

### Manifest Schema (to be formalized)

```typescript
interface VerticalManifest {
  id: string;                          // "dental"
  name: string;                        // "Dental AI Receptionist"
  version: string;                     // "0.2.1"
  language: string;                    // "es-MX"
  timezone: string;                    // "America/Mexico_City"
  currency: string;                    // "MXN"
  domains: string[];                   // ["general", "orthodontics", ...]
  engines: Record<string, EngineBinding>;
  channels: ChannelBinding[];
  platformPrinciples: PlatformPrinciple[];
}

interface EngineBinding {
  package: string;                     // "@curdeeclau/knowledge-engine"
  status: "active" | "placeholder" | "planned";
  phase: number;
}
```

---

## Layer 6 — Workflow Blueprints

**Location:** `workflows/`
**Status:** FROZEN — reference documentation only
**Migration target:** Convert to engine workflow definitions (future phase)

### Current Inventory

```
workflows/
├── blueprints/                        # 39 n8n JSON exports + 13 _meta.json
│   ├── agents/                        # 1 blueprint
│   ├── calendar/                      # 7 blueprints
│   ├── crm/                           # 2 blueprints
│   ├── data/                          # 1 blueprint
│   ├── handoff/                       # 2 blueprints
│   ├── lovable/                       # 1 blueprint
│   ├── media/                         # 2 blueprints
│   ├── message-buffer/                # 1 blueprint
│   ├── payments/                      # 1 blueprint
│   ├── rag/                           # 2 blueprints
│   ├── reservas/                      # 5 blueprints
│   ├── scraping/                      # 1 blueprint
│   └── voice/                         # 4 blueprints
│
└── extracted-patterns/                # 13 pattern documentation .md files
    ├── agents-pattern.md
    ├── calendar-pattern.md
    ├── crm-pattern.md
    ├── data-pattern.md
    ├── handoff-pattern.md
    ├── lovable-pattern.md
    ├── media-pattern.md
    ├── message-buffer-pattern.md
    ├── payments-pattern.md
    ├── rag-pattern.md
    ├── reservas-pattern.md
    ├── scraping-pattern.md
    └── voice-pattern.md
```

---

## Layer 7 — Governance

**Location:** `openspec/`
**Status:** ACTIVE — formal governance layer

```
openspec/
├── README.md
├── governance/
│   ├── engine-governance.md
│   ├── runtime-semantics.md
│   ├── event-model.md
│   ├── ownership-model.md
│   └── orchestration-model.md
├── conventions/
│   ├── naming-conventions.md
│   ├── lifecycle-conventions.md
│   └── invariant-conventions.md
├── templates/
│   ├── proposal-template.md
│   ├── design-template.md
│   ├── tasks-template.md
│   └── engine-spec-template.md
└── changes/
    ├── create-ghl-engine/
    ├── create-calendar-engine/
    └── create-knowledge-engine/
```

---

## Boundary Enforcement Rules

| Rule | Enforcement |
|---|---|
| No engine imports a provider SDK | CI check: grep for provider SDKs in engine packages |
| All engines import DomainEvent from `@curdeeclau/shared` | CI check: grep for local DomainEvent definitions |
| All provider packages implement `IProvider` or `IChannel` | TypeScript typecheck |
| No vertical contains `.ts` files | CI check: file extension audit |
| No app contains business logic (only UI composition) | Code review |
| Every new engine has an OpenSpec before implementation | Process gate |
| `@curdeeclau/shared` has zero workspace dependencies | `pnpm list` verification |
