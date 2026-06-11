# WORKFLOW ORCHESTRATION

> Tipo: pattern
> Versión: 1.0.0 — Absorción Phase B2
> Creado: 2026-06-11
> Fuente legacy absorbida: `openspec/governance/orchestration-model.md` (RT-1.5, supersedido como autoridad activa)
> Autoridad vigente: Constitución de Pekín, Principio V (Flujo Gobernado), Principio VIII (Autonomía Controlada)

---

## PROPÓSITO

Definir la arquitectura de orquestación de workflows en CURDEECLAU: cómo el WorkflowOrchestrator coordina engines, resuelve estados, despacha eventos y ejecuta workflows como DAGs deterministas.

---

## CONCEPTOS CLAVE

### Workflows como DAGs explícitos

Los workflows son grafos acíclicos dirigidos. Cada paso declara qué engine ejecuta qué acción. La IA enriquece contexto; el orquestador decide transiciones.

### Event-Driven

El orquestador reacciona a eventos. No hace polling. Cada evento puede disparar un workflow o avanzar un paso.

### State-Aware

El orquestador mantiene una state machine por workflow. Cada paso puede disparar una transición de estado. Las transiciones son validadas contra la definición de la máquina.

---

## ARQUITECTURA DEL WORKFLOW ORCHESTRATOR

```
┌──────────────────────────────────────────────┐
│            WorkflowOrchestrator               │
│                                               │
│  ┌─────────────┐  ┌───────────────────────┐  │
│  │EventDispatcher│  │   WorkflowRegistry    │  │
│  │ (pub/sub)    │  │   (workflow→steps)    │  │
│  └─────────────┘  └───────────────────────┘  │
│                                               │
│  ┌─────────────┐  ┌───────────────────────┐  │
│  │EngineRegistry│  │   WorkflowExecutor     │  │
│  │ (name→engine)│  │   (step-by-step)      │  │
│  └─────────────┘  └───────────────────────┘  │
│                                               │
│  ┌─────────────┐  ┌───────────────────────┐  │
│  │StateResolver │  │   Context Store        │  │
│  │ (FSM→next)  │  │   (execution→context)  │  │
│  └─────────────┘  └───────────────────────┘  │
└──────────────────────────────────────────────┘
```

| Componente | Responsabilidad |
|------------|----------------|
| **EventDispatcher** | Pub/sub de eventos. Handlers por tipo o wildcard `*` |
| **WorkflowRegistry** | Almacena definiciones de workflow por ID |
| **EngineRegistry** | Resuelve engines por nombre (`engineName`) |
| **WorkflowExecutor** | Itera pasos, llama engines, colecta resultados |
| **StateResolver** | Valida transiciones contra la state machine |
| **Context Store** | Mantiene contexto de ejecución entre pasos |

---

## EVENTOS DISPARADORES

| Evento | Acción del Orquestador |
|--------|----------------------|
| `ConversationReadyToFlush` | Ejecuta `wf-handle-messages` |
| `HandoffRequested` | Ejecuta `wf-handoff` |
| `ContactCreated` | Siguiente paso en pipeline workflow |
| `OpportunityMoved` | Acción de siguiente etapa (follow-up, confirmación) |

---

## MODELO DE EJECUCIÓN

```
WorkflowExecutor.execute(workflowDefinition, context, triggerEvent?)
  │
  ├─ 1. Aplicar trigger event (si existe)
  │      → StateResolver.resolveNextState(currentState, triggerEvent.type)
  │      → context.currentState = nextState
  │
  ├─ 2. Por cada paso en workflowDefinition.steps:
  │      ├─ Resolver engine: engineRegistry.get(step.engine)
  │      ├─ Evaluar condiciones (pasos de decisión)
  │      ├─ Ejecutar: engine.execute(step.action, context)
  │      ├─ Registrar: stepResult { stepId, status, output, error }
  │      ├─ Emitir: WorkflowStepExecuted o WorkflowStepFailed
  │      └─ Avanzar estado: resolveNextState(currentState, step.action)
  │
  └─ 3. Emitir: WorkflowCompleted o WorkflowFailed
```

---

## CICLO DE VIDA DEL WORKFLOW

```
WorkflowStarted
  │
  ├─ Step 1 → WorkflowStepExecuted → StateTransitioned
  ├─ Step 2 → WorkflowStepExecuted → StateTransitioned
  ├─ Step N → WorkflowStepExecuted
  │
  └─ WorkflowCompleted { totalSteps, completedSteps }
```

**En fallo:**
```
WorkflowStepFailed { step.error = "CONTACT_NOT_FOUND" }
  └─ WorkflowFailed (si es terminal)
  └─ O: fallback step (si está definido en onFailure)
```

---

## STATE MACHINE POR WORKFLOW

```typescript
interface StateMachine {
  id: string;
  vertical: string;
  initial: string;
  states: StateDefinition[];
}

interface StateDefinition {
  name: string;
  transitions: { event: string; target: string }[];
}
```

