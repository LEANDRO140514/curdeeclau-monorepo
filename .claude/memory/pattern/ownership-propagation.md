# OWNERSHIP PROPAGATION

> Tipo: pattern
> Versión: 1.0.0 — Absorción Phase B1
> Creado: 2026-06-11
> Fuente legacy absorbida: `openspec/governance/ownership-model.md` (RT-1.5, supersedido como autoridad activa)
> Autoridad vigente: Constitución de Pekín, Principio V (Flujo Gobernado), Principio VIII (Autonomía Controlada)

---

## PROPÓSITO

Definir el modelo de ownership que gobierna quién controla una conversación y qué operaciones están permitidas en cada modo. El ownership es runtime governance — no un feature flag. Es una preocupación transversal que todo engine debe respetar.

---

## CONCEPTOS CLAVE

### Ownership — Quién controla

El ownership define el actor que tiene autoridad sobre una conversación en tiempo de ejecución. No es estático: cambia con handoffs, supresiones, recuperaciones y bloqueos legales.

### Propagation — Cómo se propaga

Cuando el ownership cambia, el evento `OwnershipChanged` se propaga a todos los engines que mantienen vistas locales de ownership. Solo handoff-engine escribe ownership; todos los demás leen.

### Gating — Puerta de acceso

Toda operación de engine pasa por un ownership gate que decide si la acción está permitida según el modo actual.

---

## MODOS DE OWNERSHIP

| Modo | Descripción | Caso de uso |
|------|-------------|-------------|
| `AI` | IA en control total | Default — operación conversacional normal |
| `HUMAN` | Operador humano tomó el control | Handoff aceptado — humano gestiona activamente |
| `SHARED` | IA y humano co-pilotean | IA sugiere respuestas, humano aprueba antes de enviar |
| `LOCKED` | Ownership congelado | Retención legal, modo auditoría, compliance freeze |

---

## TRANSICIONES DE OWNERSHIP

```
AI ──────────→ HUMAN    (handoff aceptado)
AI ──────────→ SHARED   (modo asistencia activado)
AI ──────────→ LOCKED   (bloqueo legal / compliance)

HUMAN ───────→ AI       (recuperación completada)
HUMAN ───────→ SHARED   (humano habilita asistencia)
HUMAN ───────→ LOCKED   (bloqueo legal)

SHARED ──────→ AI       (humano deshabilita asistencia)
SHARED ──────→ HUMAN    (humano toma control total)
SHARED ──────→ LOCKED   (bloqueo legal)

LOCKED ──────→ (sin transición — requiere unlock explícito)
```

### Reglas de Transición

| Transición | Disparador | Engine responsable |
|------------|------------|-------------------|
| `AI → HUMAN` | `handoff-engine.accept()` | handoff-engine |
| `HUMAN → AI` | `handoff-engine.recover()` | handoff-engine |
| `AI → SHARED` | Supresión `ASSIST_MODE` | handoff-engine |
| `SHARED/HUMAN/AI → LOCKED` | `setLocked()` explícito | handoff-engine |
| `LOCKED → *` | Unlock explícito con justificación de auditoría | handoff-engine |

### Transiciones Prohibidas

- `LOCKED → *` sin acción explícita de unlock
- `AI → AI` (no-op, rechazado)
- `* → *` sin emisión de `OwnershipChanged`

---

## MATRIZ DE PERMISOS

| Acción | AI | HUMAN | SHARED | LOCKED |
|--------|----|-------|--------|--------|
| Crear contacto | ✓ | ✓ | ✓ | ✗ |
| Actualizar contacto | ✓ | ✓ | ✓ | ✗ |
| Agregar/remover tags | ✓ | ✓ | ✓ | ✗ |
| Crear oportunidad | ✗ | ✓ | ✗¹ | ✗ |
| Mover oportunidad | ✗ | ✓ | ✗¹ | ✗ |
| Crear pipeline | ✗ | ✓ | ✗ | ✗ |
| Pausar/reanudar campaña | ✗ | ✓ | ✗¹ | ✗ |

¹ Permitido si `context.approvedBy` está presente (co-aprobación humana en modo SHARED)

---

## ACOPLAMIENTO OWNERSHIP ↔ SUPPRESSION

Ownership y supresión están acoplados. Cuando cambia el ownership, la supresión se actualiza automáticamente:

