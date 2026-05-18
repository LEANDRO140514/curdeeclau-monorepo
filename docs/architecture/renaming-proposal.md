# Renaming Proposal

**Phase:** RT-1
**Date:** 2026-05-18
**Status:** Proposal — no renames executed yet

---

## Naming Audit

Every package, directory, and significant file was audited for semantic accuracy. Names are judged by: does the name reflect what the code ACTUALLY does?

---

## CRITICAL — Names That Lie

### 1. `algorithmus-core-engine` → `conversational-core`

| Dimension | Current | Proposed |
|---|---|---|
| Package name | `@curdeeclau/algorithmus-core-engine` | `@curdeeclau/conversational-core` |
| Directory | `packages/algorithmus/algorithmus-core-engine/` | `packages/conversational/conversational-core/` |
| Description | "Deterministic sports mathematical engine — reductions, matrices, probabilities, validators, scoring, contest logic, optimization" | "Conversational AI orchestrator — FSM, LLM gateway, RAG, validation pipeline" |

**Why it lies:** The package description claims it's a "sports mathematical engine" but the actual code is an FSM-driven conversational orchestrator with LLM gateway, WhatsApp webhook handlers, Pinecone RAG, Redis queues, and YCloud messaging. The "math" claimed in the description exists only as stubs. The real math engine is in `apps/quiniela-2026/src/lib/quiniela/`.

**Evidence:**
- `src/core/orchestrator/Orchestrator.ts` — FSM → LLM → Validation → Decision → HardGate pipeline
- `src/core/fsm/FSMEngine.ts` — 5 states: INIT → QUALIFYING → BOOKING, SUPPORT_RAG → HUMAN_HANDOVER
- `src/core/llm/LLMGateway.ts` — Ollama → OpenRouter → Gemini fallback chain
- `src/infra/providers/ycloud/` — WhatsApp messaging
- `src/infra/queue/` — BullMQ workers
- Zero mathematical reduction/matrix code

### 2. `algorithmus-platform` → `conversational-platform`

| Dimension | Current | Proposed |
|---|---|---|
| Package name | `@curdeeclau/algorithmus-platform` | `@curdeeclau/conversational-platform` |
| Directory | `packages/algorithmus/algorithmus-platform/` | `packages/conversational/conversational-platform/` |

**Why:** This is the orchestration layer for conversational AI (CoreAdapter, OutputDispatcher, WhatsApp adapter). It has nothing to do with "algorithmus" as a mathematical concept. Renaming aligns with `conversational-core`.

### 3. `math-engine` → `math-engine-py`

| Dimension | Current | Proposed |
|---|---|---|
| Package name | `math-engine` (no scope) | `@curdeeclau/math-engine-py` |
| Directory | `packages/math-engine/` | `packages/math/math-engine-py/` |

**Why:** The current name hides that this is a Python package. Adding `-py` suffix and grouping under `packages/math/` with its TypeScript counterpart makes the runtime distinction explicit. Both math engines (TS and Python) live together under one directory.

---

## HIGH — Names That Confuse

### 4. `knowledge-engine` schemas carry dental vertical leakage

| Dimension | Current | Issue |
|---|---|---|
| `src/schemas/patient.ts` | `PatientSchema` with `insurance`, `medicalHistory` | Dental-specific |
| `src/schemas/appointment.ts` | `AppointmentSchema` with `patientId`, `procedureId` | Dental-specific |
| `src/schemas/procedure.ts` | `ProcedureSchema` with `durationMinutes`, `priceRange` in MXN | Dental-specific |