Resolución de estado:
```typescript
resolveNextState(currentState: string, event: string): string {
  const state = machine.states.find(s => s.name === currentState);
  const transition = state.transitions.find(t => t.event === event);
  return transition?.target ?? currentState;
}
```

---

## POLÍTICA DE REINTENTOS

### Qué se reintenta
- Errores de provider (`PROVIDER_UNAVAILABLE`, `PROVIDER_TIMEOUT`)
- Errores transitorios de infraestructura

### Qué NO se reintenta
- Errores de ownership (`OWNERSHIP_LOCKED`, `OWNERSHIP_INSUFFICIENT`)
- Errores de validación (`CONTACT_NOT_FOUND`, `INVALID_STAGE`)
- Errores de negocio (`CAMPAIGN_ARCHIVED`, `OPPORTUNITY_TERMINAL`)

### Configuración

```typescript
interface FailurePolicy {
  retry: {
    maxAttempts: number;    // Default: 3
    backoffMs: number;      // Exponencial: 1s, 4s, 16s
  };
  fallbackStep?: string;    // Paso a ejecutar en fallo terminal
}
```

---

## PROPAGACIÓN DE CONTEXTO ENTRE PASOS

Cada paso enriquece el contexto para el siguiente:

```typescript
// Después del paso 1: create_contact
context.state = {
  ...context.state,
  contactId: "cnt_01JX...",
  contactName: "Juan Pérez"
};

// Paso 2: create_opportunity lee de context.state
engine.execute("create_opportunity", {
  contactId: context.state.contactId,
  pipelineId: "pip_dental",
  stageId: "stage_consulta"
});
```

---

## INVARIANTES DE ORQUESTACIÓN

1. **O1:** Toda ejecución de workflow tiene `executionId` único
2. **O2:** Cada paso emite `WorkflowStepExecuted` o `WorkflowStepFailed`
3. **O3:** `WorkflowCompleted` lleva `totalSteps` y `completedSteps`
4. **O4:** Las transiciones de estado DEBEN coincidir con la state machine
5. **O5:** Engines desconocidos producen `step.status = 'failed'`, no excepciones
6. **O6:** Contexto es inmutable entre pasos — cada paso recibe snapshot nuevo

---

## ORQUESTACIÓN DETERMINISTA

1. **Mismo workflow + mismo contexto → mismo resultado.** Sin aleatoriedad.
2. **Orden explícito de pasos.** Ejecución secuencial. Paralelismo planeado, no implementado.
3. **Transiciones rule-based.** State machines dictan transiciones válidas.
4. **IA es herramienta, no director.** IA provee inputs; nunca decide ruteo.
5. **Eventos como único primitivo de coordinación.** Sin estado mutable compartido entre engines.

---

## RELACIÓN CON INSTITUCIONES DE PEKÍN

| Institución | Relación |
|-------------|----------|
| **El Cauce** | El WorkflowOrchestrator es la implementación central del Flujo Gobernado |
| **El Senado** | Interpreta `WorkflowFailed` para decidir escalaciones |
| **La Forja** | Los harnesses de ejecución son diseñados por La Forja |
| **El Observatorio** | Cada paso emite evento → trazabilidad completa de ejecución |
| **El Archivo** | Este patrón documenta la arquitectura de orquestación |

---

## RELACIÓN CON LEGOS EXISTENTES

| Lego | Relación |
|------|----------|
| `packages/engines/workflow-orchestrator/` | Implementación del orquestador. WorkflowExecutor, EventDispatcher, EngineRegistry, StateResolver |
| `packages/shared/src/runtime/OrchestrationPolicy.ts` | Tipos canónicos: `FailurePolicy`, `StepResult`, `StepStatus` |
| `packages/shared/src/workflow/WorkflowContext.ts` | `StepResult`, `StepStatus` canónicos |
| `packages/shared/src/workflow/WorkflowState.ts` | `CanonicalWorkflowState`, `StateTransition` |
| `verticals/dental/workflows/sarah-runtime.manifest.json` | Mapeo de workflows verticales a engines del orquestador |

---

## PENDIENTES / PREGUNTAS ABIERTAS

- [ ] Implementar ejecución paralela de pasos (`StepType: "parallel"` ya definido en tipos, no implementado)
- [ ] Implementar DAG workflows con `dependsOn` (topological sort executor)
- [ ] Migrar EventDispatcher de in-memory a Redis pub/sub para multi-proceso
- [ ] Migrar Context Store de in-memory Map a PostgreSQL para persistencia cross-restart
- [ ] Resolver drift D-001/D-002: workflow-orchestrator redefine `DomainEvent` y `WorkflowContext` en lugar de importar de `shared/`

---

*Fin del Patrón Workflow Orchestration v1.0.0*
*Absorbido de openspec/governance/orchestration-model.md (RT-1.5) bajo autoridad de la Constitución de Pekín*
