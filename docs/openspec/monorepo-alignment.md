# Monorepo Architecture Alignment

## Current State (2026-05-12)

### What was done

1. **Nested `.git` repos removed** from `packages/algorithmus/algorithmus-core-engine/` and `packages/algorithmus/algorithmus-platform/`. Root `.git` is now the single source of truth.

2. **Workspace config updated** (`pnpm-workspace.yaml`):
   ```yaml
   packages:
     - "apps/*"
     - "packages/*"
     - "packages/algorithmus/*"
   ```

3. **Package cleanup**: Removed `node_modules/` and `package-lock.json` from both algorithmus packages (pnpm manages deps at root).

4. **Package names normalized**:
   - `@curdeeclau/algorithmus-core-engine` — Deterministic sports mathematical engine
   - `@curdeeclau/algorithmus-platform` — Conversational Operating System

### Known Architecture Mismatch

The current code layout does NOT match the target responsibilities:

| Package | Should contain | Actually contains |
|---------|---------------|-------------------|
| `algorithmus-core-engine` | Math engine (reductions, matrices, probabilities, validators, scoring, contest logic, optimization) | FSM, LLM, RAG, WhatsApp workers, metrics, validation, identity/GHL (~40 TS files of conversational infra) |
| `algorithmus-platform` | Conversational OS (orchestration, routing, attention, Telegram, agent execution) | Orchestrator, attention layer, WhatsApp sender, output dispatcher (~14 TS files) |
| `apps/quiniela-2026/src/lib/quiniela/` | App-specific UI + Zustand store | **The actual math engine** (engine/, matrices/, algorithms/, probabilities/, contest/, reductions/, entitlements/, oraculo/, communication/) |

**The real math engine lives in `apps/quiniela-2026/src/lib/quiniela/`**, not in `algorithmus-core-engine`.

## Target Architecture

```
curdeeclau-monorepo/
├── apps/
│   ├── quiniela-2026/          → system-progol-private (later rename)
│   └── reducidas-2026/         (future)
├── packages/
│   ├── algorithmus/
│   │   ├── algorithmus-core-engine/   → Math engine (extracted from quiniela)
│   │   └── algorithmus-platform/      → Conversational OS
│   └── math-engine/                  → Python OR-Tools backend
└── docs/
    └── openspec/
```

### Responsibility Boundaries

```
algorithmus-platform (Conversational OS)
├── Orchestration / Routing
├── Attention layer
├── Agent execution engine
├── Telegram integration (IRIS)
├── WhatsApp integration
├── Output dispatcher
└── FSM / Conversation state

algorithmus-core-engine (Math Engine)
├── Engine (validation, pricing, direct generation)
├── Matrices (packed format, validators, loaders, compression)
├── Algorithms (coverage, set cover, heuristics)
├── Probabilities (models, column prob, EV, ranking, simulation)
├── Contest (formats, products, addons, pricing, rules)
├── Reductions (compatibility, catalog)
├── Entitlements
├── Oráculo (probability-assisted recommendations)
└── Communication contracts (Telegram events/templates)
```

## Migration Plan

### Phase A — Extract math engine (no breaking changes)

1. Move `apps/quiniela-2026/src/lib/quiniela/` → `packages/algorithmus/algorithmus-core-engine/src/`
2. Update internal imports within core-engine
3. Export barrel from core-engine matching current `index.ts`
4. `quiniela-2026` depends on `@curdeeclau/algorithmus-core-engine` via workspace protocol
5. Re-export or re-map in quiniela-2026 to avoid breaking UI imports

### Phase B — Align platform code

1. Audit current `algorithmus-platform` code against target responsibilities
2. Remove/migrate any math logic that leaked into platform
3. Platform depends on `@curdeeclau/algorithmus-core-engine` for math operations

### Phase C — Rename apps

1. `quiniela-2026` → `system-progol-private`
2. Update all internal references

### Phase D — Python OR-Tools integration

1. `packages/math-engine/` exposes solver API
2. `algorithmus-core-engine` calls solver via HTTP or subprocess

## Contracts (Platform ↔ Core-Engine)

Platform expects from Core-Engine:
- `validarConfig(config)` → validation result
- `generarDirecta(config)` / `generarPorLotes(config, n)` → packed columns
- `obtenerColumnasReduccion(size)` → packed columns
- `calcularAhorroReduccion(size, directa)` → savings
- `analyzeQuiniela(matchProbs)` → analysis
- `recommendReductions(analysis)` → recommendations
- `calculateEV(columna, matchProbs)` → EV result
- `runSimulation(matrix, config)` → simulation result

Core-Engine expects from Platform:
- Agent execution context (user session, preferences)
- Telegram/WhatsApp dispatch
- Attention routing decisions

## NOT in scope

- Predictive AI / ML / neural networks
- OCR
- Social feed / chat
- Achievements / gamification
- Marketplace
- Mobile native apps
- Crypto / tokens
- Microservices beyond what exists
