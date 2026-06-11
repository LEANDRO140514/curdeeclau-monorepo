# FSM AUTHORITY

> Tipo: pattern
> Versión: 1.0.0 — Absorción Phase D
> Creado: 2026-06-11
> Fuente legacy absorbida: `openspec/conventions/lifecycle-conventions.md` (RT-1.5, supersedido como autoridad activa)
> Autoridad vigente: Constitución de Pekín, Principio V (Flujo Gobernado), Principio VIII (Autonomía Controlada)

---

## PROPÓSITO

Definir la autoridad de las Finite State Machines en CURDEECLAU: cómo se nombran los estados, qué tipos de lifecycle existen, qué transiciones son válidas, y cómo se modela la recuperación desde estados terminales.

La FSM es la única fuente de verdad de estado en todo el runtime. Ni la IA, ni el orchestrator, ni ningún engine pueden decidir estado fuera de una FSM declarada.

---

## CONCEPTOS CLAVE

### FSM como autoridad

Una FSM no es una sugerencia. No es documentación. Es la ley de ejecución: si una transición no está declarada en la FSM, no puede ocurrir.

### Terminal como irreversible (sin recovery explícito)

Un estado terminal significa que no hay transiciones automáticas hacia adelante. Solo acciones explícitas de recovery pueden sacar a una entidad de un estado terminal.

---

## TIPOS DE LIFECYCLE

### Linear — Sin ramas

Estados proceden en orden fijo:
```
A → B → C → D (terminal)
```
Ejemplo: Message Buffer — `IDLE → BUFFERING → READY_TO_FLUSH → FLUSHED`

### Branching — Múltiples caminos

```
        ┌→ B → D (terminal)
A →     │
        └→ C → E (terminal)
```
Ejemplo: Opportunity — `open → won | lost | abandoned`

### Reversible — Adelante y atrás

```
A ⇄ B ⇄ C → D (terminal)
```
Ejemplo: Ownership — `AI ⇄ HUMAN ⇄ SHARED` (LOCKED es terminal)

### Cyclic — Retorna al inicio

```
A → B → C → A
```
Ejemplo: Conversation — `idle → classifying → routing → responding → idle`

---

## CONVENCIÓN DE NOMBRES DE ESTADO

| Tipo de Estado | Patrón | Ejemplos |
|---------------|--------|----------|
| **Initial** | Descriptivo | `idle`, `draft`, `AI_ACTIVE` |
| **Transient** | Presente continuo / pending | `buffering`, `classifying`, `HANDOFF_PENDING` |
| **Active** | Descriptivo | `HUMAN_ACTIVE`, `active`, `responding` |
| **Terminal** | Pasado / final | `won`, `lost`, `HANDOFF_CLOSED`, `completed` |
| **Recovery** | `*_RECOVERY_*` o `*_RESTORED` | `AI_RECOVERY_PENDING`, `AI_RESTORED` |

---

## ESTADOS TERMINALES POR ENTIDAD

| Entidad | Estados Terminales |
|---------|-------------------|
| Opportunity | `won`, `lost`, `abandoned` |
| Campaign | `archived` |
| Handoff | `HANDOFF_CLOSED` |
| Ownership | `LOCKED` (requiere unlock explícito) |
| Workflow Execution | `WorkflowCompleted`, `WorkflowFailed` |

### Reglas de Estado Terminal

1. Estados terminales DEBEN estar documentados en la spec de la entidad
2. Transiciones DESDE estado terminal requieren acción explícita de recovery
3. Recovery desde terminal DEBE emitir un evento
4. Transiciones desde terminal NUNCA son automáticas

---

## ESTADOS DE RECOVERY

Recovery es el camino de regreso desde un error o estado terminal:

```
Terminal → Recovery Pending → Recovery Complete
```

Ejemplo:
```
HUMAN_ACTIVE → AI_RECOVERY_PENDING → AI_RESTORED
```

### Reglas de Recovery

1. Estados de recovery usan naming `*_RECOVERY_PENDING` o `*_RECOVERY_*`
2. Completación de recovery emite evento `*Recovered` o `*Restored`
3. Recovery DEBE restaurar ownership y supresión a estados válidos
4. Recovery fallido retorna al estado previo, no a un estado indefinido

---

## REGLAS DE CONVENCIÓN

1. Toda spec DEBE incluir un diagrama de lifecycle (ASCII)
2. Estados terminales DEBEN listarse explícitamente
3. Caminos de recovery DEBEN documentarse
4. Diagramas usan: `→` forward, `⇄` reversible, `└─` `├─` branches

---

## RELACIÓN CON INSTITUCIONES DE PEKÍN

| Institución | Relación |
|-------------|----------|
| **El Cauce** | Las FSMs son el mecanismo base del Flujo Gobernado. Cada transición es una compuerta |
| **La Forja** | Los harnesses implementan las FSMs como contratos de ejecución |
| **El Observatorio** | Cada transición de estado emite evento → observable, medible, alertable |
| **El Senado** | Interpreta estados terminales inesperados para decidir escalaciones |

---

## RELACIÓN CON PATRONES ABSORBIDOS

| Patrón | Relación |
|--------|----------|
| `pattern/runtime-semantics.md` | Define las 5 categorías de estado y reglas de transición |
| `pattern/workflow-orchestration.md` | StateResolver implementa FSM authority en el orquestador |
| `pattern/ownership-propagation.md` | Ownership lifecycle es un ejemplo canónico de lifecycle reversible |
| `pattern/engine-governance.md` | Todo engine debe declarar su state machine en la spec |

---

## PENDIENTES / PREGUNTAS ABIERTAS

- [ ] Formalizar `StateMachine` schema como tipo canónico en `shared/`
- [ ] ¿Deben las FSMs ser validables en tiempo de carga (JSON Schema)?
- [ ] ¿Existe un formato estándar para definir FSMs en specs de engine?

---

*Fin del Patrón FSM Authority v1.0.0*
*Absorbido de openspec/conventions/lifecycle-conventions.md (RT-1.5) bajo autoridad de la Constitución de Pekín*
