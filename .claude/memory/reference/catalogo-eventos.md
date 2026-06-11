# CATÁLOGO DE EVENTOS

> Tipo: reference
> Versión: 1.0.0 — Absorción Phase B1
> Creado: 2026-06-11
> Fuente legacy absorbida: `openspec/governance/event-model.md` (RT-1.5, supersedido como autoridad activa)
> Autoridad vigente: Constitución de Pekín, Principio V (Flujo Gobernado), Principio VI (Decisión Informada)

---

## PROPÓSITO

Definir el modelo canónico de eventos de CURDEECLAU: estructura, causalidad, catálogo, reglas de emisión, dispatch y relación con mutaciones de estado.

Este catálogo es la fuente de verdad para todo evento que cruza sistemas en la civilización. Todo engine, provider y vertical debe declarar sus eventos aquí.

---

## CONCEPTOS CLAVE

### DomainEvent — La unidad universal de comunicación

Cada cambio de estado observable produce un `DomainEvent`. No hay mutación sin evento. No hay evento sin trazabilidad.

### Causalidad — correlationId + causationId

- `correlationId` une todos los eventos de un mismo flujo de ejecución (ej. una conversación completa)
- `causationId` señala el evento inmediato que causó este evento
- Eventos raíz no tienen `causationId`
- `correlationId` persiste a través de fronteras de engine

### Actor — actorId

Todo evento identifica quién o qué lo disparó: un usuario, un engine, el sistema. Nunca "unknown".

---

## ESTRUCTURA CANÓNICA DEL DomainEvent

```typescript
interface DomainEvent {
  id: string;              // "evt_<ulid>" — globalmente único, UUIDv7
  type: string;            // Discriminador (ej. "ContactCreated", "WorkflowStarted")
  timestamp: number;       // Unix ms — momento de ocurrencia

  // Scoping
  tenantId?: string;       // "tnt_<ulid>" — aislamiento de tenant
  workspaceId?: string;    // "wsp_<ulid>" — sub-agrupación
  verticalId?: string;     // "dental", "academic", etc.

  // Routing
  conversationId?: string; // "conv_<ulid>" — conversación a la que pertenece
  workflowId?: string;     // "wfl_<ulid>" — scope de ejecución de workflow

  // Causalidad
  correlationId?: string;  // Une eventos del mismo flujo causal
  causationId?: string;    // Apunta al evento que causó directamente este

  // Actor
  actorId?: string;        // Quién disparó esto (userId, engineName, "system")

  // Datos
  payload?: unknown;       // Datos específicos del evento
  metadata?: Record<string, unknown>;  // Extensible — provider traces, observabilidad
}
```

---

## CATÁLOGO DE EVENTOS

### Workflow (workflow-orchestrator)

| Evento | Descripción |
|--------|-------------|
| `WorkflowStarted` | Se inicia ejecución de workflow |
| `WorkflowStepExecuted` | Un paso del workflow se completó exitosamente |
| `WorkflowStepFailed` | Un paso del workflow falló |
| `WorkflowCompleted` | El workflow terminó exitosamente |
| `WorkflowFailed` | El workflow terminó con fallo |

### Handoff (handoff-engine)

| Evento | Descripción |
|--------|-------------|
| `HandoffRequested` | Se solicita transferencia a humano |
| `HandoffAccepted` | Humano acepta la transferencia |
| `HandoffRejected` | Humano rechaza la transferencia |
| `OwnershipChanged` | Cambió el ownership de una conversación |
| `SuppressionActivated` | Se activó supresión de IA |
| `AIRecoveryStarted` | Se inició recuperación de control por IA |
| `AIRecovered` | IA recuperó el control exitosamente |
| `HandoffClosed` | Se cerró el handoff |

### CRM (crm-engine / ghl-engine)

| Evento | Descripción |
|--------|-------------|
| `ContactCreated` | Se creó un contacto |
| `ContactUpdated` | Se actualizó un contacto |
| `OpportunityCreated` | Se creó una oportunidad |
| `OpportunityMoved` | Se movió una oportunidad de etapa |
| `TagAdded` | Se agregó un tag a un contacto |
| `TagRemoved` | Se removió un tag de un contacto |
| `PipelineCreated` | Se creó un pipeline |
| `CampaignCreated` | Se creó una campaña |
| `CampaignPaused` | Se pausó una campaña |
| `CampaignResumed` | Se reanudó una campaña |

### Messaging (message-buffer-engine)

| Evento | Descripción |
|--------|-------------|
| `MessageBuffered` | Un mensaje entró al buffer |
| `ConversationReadyToFlush` | El buffer alcanzó condición de flush |

### Calendar (calendar-engine)