**Proposal:** Move these schemas to `verticals/dental/schemas/`. Keep only the `KnowledgeChunkSchema` in `knowledge-engine/src/schemas/` (it's vertical-agnostic). Knowledge engine should define the *loader interface* and *chunk schema*, not domain-specific entities.

This is a **content move**, not a package rename. The package name `@curdeeclau/knowledge-engine` stays.

### 5. `quiniela-2026_deepclaude` → `quiniela-2026`

| Dimension | Current | Proposed |
|---|---|---|
| Directory | `apps/quiniela-2026_deepclaude/` | `apps/quiniela-2026/` |

**Why:** The `_deepclaude` suffix is a tooling artifact (the app was built using DeepClaude). It adds no semantic meaning to the runtime topology. The zip archive already uses this name. Clean naming = clean topology.

### 6. `reducidas-2026` → DEPRECATED

| Dimension | Current | Proposed |
|---|---|---|
| Directory | `apps/reducidas-2026/` | Remove or move to `archive/reducidas-2026/` |

**Why:** Single standalone HTML file superseded by the quiniela-2026 app. Not a workspace package (no `package.json`). It's technical debt in the apps directory.

---

## MEDIUM — Names That Could Be Clearer

### 7. `ghl-engine` → keep, but clarify scope

The name `ghl-engine` suggests a GHL-specific engine, but the actual code is a type-only stub for CRM entities. This is correct per OpenSpec: `ghl-engine` is the provider-specific adapter layer, not the CRM runtime. The CRM runtime is `crm-engine`.

**Proposal:** Keep name. Add a README clarifying: "GHL adapter implementing CRMProvider from @curdeeclau/crm-engine. This is a provider adapter, not a standalone engine."

### 8. `media-delivery-engine` → keep, clarify

Same pattern as `ghl-engine` — types only, no implementation. The name is accurate for what it WILL be.

---

## LOW — Names That Are Fine

| Package | Verdict | Reason |
|---|---|---|
| `@curdeeclau/shared` | ✅ Keep | Accurate: shared canonical contracts |
| `@curdeeclau/crm-engine` | ✅ Keep | Accurate: provider-agnostic CRM runtime |
| `@curdeeclau/calendar-engine` | ✅ Keep | Accurate: provider-agnostic temporal runtime |
| `@curdeeclau/handoff-engine` | ✅ Keep | Accurate: AI/human governance |
| `@curdeeclau/workflow-orchestrator` | ✅ Keep | Accurate: deterministic workflow execution |
| `@curdeeclau/message-buffer-engine` | ✅ Keep | Accurate: conversation buffering |
| `landing_oraculo_society_forge` | ⚠️ Long | Could shorten to `landing`, but keep for now |
| `dental-ai-receptionist` | ✅ Keep | Accurate: dental AI receptionist app |
| `survivor-world-cup` | ✅ Keep | Accurate: World Cup survivor pool |

---

## Summary Matrix

| # | Severity | Current Name | Proposed Name | Action |
|---|---|---|---|---|
| 1 | CRITICAL | `algorithmus-core-engine` | `conversational-core` | Rename package + directory + tsconfig paths |
| 2 | CRITICAL | `algorithmus-platform` | `conversational-platform` | Rename package + directory + tsconfig paths |
| 3 | CRITICAL | `math-engine` | `math-engine-py` | Rename + group under `packages/math/` |
| 4 | HIGH | `quiniela-2026_deepclaude` | `quiniela-2026` | Rename directory |
| 5 | HIGH | `knowledge-engine/src/schemas/*` (dental) | `verticals/dental/schemas/*` | Move files, not rename |
| 6 | MEDIUM | `reducidas-2026` | (deprecate) | Archive or remove |

---

## What NOT to Rename

- `@curdeeclau/shared` — canonical, correct
- All engines under `packages/engines/` — names are accurate
- `openspec/` — governance layer name is correct
- `verticals/dental/` — correct vertical naming
- `workflows/` — correct, frozen as reference
- `apps/landing_oraculo_society_forge/` — long but accurate
- `packages/algorithmus/forge/` — keep for now (Forge is its own thing)

---

## Naming Conventions (to be codified in openspec/conventions/)

| Category | Pattern | Example |
|---|---|---|
| Engine packages | `{domain}-engine` | `crm-engine`, `calendar-engine` |
| Provider packages | `provider-{channel}-{name}` | `provider-whatsapp-ycloud` |
| Math packages | `math-engine-{lang}` | `math-engine-ts`, `math-engine-py` |
| Conversational packages | `conversational-{role}` | `conversational-core`, `conversational-platform` |
| Apps | `{domain-purpose}` | `quiniela-2026`, `dental-receptionist` |
| Verticals | `{industry}` | `dental`, `real-estate` |
