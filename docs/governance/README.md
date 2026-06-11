---
ESTADO: SUPERSEDIDO COMO AUTORIDAD ACTIVA
Fecha: 2026-06-11
Supersedido por: .claude/memory/institutional/constitucion.md + .claude/memory/MEMORY.md
Motivo: Pekín Foundation establece la autoridad constitucional activa de CURDEECLAU. Este índice referencia documentos de gobernanza pre-Pekín. La autoridad institucional ahora reside en .claude/memory/. Los documentos referenciados aquí quedan como fuentes técnicas históricas.
Uso permitido: navegación histórica de documentos pre-Pekín, referencia cruzada con fuentes absorbidas por Pekín.
Uso prohibido: citarlo como índice de autoridad activa. El índice canónico es .claude/memory/MEMORY.md.
---

# CURDEECLAU — Governance Index

> Última actualización: 2026-05-30

## Documentos de gobernanza

| Documento | Propósito |
|---|---|
| [`canonical-definitions.md`](canonical-definitions.md) | Definiciones canónicas de Foundation, Runtime, Engine, Provider, App, Vertical, Config, Agent, Workflow |
| [`../architecture/canonical-topology.md`](../architecture/canonical-topology.md) | Topología objetivo del monorepo |
| [`../architecture/runtime-topology-report.md`](../architecture/runtime-topology-report.md) | Mapa completo del runtime actual |
| [`../architecture/leakage-audit.md`](../architecture/leakage-audit.md) | Provider leakage, vertical leakage, orchestration overlap |
| [`../architecture/migration-roadmap.md`](../architecture/migration-roadmap.md) | Fases RT-1 a RT-4 |
| [`../architecture/renaming-proposal.md`](../architecture/renaming-proposal.md) | Propuestas de renaming |
| [`../openspec/monorepo-alignment.md`](../openspec/monorepo-alignment.md) | Alineación arquitectura vs implementación |

## OpenSpec governance

| Documento | Propósito |
|---|---|
| [`../../openspec/governance/rt-constitution.md`](../../openspec/governance/rt-constitution.md) | Constitución del runtime |
| [`../../openspec/governance/engine-governance.md`](../../openspec/governance/engine-governance.md) | Reglas de creación de engines |
| [`../../openspec/governance/event-model.md`](../../openspec/governance/event-model.md) | Modelo canónico de eventos |
| [`../../openspec/governance/ownership-model.md`](../../openspec/governance/ownership-model.md) | RT-4: modelo de ownership |
| [`../../openspec/governance/orchestration-model.md`](../../openspec/governance/orchestration-model.md) | Modelo de orquestación |
| [`../../openspec/conventions/naming-conventions.md`](../../openspec/conventions/naming-conventions.md) | Convenciones de nomenclatura |
| [`../../openspec/conventions/lifecycle-conventions.md`](../../openspec/conventions/lifecycle-conventions.md) | Convenciones de ciclo de vida |

## Taxonomía

```
FOUNDATION  →  shared/
RUNTIME     →  workflow-orchestrator/, algorithmus-core-engine/
ENGINE      →  crm-engine/, calendar-engine/, handoff-engine/,
               message-buffer-engine/, knowledge-engine/
PROVIDER    →  InMemoryCRMProvider, PostgresCRMProvider, GHLClient,
               TelegramProvider, YCloudClient, PineconeRAGAdapter
APP         →  apps/*
VERTICAL    →  verticals/<name>/
CONFIG      →  *.json, .env, tsconfig.json, .cursor/rules/
AGENT       →  systemPrompt + tools + model + policy
WORKFLOW    →  WorkflowDefinition (secuencia declarativa de pasos)
```
