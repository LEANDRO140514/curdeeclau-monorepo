# Migration Roadmap

**Phase:** RT-1
**Date:** 2026-05-18
**Status:** Roadmap proposal — no migration executed yet

---

## Guiding Principles

1. **Minimum breakage, maximum clarity.** Every phase must leave the repo in a working state.
2. **Rename first, restructure second, extract third.** Names are the cheapest to fix and yield immediate clarity.
3. **One concern per phase.** Never mix renaming with contract changes with extraction.
4. **Tests must pass at every phase boundary.** No "we'll fix tests later."
5. **What NOT to touch is as important as what to touch.**

---

## Phase Overview

```
RT-1 (THIS PHASE)           RT-2               RT-3               RT-4
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Documentation   │  │ Renames         │  │ Contract        │  │ Provider        │
│ & Analysis      │  │ & Structural    │  │ Consolidation   │  │ Extraction      │
│                 │  │ Moves           │  │                 │  │                 │
│ • 6 proposals   │  │ • 3 renames     │  │ • IEngine       │  │ • YCloud →      │
│ • 0 code changes│  │ • Math extract  │  │ • IProvider     │  │   provider      │
│ • 0 file moves  │  │ • Dental move   │  │ • IChannel      │  │ • Pinecone →    │
│                 │  │ • Archive old   │  │ • EventCatalog  │  │   provider      │
│                 │  │ • Wire shared   │  │ • Align engines │  │ • OpenAI →      │
│                 │  │   to 5 engines  │  │   to contracts  │  │   provider      │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
     COMPLETED            PENDING              PENDING              PENDING
```

---

## RT-1 — Documentation & Analysis (CURRENT)

**Status:** ✅ IN PROGRESS
**Goal:** Generate all 6 analysis documents. Zero code changes.

### Deliverables

| # | Document | Status |
|---|---|---|
| 1 | `runtime-reorganization-proposal.md` | ✅ Written |
| 2 | `canonical-topology.md` | ✅ Written |
| 3 | `renaming-proposal.md` | ✅ Written |
| 4 | `contract-consolidation-plan.md` | ✅ Written |
| 5 | `leakage-audit.md` | ✅ Written |
| 6 | `migration-roadmap.md` | ✅ This file |

### Validation

- [ ] User reviews and approves the proposals
- [ ] User decides on any disputed renames
- [ ] User sets priority order for RT-2

---

## RT-2 — Renames & Structural Moves

**Prerequisite:** RT-1 approved
**Goal:** Execute the renames and structural moves. Zero logic changes.

### Step order (must follow this sequence)

#### Step 2.1: Archive deprecated artifacts

| Action | Detail |
|---|---|
| Remove `apps/reducidas-2026/` | Or move to `archive/reducidas-2026/`. Single HTML file, superseded. |

**Validation:** `pnpm install` still works. No package.json modified.

#### Step 2.2: Move dental schemas out of knowledge-engine

| Action | Detail |
|---|---|
| Move `knowledge-engine/src/schemas/patient.ts` | → `verticals/dental/schemas/patient.ts` (or adapt to existing JSON schema) |
| Move `knowledge-engine/src/schemas/appointment.ts` | → `verticals/dental/schemas/` |
| Move `knowledge-engine/src/schemas/procedure.ts` | → `verticals/dental/schemas/` |
| Move `knowledge-engine/src/schemas/faq.ts` | → `verticals/dental/schemas/` |
| Keep `knowledge-engine/src/schemas/knowledge-chunk.ts` | Stays — it's vertical-agnostic |
| Update `knowledge-engine/src/schemas/index.ts` | Remove dental re-exports |
| Update `knowledge-engine/src/loaders/loaders.ts` | Point to vertical schemas via manifest path |

**Validation:** `knowledge-engine` tests pass. Dental vertical JSON schemas remain valid.

#### Step 2.3: Extract math engine from quiniela app

| Action | Detail |
|---|---|
| Create `packages/math/math-engine-ts/` | New package directory |
| Copy `apps/quiniela-2026/src/lib/quiniela/*` | → `packages/math/math-engine-ts/src/` |
| Create `packages/math/math-engine-ts/package.json` | `@curdeeclau/math-engine-ts` v0.1.0 |
| Create `packages/math/math-engine-ts/tsconfig.json` | ES2022, declarations, matching engine pattern |
| Update `apps/quiniela-2026/package.json` | Add `"@curdeeclau/math-engine-ts": "workspace:*"` |
| Update imports in quiniela app | `from '../../lib/quiniela/...'` → `from '@curdeeclau/math-engine-ts'` |
| Run quiniela tests | Must pass with new import paths |

**Validation:** All 5 vitest test files pass. `pnpm typecheck` clean.

#### Step 2.4: Rename algorithmus-core-engine → conversational-core

