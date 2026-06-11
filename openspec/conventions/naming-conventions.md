---
ESTADO: SUPERSEDIDO COMO AUTORIDAD ACTIVA
Fecha: 2026-06-11
Supersedido por: .claude/memory/institutional/constitucion.md
Motivo: Pekín Foundation establece la autoridad constitucional activa de CURDEECLAU. Estas convenciones de nomenclatura (ID prefixes, entity naming) son Nivel 2 (Governance) bajo Pekín, no reglas constitucionales autónomas. Su contenido técnico permanece válido como convención de ingeniería.
Uso permitido: referencia técnica para patrones de nomenclatura de entidades, IDs y eventos.
Uso prohibido: citarlo como autoridad constitucional o estándar que no pueda ser modificado por gobernanza Pekín.
---

# Naming Conventions

## Core Principle

> **Names are contracts. A consistent naming scheme makes the platform navigable by both humans and AI.**

## Entity ID Prefixes

All canonical entity IDs follow the pattern: `<3-4 char prefix>_<ULID>`.

| Prefix | Entity | Example |
|---|---|---|
| `cnt_` | Contact | `cnt_01JX2K5N8P3Q7R0A` |
| `opp_` | Opportunity | `opp_01JXGM9V4W2B5E8S` |
| `pip_` | Pipeline | `pip_01JXGK7M4R1T6Y3D` |
| `cmp_` | Campaign | `cmp_01JXHP8N3S6W9A2F` |
| `evt_` | Event | `evt_01JXMQ7P2C4D8G5H` |
| `wfl_` | Workflow | `wfl_01JXKR6L1V9E4N7B` |
| `exec_` | Execution | `exec_01JXLV5T0B3S8M2J` |
| `conv_` | Conversation | `conv_01JXNW4R9A7F1K6C` |
| `msg_` | Message | `msg_01JXPV3Q8D2G0L5A` |
| `usr_` | User | `usr_01JXQU2P7C6H9N4E` |
| `tnt_` | Tenant | `tnt_01JXRT1O6B5M8V3D` |
| `wsp_` | Workspace | `wsp_01JXSS0N5A4L7U2C` |
| `vrt_` | Vertical | `vrt_01JXTR9M4K3T6Y1B` |

### ID Rules

1. Prefixes are lowercase, exactly 3-4 characters
2. Underscore separates prefix from ULID body
3. ULID body is case-insensitive alphanumeric, 26 characters
4. IDs are immutable after creation
5. `providerIds` map external IDs — the canonical ID NEVER contains provider data

## Engine Naming

| Convention | Example |
|---|---|
| Package name | `@curdeeclau/<domain>-engine` |
| Directory | `packages/engines/<domain>-engine/` |
| Engine class | `PascalCase` + `Engine`: `MessageBufferEngine`, `HandoffEngine`, `GhlEngine` |
| `engineName` property | `kebab-case`: `"message-buffer-engine"`, `"handoff-engine"`, `"ghl-engine"` |

## Event Naming

| Convention | Example |
|---|---|
| Type string | `PascalCase`, past tense: `"ContactCreated"`, `"OpportunityMoved"` |
| Domain prefix implicit | `"HandoffRequested"` (not `"HandoffEngineHandoffRequested"`) |
| Lifecycle events | `*Started`, `*Completed`, `*Failed` |
| Mutation events | `*Created`, `*Updated`, `*Moved`, `*Paused`, `*Resumed` |

## Workflow Naming

| Convention | Example |
|---|---|
| Workflow ID | `wfl-<kebab-case>`: `wfl-new-patient`, `wfl-emergency-triage` |
| Step ID | `step-<kebab-case>`: `step-create-contact`, `step-move-opportunity` |
| State names | `snake_case`: `idle`, `buffering`, `handoff_pending` |

## File Naming

| Convention | Example |
|---|---|
| Engine source | `src/engine/<PascalCase>Engine.ts` |
| Managers | `src/<domain>/<PascalCase>Manager.ts` |
| Tests | `src/tests/<kebab-case>.test.ts` |
| Types | `src/types.ts` (single file per package) |
| Index | `src/index.ts` (barrel export) |

## Vertical Naming

| Convention | Example |
|---|---|
| Vertical ID | `kebab-case`: `dental`, `academic` |
| Agent name | `PascalCase`: `Sarah`, `EVA` |
| Vertical directory | `verticals/<vertical-id>/` |