| Evento | Descripción |
|--------|-------------|
| `SlotReserved` | Se reservó un slot de agenda |
| `SlotReleased` | Se liberó un slot |
| `AppointmentConfirmed` | Se confirmó una cita |
| `AppointmentCancelled` | Se canceló una cita |
| `ReminderScheduled` | Se programó un recordatorio |
| `ReminderTriggered` | Se disparó un recordatorio |
| `ReminderFailed` | Falló el envío de un recordatorio |
| `AvailabilityWindowUpdated` | Se actualizó la ventana de disponibilidad |

### Telegram (telegram-provider)

| Evento | Descripción |
|--------|-------------|
| `TelegramMessageReceived` | Se recibió un mensaje de Telegram |

### State (cualquier engine)

| Evento | Descripción |
|--------|-------------|
| `StateTransitioned` | Cambio genérico de estado (cualquier engine) |

---

## REGLAS DE EMISIÓN

1. Toda mutación que cambia estado observable DEBE emitir un `DomainEvent`.
2. Los eventos dentro de una ejecución de workflow DEBEN compartir el mismo `correlationId`.
3. Todo evento que es reacción directa a otro DEBE llevar `causationId`.
4. `actorId` DEBE identificar quién o qué disparó el evento. No se permite `"unknown"`.
5. Los eventos son INMUTABLES después de creados — no updates, no deletes.
6. Los IDs de evento DEBEN ser globalmente únicos (ULID o UUIDv7).
7. Datos específicos de provider pertenecen a `metadata`, NUNCA a la estructura de `payload`.

---

## DISPATCH DE EVENTOS

Los eventos fluyen a través de `EventDispatcher`:

```typescript
interface EventDispatcher {
  dispatch(event: DomainEvent): Promise<void>;
  on(eventType: string | '*', handler: EventHandler): void;
  off(eventType: string | '*', handler: EventHandler): void;
}
```

Handlers se registran para tipos específicos o usan `'*'` para todos los eventos.

---

## CONVENCIÓN DE NOMBRES

- Tiempo pasado, PascalCase: `ContactCreated`, `OpportunityMoved`, `HandoffRequested`
- Prefijo de engine implícito en el dominio: `CampaignPaused` (ghl-engine), `MessageBuffered` (message-buffer-engine)
- Sin duplicación: si dos engines pueden emitir eventos similares, comparten el mismo event type

---

## PROVIDER EVENTS → CANONICAL EVENTS

Eventos específicos de provider (GHL webhooks, WhatsApp callbacks) NUNCA se emiten directamente. El provider adapter los mapea a eventos canónicos:

```
GHL webhook: "contact.create"
  → GHLAdapter mapea a
    → DomainEvent { type: "ContactCreated", payload: { contact } }
```

Esto garantiza el desacoplamiento de provider en la capa de eventos (Principio IV: Separación de Principio y Herramienta).

---

## RELACIÓN CON INSTITUCIONES DE PEKÍN

| Institución | Relación |
|-------------|----------|
| **El Cauce** | Gobierna el catálogo de eventos. Todo evento debe estar registrado aquí. |
| **El Observatorio** | Consume eventos para detectar anomalías y generar métricas. |
| **El Senado** | Interpreta eventos para decidir acciones correctivas. |
| **La Forja** | Implementa el dispatch de eventos dentro de los harnesses. |
| **El Archivo** | Este catálogo es parte del Archivo. |

---

## RELACIÓN CON LEGOS EXISTENTES

| Lego | Relación |
|------|----------|
| `packages/shared/src/events/DomainEvent.ts` | Implementación canónica en TypeScript del `DomainEvent` y `createDomainEvent()` |
| `packages/shared/src/events/uuid7.ts` | Implementación de UUIDv7 para IDs de evento |
| `packages/shared/src/runtime/EventCatalog.ts` | Declaración del `RuntimeEventType` como union type |
| `packages/engines/workflow-orchestrator/` | Dispatcher y orquestación basada en eventos |

---

## PENDIENTES / PREGUNTAS ABIERTAS

- [ ] Sincronizar este catálogo con `packages/shared/src/runtime/EventCatalog.ts` — verificar que todos los eventos listados aquí tengan su correspondiente type en TypeScript
- [ ] Definir eventos para knowledge-engine (RAG retrieval, chunk indexing) cuando se active
- [ ] Definir eventos para media-delivery-engine (send, delivered, viewed, failed)
- [ ] Evaluar si `StateTransitioned` debe ser reemplazado por eventos específicos por engine

---

*Fin del Catálogo de Eventos v1.0.0*
*Absorbido de openspec/governance/event-model.md (RT-1.5) bajo autoridad de la Constitución de Pekín*