| Action | Detail |
|---|---|
| Move directory | `packages/algorithmus/algorithmus-core-engine/` → `packages/conversational/conversational-core/` |
| Update `package.json` name | `@curdeeclau/algorithmus-core-engine` → `@curdeeclau/conversational-core` |
| Update `tsconfig.json` paths | `@core` → stays, but update any absolute refs |
| Update `algorithmus-platform` imports | Update `@core` alias or workspace dependency |
| Update `pnpm-workspace.yaml` | Remove `packages/algorithmus/*`, add `packages/conversational/*` |

**Validation:** All algorithmus tests pass. `algorithmus-platform` imports resolve.

#### Step 2.5: Rename algorithmus-platform → conversational-platform

| Action | Detail |
|---|---|
| Move directory | `packages/algorithmus/algorithmus-platform/` → `packages/conversational/conversational-platform/` |
| Update `package.json` name | `@curdeeclau/algorithmus-platform` → `@curdeeclau/conversational-platform` |
| Update dependency | Change `@curdeeclau/algorithmus-core-engine` → `@curdeeclau/conversational-core` |

**Validation:** Platform tests pass. Imports resolve correctly.

#### Step 2.6: Rename math-engine → math-engine-py + group under math/

| Action | Detail |
|---|---|
| Move directory | `packages/math-engine/` → `packages/math/math-engine-py/` |
| Update `pyproject.toml` name | `math-engine` → `math-engine-py` |

**Validation:** `python -m pytest` passes. FastAPI app starts.

#### Step 2.7: Rename quiniela-2026_deepclaude → quiniela-2026

| Action | Detail |
|---|---|
| Move directory | `apps/quiniela-2026_deepclaude/` → `apps/quiniela-2026/` |

**Validation:** `pnpm dev` starts. All imports resolve.

#### Step 2.8: Wire remaining engines to @curdeeclau/shared

| Engine | Current | Action |
|---|---|---|
| `handoff-engine` | Own DomainEvent, Ownership types | Add `@curdeeclau/shared` dep, replace local types |
| `workflow-orchestrator` | Own Event, Engine types | Add `@curdeeclau/shared` dep, replace local types |
| `message-buffer-engine` | Own context types | Add `@curdeeclau/shared` dep, use `ExecutionContext` |
| `ghl-engine` | Types only | Add `@curdeeclau/shared` dep, extend `CRMProvider` |
| `media-delivery-engine` | Types only | Add `@curdeeclau/shared` dep, use `DomainEvent` |

**Validation:** All 7 engine test suites pass. `pnpm typecheck` clean. No local DomainEvent definitions remaining.

#### Step 2.9: Clean up algorithmus directory

| Action | Detail |
|---|---|
| After moves, `packages/algorithmus/` contains only `forge/` | Keep as-is |
| Update `pnpm-workspace.yaml` | Change `packages/algorithmus/*` → `packages/algorithmus/forge` |

**Validation:** `pnpm install` works. Forge app builds.

### RT-2 Validation Gate

- [ ] `pnpm install` succeeds
- [ ] All test suites pass (engines + conversational + quiniela)
- [ ] `pnpm typecheck` across all packages
- [ ] No grep hits for duplicate DomainEvent/Ownership outside shared
- [ ] Package names reflect actual content
- [ ] Zero provider SDKs in engine packages

---

## RT-3 — Contract Consolidation

**Prerequisite:** RT-2 complete
**Goal:** Add canonical contracts to `@curdeeclau/shared`. No provider extraction yet.

### Step order

#### Step 3.1: Add IEngine and IProvider to shared

- Create `packages/shared/src/engine/IEngine.ts`
- Create `packages/shared/src/engine/IProvider.ts`
- Export both from `packages/shared/src/index.ts`

#### Step 3.2: Add IChannel to shared

- Create `packages/shared/src/channels/IChannel.ts`
- Export from `packages/shared/src/index.ts`

#### Step 3.3: Add EventCatalog to shared

- Create `packages/shared/src/events/EventCatalog.ts`
- Contains ALL event type strings from all engines

#### Step 3.4: Align all engines to canonical contracts

- Every engine class adds `implements IEngine<ContextType>`
- Every engine uses `DomainEvent` from shared (already done in RT-2)
- Every engine uses `EventCatalog` for event type strings

#### Step 3.5: Create validation schemas in openspec

- Create `openspec/schemas/vertical-manifest.schema.json`
- Create `openspec/schemas/workflow-definition.schema.json`

### RT-3 Validation Gate

- [ ] All 7 engines implement `IEngine<T>`
- [ ] `EventCatalog` is the single source of event type strings
- [ ] `pnpm typecheck` clean
- [ ] All tests pass

---

## RT-4 — Provider Extraction

**Prerequisite:** RT-3 complete
**Goal:** Extract provider-specific code into dedicated provider packages. Zero logic changes.

### Step order

#### Step 4.1: Extract YCloud WhatsApp provider

