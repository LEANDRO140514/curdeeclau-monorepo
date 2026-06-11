# DRIFT CATALOG — ABSORBIDO

> Tipo: operational
> Versión: 1.0.0 — Absorción Phase C
> Creado: 2026-06-11
> Fuente legacy absorbida: `STATE.md` (RT-1.5, supersedido como autoridad activa)
> Autoridad vigente: Constitución de Pekín, Principio V (Flujo Gobernado)

---

## PROPÓSITO

Preservar el catálogo de divergencias D-001 a D-010 entre la Constitución RT-1.5 y la implementación real al momento del cierre RT-4 (2026-05-29). Bajo Pekín, estos drifts se reclasifican como **deuda técnica conocida** — no como violaciones constitucionales activas.

---

## RESUMEN

10 divergencias documentadas. 2 críticas, 4 altas, 2 medias, 1 baja al momento del cierre RT-4.

---

## CATÁLOGO COMPLETO

### D-001: Workflow Orchestrator redefine DomainEvent

| Campo | Valor |
|-------|-------|
| **Ubicación** | `workflow-orchestrator/src/types.ts` |
| **Divergencia** | Redefine `DomainEvent` sin `causationId`, `actorId`, `verticalId`, `workspaceId`, `metadata` |
| **Severidad original** | CRÍTICA |
| **Estado bajo Pekín** | **ACTIVO** — Coincide con V-C2 del drift audit. Debe remediarse. |
| **Relación con patrones** | `pattern/workflow-orchestration.md` define la forma canónica. `reference/catalogo-eventos.md` define el DomainEvent canónico. |

### D-002: Workflow Orchestrator redefine WorkflowContext

| Campo | Valor |
|-------|-------|
| **Ubicación** | `workflow-orchestrator/src/types.ts` |
| **Divergencia** | Redefine `WorkflowContext`, `StepResult`, `StepStatus` localmente en lugar de importar de `shared/` |
| **Severidad original** | CRÍTICA |
| **Estado bajo Pekín** | **ACTIVO** — Coincide con V-C2. Cero imports desde `shared/`. |
| **Relación con patrones** | `pattern/workflow-orchestration.md` — el orquestador debe consumir tipos canónicos |

### D-003: Event ID con contador monotónico

| Campo | Valor |
|-------|-------|
| **Ubicación** | `workflow-orchestrator/src/events/DomainEvent.ts` |
| **Divergencia** | Usa `evt-${Date.now()}-${++counter}` en vez de ULID/UUIDv7 |
| **Severidad original** | ALTA |
| **Estado bajo Pekín** | **ACTIVO** — Coincide con V-C5. `shared/src/events/uuid7.ts` ya tiene implementación UUIDv7 lista. |
| **Relación con patrones** | `reference/catalogo-eventos.md` § Invariantes: "IDs de evento DEBEN ser UUIDv7" |

### D-004: HandoffDomainEvent universo paralelo

| Campo | Valor |
|-------|-------|
| **Ubicación** | `handoff-engine/src/types.ts` |
| **Divergencia** | Define `HandoffDomainEvent` como universo paralelo sin extender `DomainEvent` canónico |
| **Severidad original** | ALTA |
| **Estado bajo Pekín** | **ACTIVO** — Coincide con V-C1. Los eventos de handoff no entran al bus. |
| **Relación con patrones** | `pattern/ownership-propagation.md` — el ownership change debe ser evento canónico |

### D-005: GHL entity types sin mapeo canónico

| Campo | Valor |
|-------|-------|
| **Ubicación** | `ghl-engine/src/types.ts` |
| **Divergencia** | Exporta entidades con forma GHL (`GHLContact`, `GHLOpportunity`) sin mapeo a entidades canónicas |
| **Severidad original** | ALTA |
| **Estado bajo Pekín** | **PENDIENTE DE VERIFICACIÓN** — GHL engine es stub (V-O6). Sin integración activa, el drift es teórico. |
| **Relación con La Aduana** | GHL debe ser naturalizado: provider interface → adapter → entidades canónicas |

### D-006: GHL engine sin adapter CRMProvider

| Campo | Valor |
|-------|-------|
| **Ubicación** | `ghl-engine/` |
| **Divergencia** | Sin adapter implementando `CRMProvider` interface de `crm-engine` |
| **Severidad original** | ALTA |
| **Estado bajo Pekín** | **DIFERIDO** — Sin integración GHL activa. Se activa cuando La Aduana naturalice GHL. |

