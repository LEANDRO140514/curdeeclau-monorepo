# RT-1.6 DRIFT CLOSURE — REFERENCIA HISTÓRICA

> Tipo: reference
> Versión: 1.0.0 — Absorción Phase D
> Creado: 2026-06-11
> Fuente legacy absorbida: `docs/rt-1.6-constitutional-drift-closure.md` (RT-1.6, pre-RT-2 gate, supersedido como autoridad activa)
> Autoridad vigente: Constitución de Pekín, `operational/auditorias/constitutional-drift-audit-absorbed.md`, `operational/drift-catalog-absorbed.md`

---

## PROPÓSITO

Preservar el plan detallado de remediación RT-1.6 como antecedente histórico. RT-1.6 fue el último intento pre-Pekín de cerrar 5 violaciones constitucionales críticas (V-C1..V-C5) antes de la integración de engines (RT-2). Contiene parches mínimos, file-by-file, para handoff-engine, workflow-orchestrator, message-buffer-engine, crm-engine y shared/.

---

## RESUMEN EJECUTIVO

RT-1.6 fue diseñado como el gate final antes de RT-2 (Contract Consolidation). Doctrina: **minimal patch — no refactors, no renames, no moves.** Su objetivo era hacer el repo "constitutionally safe" para integrar engines.

Los 5 blockers y sus remediaciones:

| Blocker | Engine | Fix | Archivos |
|---------|--------|-----|----------|
| V-C1 | handoff-engine | HandoffDomainEvent → DomainEvent canónico | 5 |
| V-C2 | workflow-orchestrator | Importar tipos de shared/ en vez de redefinir | 7 |
| V-C3 | message-buffer-engine | Emitir DomainEvents en transiciones de estado | 3 |
| V-C4 | crm-engine + handoff | Providers retornan errores estructurados | 5 |
| V-C5 | shared/ + todos | UUIDv7 en vez de Date.now()+counter | 3 |

---

## ORDEN DE EJECUCIÓN RECOMENDADO (RT-1.6)

```
V-C5 (UUIDv7)           ← Sin dependencias. Primero.
    ↓
Shared/ additions       ← Sin dependencias. Segundo.
    ↓
V-C1 (Handoff events)   ← Depende de createDomainEvent de shared/
V-C2 (Orchestrator)     ← Depende de createDomainEvent + canonical types
V-C3 (Message buffer)   ← Depende de createDomainEvent de shared/
    ↓
V-C4 (Provider throws)  ← Independiente. Puede correr en paralelo.
```

---

## REMEDIACIONES DETALLADAS (PRESERVADAS COMO REFERENCIA)

### V-C1: HandoffDomainEvent → DomainEvent canónico

- **Archivos:** `handoff-engine/src/types.ts`, `HandoffEvents.ts`, `HandoffEngine.ts`, `package.json`
- **Estrategia:** Reescribir 8 event constructors para usar `createDomainEvent` de shared/. Eliminar `HandoffDomainEvent` interface y `HandoffEventType`. Importar `ConversationOwner` y `SuppressionMode` de shared/.
- **Riesgo:** MEDIUM — tests pueden requerir ajustes de assertion

### V-C2: Orchestrator importa de shared/

- **Archivos:** `workflow-orchestrator/src/types.ts`, `DomainEvent.ts`, `EventDispatcher.ts`, `WorkflowOrchestrator.ts`, `WorkflowExecutor.ts`, `package.json`
- **Estrategia:** Reemplazar definiciones locales de `DomainEvent`, `StepResult`, `StepStatus`, `StateMachine`, `StateDefinition`, `StateTransition` con imports de shared/. Extender `CanonicalWorkflowContext` en vez de redefinir. Eliminar `createEvent` local.
- **Riesgo:** MEDIUM-HIGH — `vertical` → `verticalId` rename toca múltiples archivos

### V-C3: Message buffer emite DomainEvents

- **Archivos:** `message-buffer-engine/src/types.ts`, `MessageBufferEngine.ts`, `package.json`
- **Estrategia:** Agregar `emitFn` al config. Emitir `MessageBuffered` en cada mensaje no duplicado. Emitir `ConversationReadyToFlush` en debounce expiry y max messages. Implementar contrato `Engine` (`engineName`, `execute()`).
- **Riesgo:** LOW — adiciones puras, sin cambios de comportamiento existente

### V-C4: Providers retornan errores estructurados

- **Archivos:** `HandoffEngine.ts`, `ContactManager.ts`, `OpportunityManager.ts`, `CampaignManager.ts`, `TagManager.ts`
- **Estrategia:** Reemplazar `throw new Error` en `HandoffEngine.execute()` con `{ error, message }`. Agregar try/catch en entity managers del CRM para convertir provider throws a `PROVIDER_UNAVAILABLE`.
- **Riesgo:** LOW — defense-in-depth. Los guards ya previenen la mayoría de throws

### V-C5: UUIDv7 para Event IDs

- **Archivos:** `shared/src/events/DomainEvent.ts`, nuevo `uuid7.ts`
- **Estrategia:** Implementar UUIDv7 inline (~20 líneas, sin dependencia externa). Actualizar `createDomainEvent` para usar `evt_${uuidv7()}`. V-C1 y V-C2 convergen a `createDomainEvent`.
- **Riesgo:** LOW — drop-in replacement

---

## SHARED/ ADDITIONS REQUERIDAS

Dos tipos que RT-1.6 identificó como faltantes en `shared/`:

1. **EventType union** — 28+ event types gobernados
2. **EventDispatcher interface** — `dispatch()`, `on()`, `off()`

---

## RT-2 GATE CHECK (COMANDOS DE VERIFICACIÓN)

```bash
# Ningún engine define su propio DomainEvent
grep -r "interface DomainEvent" packages/engines/ --include="*.ts"
# Expected: zero results

# Ningún engine lanza throw para business logic
grep -r "throw new Error" packages/engines/*/src/engine/ --include="*.ts"
# Expected: zero results

# Todos los engines importan de shared/
grep -r "@curdeeclau/shared" packages/engines/*/package.json --include="*.json"
# Expected: all engines have the dependency

# TypeScript compila limpio
pnpm -r exec tsc --noEmit
```

---

## RELACIÓN CON PEKÍN

RT-1.6 es un **antecedente histórico**, no un plan activo. Bajo Pekín:

- Las 5 violaciones V-C1..V-C5 están documentadas en `operational/auditorias/constitutional-drift-audit-absorbed.md`
- Los drifts D-001..D-004 (activos) corresponden a V-C1, V-C2, V-C3, V-C5
- La remediación ya no sigue el pipeline RT-1.5/OpenSpec — ahora es backlog de La Forja, priorizado por El Senado
- Los parches detallados en este documento son referencia técnica valiosa para cuando La Forja ejecute la remediación

---

## PENDIENTES / PREGUNTAS ABIERTAS

- [ ] ¿Ejecutó RT-1.6 algún parche antes de ser supersedido por Pekín?
- [ ] ¿El UUIDv7 en `shared/src/events/uuid7.ts` ya existe o es solo parte del plan?
- [ ] ¿Cuál es la prioridad real de remediación de V-C1..V-C5 bajo Pekín?

---

*Fin del RT-1.6 Drift Closure Historical Reference v1.0.0*
*Absorbido de docs/rt-1.6-constitutional-drift-closure.md (RT-1.6) bajo autoridad de la Constitución de Pekín*
