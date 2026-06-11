---
ESTADO: SUPERSEDIDO COMO AUTORIDAD ACTIVA
Fecha: 2026-06-11
Supersedido por: .claude/memory/institutional/constitucion.md + .claude/memory/MEMORY.md
Motivo: Pekín Foundation establece la autoridad constitucional activa de CURDEECLAU. OpenSpec se autodeclaraba "architectural governance layer" independiente. Pekín preserva OpenSpec como proceso de especificación técnica, templates y conocimiento histórico — pero sin autoridad constitucional.
Uso permitido: proceso de especificación técnica, templates de diseño, referencia histórica, absorción institucional futura.
Uso prohibido: citarlo como autoridad constitucional, gobernanza activa o fuente de decisiones arquitectónicas que contradigan Pekín.
---

# Algorithmus OpenSpec

## What is OpenSpec?

OpenSpec is the **architectural governance layer** of Algorithmus Platform. It formalizes the contract between patterns, canonical entities, engines, and verticals — before implementation begins.

## Why OpenSpec?

Algorithmus Platform has multiple engines, providers, verticals, and runtime concepts (ownership, suppression, recovery). Without a formal spec layer:

- Engines drift from their contracts
- Invariants are implicit and break silently
- Provider adapters couple to implementation details
- New verticals (EVA Académica) lack a governance baseline

OpenSpec solves this by making **behavioral contracts explicit and machine-verifiable**.

## Algorithmus OpenSpec vs Original OpenSpec

| Aspect | Original OpenSpec | Algorithmus Adaptation |
|---|---|---|
| **Domain** | General software features | AI runtime engines, events, orchestration |
| **Artifacts** | proposal, design, tasks, specs | Same + engine-specific sections (capabilities, invariants, ownership, lifecycle) |
| **Lifecycle** | Propose → Apply → Archive | Blueprint → Pattern → Canonical Contracts → OpenSpec → Engine → Provider Adapter → Vertical |
| **Templates** | Generic feature templates | Engine spec templates, event model templates, governance templates |
| **Key concepts** | Features, changes | Engines, events, ownership, suppression, orchestration, runtime governance |
| **Invariants** | Optional | **Mandatory** — every spec MUST define invariants |

## The Algorithmus Chain

```
Blueprint          ← "What we need" (verticals/dental/workflows/)
    ↓
Pattern            ← "How this problem is solved" (workflows/extracted-patterns/)
    ↓
Canonical Contracts ← "The shared language" (packages/shared/)
    ↓
OpenSpec           ← "The formal contract" (openspec/changes/)
    ↓
Engine             ← "The implementation" (packages/engines/)
    ↓
Provider Adapter   ← "The external connection" (GHL, Chatwoot, WhatsApp)
    ↓
Vertical           ← "The domain application" (dental/Sarah, academic/EVA)
```

## When to Use OpenSpec

**Use OpenSpec for:**
- New engines (ghl-engine, calendar-engine)
- New runtime concepts (new ownership modes, new suppression modes)
- New provider adapters (GHL adapter, WhatsApp adapter)
- Engine contract changes (new actions, new invariants)
- Cross-cutting governance changes (event model, orchestration model)

**Do NOT use OpenSpec for:**
- Bug fixes in existing engines
- Test additions
- Minor refactors (rename, extract function)
- Vertical-specific prompt tuning
- Config changes (adding a handoff rule)

## Directory Structure

```
openspec/
├── README.md                          ← This file
│
├── templates/                          ← Reusable spec templates
│   ├── proposal-template.md
│   ├── design-template.md
│   ├── tasks-template.md
│   └── engine-spec-template.md
│
├── governance/                         ← Algorithmus runtime concepts
│   ├── engine-governance.md            ← Engine contract, constraints
│   ├── runtime-semantics.md            ← Lifecycle, transitions, failure modes
│   ├── event-model.md                  ← DomainEvent, correlation, causation
│   ├── ownership-model.md              ← AI/HUMAN/SHARED/LOCKED
│   └── orchestration-model.md          ← Workflow execution, state resolution
│
├── conventions/                        ← Naming and style conventions
│   ├── naming-conventions.md           ← IDs, events, engines, workflows
│   ├── lifecycle-conventions.md        ← States, transitions, terminals
│   └── invariant-conventions.md        ← How to write invariants
│
└── changes/                            ← Active and archived change proposals
    ├── create-ghl-engine/              ← First formalized engine spec
    │   ├── proposal.md
    │   ├── design.md
    │   ├── tasks.md
    │   └── specs/
    └── archive/                        ← Completed changes
        └── YYYY-MM-DD-<change-name>/
```

## The OpenSpec Lifecycle

### Phase 1: Propose
Write `proposal.md` explaining **why** this change, what problem it solves, and what it does NOT solve.

### Phase 2: Design
Write `design.md` with architecture, entities, lifecycles, events, invariants, provider abstraction.

### Phase 3: Task
Write `tasks.md` with an incremental roadmap. Each phase is independently deliverable and testable.

### Phase 4: Spec
Write `specs/<engine-name>.md` with the formal specification: capabilities, invariants, events, error model, ownership integration.

### Phase 5: Implement
Implement the engine in `packages/engines/<engine-name>/` following the spec exactly.

### Phase 6: Archive
When implementation is complete and tested, move the change to `archive/YYYY-MM-DD-<name>/`.

## Core Principles

1. **Deterministic-first:** AI is a tool, not the runtime. All state transitions are rule-based.
2. **Provider-agnostic:** GHL, Chatwoot, WhatsApp are adapters — never the runtime model.
3. **Event-driven:** Every mutation emits a DomainEvent with correlation, causation, and actor identity.
4. **Ownership-aware:** Every engine respects AI/HUMAN/SHARED/LOCKED ownership.
5. **Invariant-mandatory:** Every spec defines what MUST always be true.

## Related

- [OpenSpec Original](https://github.com/Fission-AI/OpenSpec)
- `packages/shared/` — Canonical runtime contracts
- `workflows/extracted-patterns/` — Pattern library
- `verticals/dental/` — Sarah Dental vertical
