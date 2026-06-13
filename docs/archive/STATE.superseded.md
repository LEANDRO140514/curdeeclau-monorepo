# 🎛️ CURDEECLAU MONOREPO — GENERAL RUNTIME STATE

## 🧠 LÍMITES DE MEMORIA DE CORTO PLAZO (AGENCY BUFFER)

- **Regla de Retención:** Operar bajo el modelo de optimización de contexto de 2 batches y 15 observaciones máximo.
- **Foco de Atención:** Priorizar el estado inmediato de los últimos commits de arquitectura distribuida y el inventario analizado de `openspec/`.

## 📖 GOBERNANZA OPENSPEC — CONSTITUCIÓN RT-1.5

- **Jerarquía de Autoridad:** Constitución RT-1.5 > OpenSpec Governance > Engine Specs > `shared/` > engines.
- **Cadena Algorithmus:** Blueprint → Pattern → Canonical Contracts → OpenSpec → Engine → Provider Adapter → Vertical.
- **Principios Core Obligatorios:**
  1. **Deterministic-first:** Las transiciones de estado se rigen por reglas. La IA enriquece contexto; nunca decide routing.
  2. **Provider-agnostic:** Plataformas externas (GHL, Chatwoot, WhatsApp, Google Calendar) son adapters, nunca el modelo de runtime.
  3. **Event-driven:** Cada mutación emite un `DomainEvent` canónico con `correlationId`, `causationId` y `actorId`.
  4. **Ownership-aware:** Todo engine respeta los modos `AI` / `HUMAN` / `SHARED` / `LOCKED`. Solo `handoff-engine` muta ownership.
  5. **Ownership-propagation-scoped (#35):** Ownership propagation aplica exclusivamente a engines que son conversational authority participants. Engines de infraestructura de transporte (transporte de ingesta, buffering, deduplicación) no mantienen ownership views ni participan en ownership propagation.
  6. **Invariant-mandatory:** Toda spec define invariantes con `MUST` / `MUST NOT` verificables.
- **Restricciones Técnicas Transversales:**
  - Motores retornan `{ error, message }`; nunca lanzan excepciones.
  - IDs de provider en `metadata.providerId`; nunca como clave primaria canónica.
  - Comunicación cross-engine solo vía orchestrator + `DomainEvent`.
  - `shared/` no importa de engines, providers ni verticals.
  - **Authority post-start (#37):** Una vez que un engine alcanza READY, la autoridad de ownership se origina exclusivamente de `ownershipView` local + eventos `OwnershipChanged`. Ningún query path de ownership puede permanecer en `execute()`.
  - **Constitutional removal (#38):** Las migraciones constitucionales pueden eliminar APIs query-driven deprecadas cuando existe un reemplazo event-driven completo. No se requiere backward compatibility para authority paths constitucionalmente inválidos.

## 🧱 INFRAESTRUCTURA ACTUAL

### Apps (Fase 1)

| App                             | Estado                                           |
| ------------------------------- | ------------------------------------------------ |
| `dental-ai-receptionist`        | Estable — Recepcionista dental con IA            |
| `landing_oraculo_society_forge` | En desarrollo — Template Forge (submódulo dirty) |
| `quiniela-2026_deepclaude`      | Estable — Control de predicciones Liga MX        |
| `reducidas-2026`                | Estable — Filtros matemáticos Progol/Revancha    |
| `survivor-world-cup`            | Estable — Survivor World Cup                     |

### Packages Core

| Package                         | Rol                                                                                     | Estado         | RT-4      |
| ------------------------------- | --------------------------------------------------------------------------------------- | -------------- | --------- |
| `shared/`                       | Contratos canónicos (DomainEvent, Ownership, ExecutionContext, CRM, Calendar, Workflow) | Activo         | N/A       |
| `engines/calendar-engine`       | Coordinación temporal (reservas, disponibilidad, recordatorios)                         | **RT-4**       | ✅        |
| `engines/crm-engine`            | CRM provider-agnóstico                                                                  | **RT-4**       | ✅        |
| `engines/ghl-engine`            | CRM con adapter GHL                                                                     | Spec/Implement | —         |
| `engines/handoff-engine`        | Ownership, supresión, recuperación AI↔Humano                                            | **RT-4**       | ✅        |
| `engines/media-delivery-engine` | Entrega de medios                                                                       | Activo         | —         |
| `engines/message-buffer-engine` | Buffer de mensajes                                                                      | **RT-4**       | ✅        |
| `engines/workflow-orchestrator` | Orquestación central de workflows                                                       | Activo         | —         |
| `knowledge-engine/`             | RAG, retrieval, memory windows, confidence scoring                                      | Design         | —         |
| `algorithmus/`                  | Algoritmos y plataforma                                                                 | Activo         | —         |
| `math-engine/`                  | Motor matemático (Python, fuera de pnpm workspace)                                      | Activo         | —         |

### OpenSpec Change Proposals Activas

| Change                    | Fase OpenSpec    | Entidades Canónicas                                      | Invariantes |
| ------------------------- | ---------------- | -------------------------------------------------------- | ----------- |
| `create-ghl-engine`       | Spec / Implement | 4 (Contact, Opportunity, Pipeline, Campaign)             | 22          |
| `create-calendar-engine`  | Spec             | 4 (Calendar, TimeSlot, Reservation, Reminder)            | 30          |
| `create-knowledge-engine` | Design           | 6 (Source, Document, Chunk, Query, Result, MemoryWindow) | 25          |

## ✅ RT-4 — OWNERSHIP PROPAGATION RUNTIME (CERRADO)

**Estado:** CLOSED  
**Fecha de cierre:** 2026-05-29  
**Rama:** `main`  
**Tag recomendado:** `rt-4-closure`

### Objetivo

Establecer la infraestructura de propagación de ownership event-driven en todo el runtime. Cada engine que participa en autoridad conversacional mantiene una vista local-autoritativa de ownership, poblada exclusivamente por eventos `OwnershipChanged`. Ningún query path de ownership permanece en el hot path de `execute()`.

### Capacidades Entregadas

| Capacidad | Motores | Descripción |
|-----------|---------|-------------|
| **Engine Lifecycle** | Los 4 motores RT-4 | `UNINITIALIZED → READY → STOPPED`. Constructor allocation-only (#34). `execute()` gated on READY (#36). STOPPED terminal (#39). |
| **Ownership View Local** | CRM, Calendar | `ownershipView: Map<string, ConversationOwner>` poblado vía `handleOwnershipChanged()`. Fuente local-autoritativa, sin query externo en `execute()` (#37). |
| **Ownership Authority** | Handoff | `set_ownership` y `get_ownership`. Único escritor de ownership (I-O2). Validación vía `validateOwnershipTransition()`. Secuencia monotónica por conversación (#16). |
| **OwnershipChanged Emission** | Handoff | Evento con payload RT-4 completo: `owner`, `previousOwner`, `sequence`, `cause`, `changedAt`, `initiatedBy`, `reason`. |
| **Ownership Propagation Chain** | Handoff → CRM/Calendar | HandoffEngine emite `OwnershipChanged` → orchestrator dispatch → CRM/Calendar `handleOwnershipChanged()` → vistas locales actualizadas. |
| **Single Admission Path** | Calendar | OwnershipGuard como ÚNICO gate para toda acción en `execute()` (#40). `check_availability` pasa explícitamente por el guard, no lo bypassa. |
| **Query-Driven Removal** | CRM, Calendar | `ownershipResolver` callback eliminado. Constructor ya no acepta resolvers externos (#38). |
| **Ownership Propagation Scoping** | MessageBuffer | Excluido de ownership propagation por ser infraestructura de transporte (#35). Sin `ownershipView`, sin `handleOwnershipChanged()`. |
| **Restrictive Default** | Todos | Owner default `'AI'` (constitutional default). Previo default `'HUMAN'` era permisivo e inseguro. |

### Observaciones Constitucionales Cumplidas

`#33` Augment not redesign · `#34` Constructors allocation-only · `#35` OwnershipPropagation scoped · `#36` Lifecycle operational · `#37` No query path post-start · `#38` Invalid paths removable · `#39` STOPPED terminal · `#40` Single admission path

### Deferred Items (Post RT-4)

| ID | Item | Prioridad | Motor |
|----|------|-----------|-------|
| E-1 | Gate HandoffEngine direct methods (`evaluate`/`accept`/`reject`/`recover`/`close` bypass lifecycle) | Alta | Handoff |
| E-2 | Unify HandoffEngine dual ownership (`ownershipView` + `OwnershipManager.states`) | Alta | Handoff |
| E-3 | Suppression coupling auto-derivation per §7.4 | Media | Handoff |
| E-4 | `OwnershipRecord` audit trail history (I-O5 immutability) | Media | Handoff |
| E-5 | Handoff workflow → `set_ownership` integration (accept → set_ownership internally) | Media | Handoff |
| E-6 | `OwnershipChanged` event factory convergence (old HandoffEvents vs RT-4 inline) | Media | Handoff |
| E-7 | `RuntimeLifecycle` integration (orchestrator-level aggregation) | Baja | Orchestrator |
| E-8 | `INITIALIZING` state for async setup engines | Baja | Todos |
| E-9 | `FAILED` state for unrecoverable errors | Baja | Todos |

### Pruebas

- **69/69 tests** pasan en los 4 motores RT-4
- **0 regresiones** en motores no-RT-4
- **typecheck + build** limpios en todo el monorepo

---

## 🔴 DRIFT CATALOG — CONVERGENCIA PENDIENTE (RT-1.5)

Registro de divergencias entre la Constitución RT-1.5 y la implementación actual. Gobernanza manda; el código converge.

| ID        | Ubicación                                         | Divergencia                                                                                       | Severidad |
| --------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------- |
| **D-001** | `workflow-orchestrator/src/types.ts`              | Redefine `DomainEvent` sin `causationId`, `actorId`, `verticalId`, `workspaceId`, `metadata`      | Crítica   |
| **D-002** | `workflow-orchestrator/src/types.ts`              | Redefine `WorkflowContext`, `StepResult`, `StepStatus` en lugar de importar de `shared/`          | Crítica   |
| **D-003** | `workflow-orchestrator/src/events/DomainEvent.ts` | Event ID usa contador monotónico, no ULID/UUIDv7 (viola I-E6)                                     | Alta      |
| **D-004** | `handoff-engine/src/types.ts`                     | Define `HandoffDomainEvent` como universo paralelo de eventos sin extender `DomainEvent` canónico | Alta      |
| **D-005** | `ghl-engine/src/types.ts`                         | Exporta entidades con forma GHL (`GHLContact`, `GHLOpportunity`) sin mapeo canónico               | Alta      |
| **D-006** | `ghl-engine/`                                     | Sin adapter implementando `CRMProvider` interface de `crm-engine`                                 | Alta      |
| **D-007** | `crm-engine/src/types.ts`                         | Define `CRMEngineContext` divergente de `ExecutionContext` en `shared/`                           | Media     | RT-4 completado; divergencia de tipos persiste |
| **D-008** | `handoff-engine/`                                 | Sin carpeta OpenSpec (gobierna ownership/suppression/recovery — conceptos runtime críticos)       | Media     | RT-4: ownership authority implementado; supresión/recovery sin spec formal |
| **D-009** | `workflow-orchestrator/`                          | Sin carpeta OpenSpec                                                                              | Media     | Sin cambios en RT-4 |
| **D-010** | `math-engine/`                                    | Proyecto Python fuera del workspace pnpm; sin integración con contratos `shared/`                 | Baja      |

## 🚀 HOJA DE RUTA Y ESCALABILIDAD FUTURA

- [x] **RT-4: Ownership Propagation Runtime** — CLOSED 2026-05-29. Lifecycle + ownership propagation en 4 motores. Tag: `rt-4-closure`.
- [ ] **E-1 + E-2 (Post RT-4):** Gate HandoffEngine direct methods + unify dual ownership state.
- [ ] Resolver drift crítico D-001..D-006 para converger con RT-1.5.
- [ ] Completar ciclo OpenSpec de las 3 change proposals activas (Spec → Implement → Archive).
- [ ] Implementar adapters de infraestructura siguiendo el flujo: InMemory → Provider Adapter → Postgres.
- [ ] Refinar `EventCatalog` gobernado y capacidades del `WorkflowOrchestrator`.
- [ ] Desplegar interfaces PWA modulares adheridas a `runtime-semantics.md`.
- [ ] Integrar `math-engine` al workspace pnpm con contratos `shared/`.
- [ ] Nuevas apps/engines solo mediante OpenSpec proposal con invariantes verificables.

## 🛠️ PIPELINE DE VERIFICACIÓN GLOBAL

- **Entorno de Workspaces:** pnpm workspaces (Node >=20)
- **Comando de Validación Ecosistémica:** `pnpm build` desde raíz para validar tipos de exportaciones canónicas hacia todo el ecosistema.