### D-007: CRMEngineContext divergente de ExecutionContext

| Campo | Valor |
|-------|-------|
| **Ubicación** | `crm-engine/src/types.ts` |
| **Divergencia** | `CRMEngineContext` con index signature divergente de `ExecutionContext` en `shared/` |
| **Severidad original** | MEDIA |
| **Estado bajo Pekín** | **DIFERIDO** — RT-4 completado. La divergencia de tipos persiste pero no es blocker runtime. |
| **Relación con patrones** | `pattern/engine-governance.md` — engines deben usar contextos canónicos |

### D-008: Handoff-engine sin carpeta OpenSpec

| Campo | Valor |
|-------|-------|
| **Ubicación** | `handoff-engine/` |
| **Divergencia** | Sin carpeta OpenSpec formal. Gobierna ownership/suppression/recovery — conceptos runtime críticos — sin spec documentada. |
| **Severidad original** | MEDIA |
| **Estado bajo Pekín** | **SUPERSEDIDO** — RT-4 implementó ownership authority. El patrón está ahora en `pattern/ownership-propagation.md`. OpenSpec como proceso está supersedido por Pekín. |

### D-009: Workflow-orchestrator sin carpeta OpenSpec

| Campo | Valor |
|-------|-------|
| **Ubicación** | `workflow-orchestrator/` |
| **Divergencia** | Sin carpeta OpenSpec formal. Sin cambios en RT-4. |
| **Severidad original** | MEDIA |
| **Estado bajo Pekín** | **SUPERSEDIDO** — El patrón de orquestación está ahora en `pattern/workflow-orchestration.md`. OpenSpec como proceso está supersedido por Pekín. |

### D-010: Math engine Python fuera del workspace pnpm

| Campo | Valor |
|-------|-------|
| **Ubicación** | `packages/math-engine/` |
| **Divergencia** | Proyecto Python fuera del workspace pnpm. Sin integración con contratos `shared/`. |
| **Severidad original** | BAJA |
| **Estado bajo Pekín** | **PENDIENTE DE VERIFICACIÓN** — ¿Sigue siendo necesario? AP-1 (leakage audit) documenta que el math engine real está en la app quiniela (72 archivos TypeScript). |

---

## MATRIZ DE ESTADO

| ID | Severidad | Estado bajo Pekín |
|----|-----------|-------------------|
| D-001 | CRÍTICA | ACTIVO — requiere remediación |
| D-002 | CRÍTICA | ACTIVO — requiere remediación |
| D-003 | ALTA | ACTIVO — fix disponible (`uuid7.ts`) |
| D-004 | ALTA | ACTIVO — requiere remediación |
| D-005 | ALTA | PENDIENTE — sin integración GHL activa |
| D-006 | ALTA | DIFERIDO — sin integración GHL activa |
| D-007 | MEDIA | DIFERIDO — no es blocker runtime |
| D-008 | MEDIA | SUPERSEDIDO — absorbido en patrón Pekín |
| D-009 | MEDIA | SUPERSEDIDO — absorbido en patrón Pekín |
| D-010 | BAJA | PENDIENTE — verificar necesidad actual |

---

## RELACIÓN CON INSTITUCIONES DE PEKÍN

| Institución | Relación |
|-------------|----------|
| **El Senado** | Debe decidir prioridad de remediación para D-001..D-004 (activos) |
| **La Forja** | Responsable de ejecutar las remediaciones técnicas |
| **El Cauce** | D-001, D-002, D-004 afectan directamente el flujo gobernado — eventos no canónicos |
| **La Aduana** | D-005, D-006 son backlog de naturalización de GHL |

---

## PENDIENTES / PREGUNTAS ABIERTAS

- [ ] D-001..D-004: ¿Cuál es la prioridad real de remediación? El Senado debe decidir
- [ ] D-005, D-006: ¿Hay planes de integrar GHL? Si no, mantener diferido
- [ ] D-010: Verificar si `math-engine` Python sigue siendo necesario o si el motor TypeScript en quiniela lo supersede
- [ ] Cross-reference con RT-1.6 drift closure plan (`docs/rt-1.6-constitutional-drift-closure.md`) — contiene remediación detallada para D-001..D-004

---

*Fin del Drift Catalog Absorbido v1.0.0*
*Absorbido de STATE.md (RT-1.5) bajo autoridad de la Constitución de Pekín*