| Ownership | Supresión por defecto | Significado |
|-----------|----------------------|-------------|
| `AI` | `NONE` | IA opera libremente |
| `HUMAN` | `FULL_SUPPRESSION` | IA en silencio mientras el humano trabaja |
| `SHARED` | `ASSIST_MODE` | IA sugiere, no envía |
| `LOCKED` | `FULL_SUPPRESSION` | IA congelada, humano congelado |

El acoplamiento es automático vía handoff-engine. No se requiere acción separada.

---

## OWNERSHIP RECORD — Traza de Auditoría

Cada cambio de ownership produce un `OwnershipRecord` inmutable:

```typescript
interface OwnershipRecord {
  conversationId: string;
  owner: ConversationOwner;
  previousOwner?: ConversationOwner;
  changedAt: number;        // Unix ms
  changedBy?: string;       // userId o engineName
  reason?: string;          // Por qué cambió el ownership
}
```

---

## REGLAS DE GOBERNANZA (INVARIANTES)

1. **G1:** Ningún engine puede bypassear los ownership gates.
2. **G2:** Ownership `LOCKED` bloquea TODAS las escrituras en TODOS los engines.
3. **G3:** Toda transición de ownership emite evento `OwnershipChanged`.
4. **G4:** `OwnershipRecord` es inmutable — no se actualiza, no se borra.
5. **G5:** Ownership es por conversación, no por tenant.
6. **G6:** Solo handoff-engine escribe ownership. Los demás engines leen.

---

## RELACIÓN CON INSTITUCIONES DE PEKÍN

| Institución | Relación |
|-------------|----------|
| **El Cauce** | El ownership es una compuerta de flujo. `OwnershipChanged` es parte del catálogo de eventos. |
| **El Senado** | Decide escalaciones que implican cambio de ownership (AI → HUMAN). |
| **La Forja** | Implementa los ownership gates dentro de cada harness de engine. |
| **El Observatorio** | Monitorea cambios de ownership y detecta anomalías (ej. LOCKED sin justificación). |
| **La Cancillería** | Recibe handoffs pendientes de aceptación por humano. |
| **El Archivo** | Este patrón es parte del Archivo. Los OwnershipRecords son la traza de auditoría. |

---

## RELACIÓN CON LEGOS EXISTENTES

| Lego | Relación |
|------|----------|
| `packages/shared/src/runtime/Ownership.ts` | Tipos canónicos: `ConversationOwner`, `OwnershipRecord`, `OwnershipChangedPayload`, validadores |
| `packages/engines/handoff-engine/` | Único escritor de ownership. Implementa `accept()`, `recover()`, `setLocked()`, `OwnershipManager` |
| `packages/engines/crm-engine/` | Consumidor de ownership. Gatea operaciones CRM según matriz de permisos |
| `packages/engines/calendar-engine/` | Consumidor de ownership. Gatea operaciones de agenda según ownership |
| `packages/engines/workflow-orchestrator/` | Propaga eventos `OwnershipChanged` a todos los engines |

---

## EVIDENCIA DE PATRÓN (RT-4 CLOSURE)

Este patrón está validado por la implementación RT-4 (cerrada 2026-05-29):

- **69/69 tests** pasan en los 4 motores RT-4 (handoff, CRM, calendar, messageBuffer)
- **0 regresiones** en motores no-RT-4
- **typecheck + build** limpios en todo el monorepo
- Ownership propagation implementado vía `OwnershipChanged` → orchestrator dispatch → vistas locales en CRM y Calendar
- Constructor allocation-only (#34), execute() gated on READY (#36), STOPPED terminal (#39)

---

## PENDIENTES / PREGUNTAS ABIERTAS

- [ ] **E-1 (Post RT-4):** Gatear métodos directos de HandoffEngine (`evaluate`, `accept`, `reject`, `recover`, `close`) — actualmente bypassean el lifecycle
- [ ] **E-2 (Post RT-4):** Unificar el estado dual de ownership (`ownershipView` + `OwnershipManager.states`) en handoff-engine
- [ ] **E-4 (Post RT-4):** Historial completo de auditoría de `OwnershipRecord` (I-O5 immutability)
- [ ] Verificar que media-delivery-engine y message-buffer-engine no necesiten ownership gates (infraestructura de transporte, #35)
- [ ] Definir política de timeout para handoffs no aceptados (¿cuánto tiempo espera un HANDOFF antes de escalar?)

---

*Fin del Patrón Ownership Propagation v1.0.0*
*Absorbido de openspec/governance/ownership-model.md (RT-1.5, RT-4) bajo autoridad de la Constitución de Pekín*
