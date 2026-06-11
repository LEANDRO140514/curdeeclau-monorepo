# RUNTIME SEMANTICS

> Tipo: pattern
> Versión: 1.0.0 — Absorción Phase B2
> Creado: 2026-06-11
> Fuente legacy absorbida: `openspec/governance/runtime-semantics.md` (RT-1.5, supersedido como autoridad activa)
> Autoridad vigente: Constitución de Pekín, Principio V (Flujo Gobernado), Principio VII (Fallo Visible), Principio VIII (Autonomía Controlada)

---

## PROPÓSITO

Definir la semántica de runtime que todo engine debe seguir: modelo de estados, transiciones, manejo de fallos, side effects permitidos y prohibidos, recuperación y orquestación determinista.

---

## CONCEPTOS CLAVE

### Deterministic-first

Mismos inputs → mismos outputs. Las transiciones de estado se rigen por reglas, no por probabilidad. La IA puede clasificar, sugerir o enriquecer — pero nunca decide transiciones de estado.

### Estado explícito y observable

Cada cambio de estado es validado, ejecutado, registrado (vía DomainEvent) y observable por todos los handlers registrados.

### Fallo visible

Los engines nunca lanzan excepciones para errores de negocio. Retornan resultados estructurados. Principio VII: el silencio operativo es el enemigo.

---

## MODELO DE TRANSICIÓN DE ESTADO

```
State(actual) + Event(disparador) → State(siguiente) + SideEffect(evento emitido)
```

Toda transición:
1. **Validada** — ¿está permitida desde el estado actual?
2. **Ejecutada** — el engine realiza la acción
3. **Registrada** — se emite `DomainEvent` con `correlationId` y `causationId`
4. **Observable** — el evento se despacha a todos los handlers

---

## CATEGORÍAS DE ESTADO

| Categoría | Descripción | Ejemplos |
|-----------|-------------|----------|
| **Initial** | Estado de partida | `idle`, `draft`, `AI_ACTIVE` |
| **Transient** | Temporal durante procesamiento | `buffering`, `HANDOFF_PENDING`, `AI_RECOVERY_PENDING` |
| **Active** | Operación normal | `HUMAN_ACTIVE`, `active` |
| **Terminal** | Sin transiciones (excepto recovery) | `won`, `lost`, `HANDOFF_CLOSED` |
| **Recovery** | Camino especial desde estados terminales o error | `AI_RESTORED` |

---

## REGLAS DE TRANSICIÓN

1. Initial → Transient: siempre permitido
2. Transient → Active: requiere completación exitosa
3. Active → Terminal: requiere acción explícita (win, lose, close)
4. Terminal → Active: requiere recovery explícito (no automático)
5. Any → LOCKED: requiere ownership freeze (legal/audit)

---

## MANEJO DE FALLOS

### Respuestas estructuradas (nunca excepciones)

```typescript
// Éxito
{ contact: CRMContact }

// Error
{ error: "ERROR_CODE", message: "Descripción legible" }
```

### Categorías de error

| Categoría | Ejemplos | Manejo |
|-----------|----------|--------|
| **Not Found** | `CONTACT_NOT_FOUND`, `PIPELINE_NOT_FOUND` | Retornar error, workflow retry o escala |
| **Invalid State** | `INVALID_STAGE_TRANSITION`, `CAMPAIGN_ARCHIVED` | Retornar error, workflow escala a humano |
| **Permission** | `OWNERSHIP_LOCKED`, `OWNERSHIP_INSUFFICIENT` | Retornar error, workflow espera cambio de ownership |
| **Provider** | `PROVIDER_UNAVAILABLE`, `PROVIDER_TIMEOUT` | Retornar error, workflow retry con backoff |
| **Validation** | `INVALID_STAGES`, `DUPLICATE_PROVIDER_ID` | Retornar error, workflow corrige input |

### Filosofía de retry

- Errores deterministas (invalid state, permission) → NUNCA reintentar
- Errores transitorios (provider unavailable, timeout) → Reintentar con backoff
- Máximo 3 reintentos, backoff exponencial (1s, 4s, 16s)
- Tras agotar reintentos: escalar a humano vía handoff-engine

---

## SIDE EFFECTS

### Permitidos

- Emitir `DomainEvent` vía dispatcher
- Actualizar estado in-memory (Maps)
- Llamar métodos de provider adapter
- Programar timers (debounce, auto-recovery)

### Prohibidos

- I/O directo a filesystem (usar abstracción de provider)
- HTTP calls directos (usar provider adapter)
- Modificar estado de otro engine directamente (pasar por orchestrator)
- Loggear datos sensibles (PII, secrets)

---

## SEMÁNTICA DE RECUPERACIÓN

### Caminos de recuperación

1. **AI → HUMAN → AI:** `handoff-engine.recover()`
2. **Error → Recovery:** workflow step retry o fallback
3. **Terminal → Active:** acción explícita de recuperación (ej. reopen opportunity)
4. **LOCKED → AI/HUMAN:** unlock explícito con aprobación (legal/audit)

### Invariantes de recuperación

- Recovery DEBE emitir eventos: `AIRecoveryStarted`, `AIRecovered`
- Recovery DEBE restaurar ownership a un estado válido
- Recovery DEBE desactivar supresión (retornar a `NONE`)
- Recovery NO DEBE revertir cambios de estado silenciosamente

---

## ORQUESTACIÓN DETERMINISTA

1. Mismos inputs → mismos outputs (engines son pure-ish)
2. Transiciones de estado basadas en reglas, no probabilísticas
3. IA puede clasificar, sugerir o enriquecer — nunca decide transiciones
4. Eventos son el **único** canal de side effects
5. Workflows son DAGs explícitos, no agentes autónomos en loop

---

## RELACIÓN CON INSTITUCIONES DE PEKÍN

| Institución | Relación |
|-------------|----------|
| **El Cauce** | Las transiciones de estado son el mecanismo base del Flujo Gobernado |
| **El Observatorio** | Cada transición emite evento → detectable, medible, alertable |
| **El Senado** | Interpreta estados terminales y errores para decidir escalaciones |
| **La Forja** | Implementa las reglas de transición dentro de cada harness de engine |
| **La Academia** | Extrae patrones de fallo de los errores estructurados |

---

## RELACIÓN CON LEGOS EXISTENTES

| Lego | Relación |
|------|----------|
| `packages/shared/src/runtime/EngineLifecycle.ts` | Implementa el lifecycle UNINITIALIZED→READY→STOPPED |
| `packages/shared/src/runtime/RuntimeLifecycle.ts` | `deriveRuntimeState()` — estado agregado del runtime |
| `packages/shared/src/runtime/ProviderError.ts` | Taxonomía de errores de provider |
| `packages/engines/handoff-engine/` | Implementa recovery AI↔HUMAN |
| `packages/engines/workflow-orchestrator/` | Ejecuta la orquestación determinista paso a paso |

---

## PENDIENTES / PREGUNTAS ABIERTAS

- [ ] Definir timeouts para estados transient (¿cuánto puede estar en HANDOFF_PENDING?)
- [ ] Estados FAILED e INITIALIZING pendientes de implementación (E-8, E-9 post RT-4)
- [ ] Evaluar si `StateTransitioned` genérico debe descomponerse en eventos específicos por engine
- [ ] Documentar semantic difference entre `STOPPED` (terminal lifecycle) y `LOCKED` (terminal ownership)

---

*Fin del Patrón Runtime Semantics v1.0.0*
*Absorbido de openspec/governance/runtime-semantics.md (RT-1.5) bajo autoridad de la Constitución de Pekín*
