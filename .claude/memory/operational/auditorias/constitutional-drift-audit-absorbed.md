# CONSTITUTIONAL DRIFT AUDIT — ABSORBIDO

> Tipo: operational/auditorias
> Versión: 1.0.0 — Absorción Phase C
> Creado: 2026-06-11
> Fuente legacy absorbida: `docs/enforcement-readiness-assessment.md` (RT-1.5, supersedido como autoridad activa)
> Autoridad vigente: Constitución de Pekín, Principio V (Flujo Gobernado), Principio VII (Fallo Visible)

---

## PROPÓSITO

Preservar los hallazgos de cumplimiento constitucional RT-1.5 detectados en la auditoría pre-RT-2. Estos hallazgos documentan brechas entre la gobernanza declarada (RT-1.5) y la implementación real. Bajo Pekín, representan deuda técnica que El Senado debe evaluar y La Forja debe remediar.

---

## RESUMEN EJECUTIVO

Auditoría completada. Se detectaron **16 hallazgos** distribuidos en:

- **5 violaciones constitucionales críticas** (V-C1..V-C5) que bloquean integración de engines
- **7 violaciones operacionales** (V-O1..V-O7) que no bloquean pero requieren convergencia
- **4 observaciones arquitectónicas** (OBS-1..OBS-4)

Los 5 blockers críticos están concentrados en 3 packages: `handoff-engine`, `workflow-orchestrator`, `message-buffer-engine`.

---

## VIOLACIONES CONSTITUCIONALES CRÍTICAS (BLOQUEAN INTEGRACIÓN)

### V-C1: HandoffDomainEvent Parallel Universe ⚠️ CRÍTICO

| Campo | Valor |
|-------|-------|
| **Ubicación** | `handoff-engine/src/types.ts:124`, `handoff-engine/src/events/HandoffEvents.ts` |
| **Qué es** | Handoff engine define `HandoffDomainEvent` — tipo separado con su propio prefijo (`hdevt-`), factory (`makeEvent`), payload y canal de emisión (`config.emitFn`). Estructuralmente incompatible con `DomainEvent` canónico de `shared/` |
| **Campos faltantes** | `causationId`, `actorId`, `workspaceId`, `verticalId`, `tenantId`, `metadata` |
| **Canal de emisión** | Callback privado (`config.emitFn`), NO el `EventDispatcher` del platform |
| **Impacto** | Eventos de handoff NUNCA entran al bus de eventos. El orquestador nunca ve `OwnershipChanged`, `SuppressionActivated`, `HandoffRequested`. Ningún engine puede gatear sobre ownership |
| **Relación con Pekín** | Viola Principio V (Flujo Gobernado) — eventos no trazables, sin catálogo, sin dispatcher canónico |

### V-C2: Orchestrator Redefine Tipos Canónicos ⚠️ CRÍTICO

| Campo | Valor |
|-------|-------|
| **Ubicación** | `workflow-orchestrator/src/types.ts` |
| **Qué es** | Define localmente `DomainEvent`, `WorkflowContext`, `StepResult`, `StepStatus`, `StateMachine`, `StateDefinition`, `Engine` en lugar de importar de `@curdeeclau/shared` |
| **Tipos redefinidos** | 8 tipos. `DomainEvent` local pierde 5 campos. `WorkflowContext` usa `vertical: string` en vez de `verticalId`. Cero imports desde `shared/` |
| **Impacto** | El orquestador opera con forma de evento distinta a la de los engines que orquesta. Integración imposible sin field mapping por engine |
| **Relación con Pekín** | Viola Principio V (Flujo Gobernado) y Principio IV (Separación Principio-Herramienta) — el contrato canónico debe estar en un solo lugar |

### V-C3: Message Buffer Engine — Cero Emisión de Eventos ⚠️ CRÍTICO

| Campo | Valor |
|-------|-------|
| **Ubicación** | `message-buffer-engine/src/engine/MessageBufferEngine.ts` |
| **Qué es** | Transiciona `BUFFERING → READY_TO_FLUSH → FLUSHED` con CERO emisión de eventos. Sin `DomainEvent` import. Sin factory. Sin emitter. Sin `correlationId` |
| **Impacto** | `ConversationReadyToFlush` es el evento que enciende el runtime. Sin él, el orquestador nunca sabe que hay una conversación para procesar |
| **Relación con Pekín** | Viola Principio V (Flujo Gobernado) y Principio VII (Fallo Visible) — cambio de estado silencioso |

### V-C4: Provider Adapters Lanzan Excepciones ⚠️ CRÍTICO

| Campo | Valor |
|-------|-------|
| **Ubicación** | `InMemoryCRMProvider`, `InMemoryCalendarProvider` |
| **Qué es** | 25 throw sites en providers InMemory. `getContact()` lanza `Error` en vez de retornar `undefined`. `CRMEngine` no envuelve en try/catch |
| **Impacto** | Un `Contact not found` durante un workflow step crashea la ejecución. El orquestador espera errores estructurados, no excepciones |
| **Relación con Pekín** | Viola Principio VII (Fallo Visible) — el error no se estructura, no se registra, no se maneja |

### V-C5: Event ID No Conforme (Sistémico) ⚠️ ALTO