- From: `packages/conversational/conversational-core/src/infra/providers/ycloud/`
- To: `providers/whatsapp-ycloud/`
- Package: `@curdeeclau/provider-whatsapp-ycloud`
- Implements: `IChannel`
- Update `conversational-core`: inject `IChannel` instead of importing ycloud directly

#### Step 4.2: Extract Pinecone vector provider

- From: `packages/conversational/conversational-core/src/infra/pinecone/` + `packages/knowledge-engine/src/` Pinecone references
- To: `providers/vector-pinecone/`
- Package: `@curdeeclau/provider-vector-pinecone`
- Implements: `IVectorProvider` (defined in RT-3)
- Update both `conversational-core` and `knowledge-engine` to inject provider

#### Step 4.3: Extract OpenAI LLM provider

- From: `packages/conversational/conversational-core/src/infra/providers/openai/`
- To: `providers/llm-openai/`
- Package: `@curdeeclau/provider-llm-openai`
- Implements: `ILLMProvider` (defined in RT-3)

#### Step 4.4: Remove Pinecone hard dependency from knowledge-engine

- Remove `@pinecone-database/pinecone` from `knowledge-engine/package.json`
- Knowledge engine receives `IVectorProvider` via constructor

### RT-4 Validation Gate

- [ ] Zero provider SDK imports in engine packages
- [ ] Zero provider SDK imports in conversational-core
- [ ] All provider packages have their own test suites
- [ ] `pnpm install` without `@pinecone-database/pinecone` in engine node_modules

---

## What Is Explicitly NOT Touched

These are preserved across all phases:

### NEVER modify
- `CLAUDE.md` (root + Forge)
- `.claude/hooks/` (7 files)
- `.claude/prompts/el-yunque.md`
- `.claude/settings.json`

### NEVER modify (future phases may, but not now)
- All `workflows/blueprints/` (39 n8n JSON) — frozen as reference
- All `workflows/extracted-patterns/` (13 .md) — frozen as documentation
- `verticals/dental/` config — working vertical, only schemas moved TO it
- `openspec/governance/` — canonical, unchanged
- `openspec/conventions/` — canonical, unchanged
- `openspec/templates/` — canonical, unchanged
- `packages/algorithmus/forge/` — independent Forge instance

### NEVER modify without explicit user request
- `apps/landing_oraculo_society_forge/` — separate app
- `apps/dental-ai-receptionist/` — separate app
- `apps/survivor-world-cup/` — spec only
- ADR documents in `conversational-core/obsidian/ADR/`

---

## Risk Matrix

| Phase | Risk | Probability | Mitigation |
|---|---|---|---|
| RT-2.3 | Breaking quiniela imports during math extraction | MEDIUM | Extract to new dir, update imports via find-replace, run tests immediately |
| RT-2.4 | Breaking algorithmus-platform's `@core` alias | MEDIUM | Check all tsconfig paths before move, update to workspace dependency |
| RT-2.7 | quiniela app imports breaking on dir rename | LOW | Vite handles directory renames gracefully with `@/` alias |
| RT-2.8 | handoff-engine types incompatible with shared DomainEvent | MEDIUM | Map fields explicitly, add adapter layer if needed |
| RT-4.1 | YCloud extraction breaking WhatsApp webhook handler | HIGH | Extraction should be pure file move + re-export. Don't refactor logic. |
| RT-4.2 | Pinecone extraction breaking RAG in conversational-core | HIGH | Same as above: pure extraction, no logic changes |

---

## Dependency Graph

```
RT-1 (docs)
  └── RT-2.1 (archive reducidas)
       └── RT-2.2 (dental schemas move) ── independent
       └── RT-2.3 (math extract) ───────── independent
            └── RT-2.4 (rename convers-core) ── depends on RT-2.3 only for path clarity
                 └── RT-2.5 (rename convers-platform) ── depends on RT-2.4
                      └── RT-2.6 (rename math-engine-py) ── independent
                           └── RT-2.7 (rename quiniela dir) ── depends on RT-2.3
                                └── RT-2.8 (wire shared to 5 engines) ── depends on RT-2.4
                                     └── RT-3 (contract consolidation) ── depends on RT-2.8
                                          └── RT-4 (provider extraction) ── depends on RT-3
```

**Maximum parallelism:** RT-2.2, RT-2.3, RT-2.6 can run concurrently. RT-2.4 → RT-2.5 must run sequentially.

---

## Estimated Scope Per Phase

| Phase | File moves | Package.json changes | Import updates | New files | Risk |
|---|---|---|---|---|---|
| RT-2 | ~8 moves | ~5 edits | ~100 import lines | ~3 package.json | MEDIUM |
| RT-3 | 0 moves | 1 edit (shared) | ~20 import lines | 5 new .ts files | LOW |
| RT-4 | ~3 moves | ~3 edits | ~30 import lines | 3 new packages | MEDIUM |
| **Total** | ~11 | ~9 | ~150 | ~11 | MEDIUM |