| Campo | Valor |
|-------|-------|
| **Ubicación** | 4 factories de eventos en shared, workflow-orchestrator, handoff-engine, crm-engine |
| **Qué es** | IDs usan `Date.now() + counter` en vez de ULID/UUIDv7. El factory del orquestador es el más peligroso: reinicio de proceso → counter a 0 → IDs duplicados |
| **Impacto** | Trazabilidad de eventos no confiable a través de reinicios. Colisiones posibles en multi-instancia |
| **Relación con Pekín** | Viola Principio VI (Decisión Informada) — sin IDs únicos no hay trazabilidad confiable |

---

## VIOLACIONES OPERACIONALES (NO BLOQUEAN)

| ID | Descripción | Severidad | Impacto |
|----|-------------|-----------|---------|
| V-O1 | Handoff engine redefine `ConversationOwner`, `SuppressionMode`, `HandoffState` localmente | HIGH | Type fragmentation. No es blocker runtime |
| V-O2 | `OwnershipManager.transferOwnership()` tiene validación divergente de `isTransferAllowed()` canónico | HIGH | Backdoor: `setLocked()` bypassea `transferOwnership` |
| V-O3 | `CRMEngineContext` tiene index signature que debilita type-checking | MEDIUM | No es blocker runtime |
| V-O4 | `CalendarEventEmitter` aislado — eventos no llegan al platform dispatcher | MEDIUM | Eventos de calendario no disparan workflows |
| V-O5 | WorkflowOrchestrator lanza throw en bootstrap (no en step execution) | MEDIUM | Bootstrap throws menos peligrosos que runtime throws |
| V-O6 | GHL engine es stub — sin adapter, sin mapeo canónico | LOW | Sin efecto runtime |
| V-O7 | Message buffer no implementa contrato `Engine` | LOW | Capturado por V-C3 |

---

## OBSERVACIONES ARQUITECTÓNICAS

| ID | Observación |
|----|-------------|
| OBS-1 | Espectro de cumplimiento: CRM y Calendar engines son sustancialmente conformantes. Workflow Orchestrator y Handoff son parcialmente conformantes. Message Buffer, GHL y Media Delivery son no conformantes |
| OBS-2 | Higiene de imports cross-engine: LIMPIA. Ningún engine importa de otro engine. Separación generacional correcta |
| OBS-3 | Monolith isolation: `algorithmus-*` tiene cero referencias a `packages/engines/` o `packages/shared/`. Sistema autocontenido. Integración incremental posible |
| OBS-4 | Engine Contract Gap: `shared/` no define interfaz canónica `Engine`, `EventDispatcher`, ni `EventType` union. El contrato solo existe en `workflow-orchestrator/src/types.ts` — el mismo archivo que viola V-C2 |

---

## MAPA DE PRIORIDAD (REENCUADRE PEKÍN)

Bajo Pekín, las 5 violaciones V-C1..V-C5 ya no son "bloqueos RT-2" sino **deuda de gobernanza** que El Senado debe priorizar:

```
PRIORIDAD ALTA (La Forja debe remediar):
  V-C1: HandoffDomainEvent → DomainEvent canónico
  V-C2: Orchestrator importa de @curdeeclau/shared
  V-C3: Message buffer emite DomainEvents
  V-C4: Providers retornan errores estructurados
  V-C5: Event IDs usan ULID/UUIDv7

PRIORIDAD MEDIA (durante consolidación):
  V-O1: Handoff importa tipos de shared/
  V-O2: OwnershipManager usa isTransferAllowed canónico
  OBS-4: Interfaz Engine canónica en shared/

PRIORIDAD BAJA (post-consolidación):
  V-O3..V-O7: Alineación de contextos, emitters, throws, stubs
```

---

## RELACIÓN CON INSTITUCIONES DE PEKÍN

| Institución | Relación |
|-------------|----------|
| **La Forja** | Responsable de remediar V-C1..V-C5. Son problemas de harness: eventos no conformes, tipos redefinidos, throw en vez de structured error |
| **El Senado** | Debe priorizar cuáles violaciones remediar primero según riesgo operativo |
| **El Observatorio** | V-C3 y V-C4 son fallos silenciosos — el Observatorio no puede detectar lo que no se emite |
| **El Cauce** | V-C1 y V-C2 rompen el flujo gobernado. Sin eventos canónicos no hay catálogo, no hay trazabilidad |

---

## PENDIENTES / PREGUNTAS ABIERTAS

- [ ] ¿Cuál es la prioridad real de remediación bajo Pekín? El Senado debe decidir
- [ ] V-C5 (ULID) tiene implementación en `shared/src/events/uuid7.ts` — ¿por qué no se usa?
- [ ] OBS-4: ¿Dónde debe vivir la interfaz `Engine` canónica? ¿En `shared/src/runtime/`?
- [ ] Verificar si RT-1.6 drift closure plan (`docs/rt-1.6-constitutional-drift-closure.md`) ya contiene fixes detallados para V-C1..V-C5

---

*Fin del Constitutional Drift Audit Absorbido v1.0.0*
*Absorbido de docs/enforcement-readiness-assessment.md (RT-1.5) bajo autoridad de la Constitución de Pekín*
