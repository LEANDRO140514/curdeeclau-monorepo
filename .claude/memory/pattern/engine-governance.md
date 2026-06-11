# ENGINE GOVERNANCE

> Tipo: pattern
> Versión: 1.0.0 — Absorción Phase B2
> Creado: 2026-06-11
> Fuente legacy absorbida: `openspec/governance/engine-governance.md` (RT-1.5, supersedido como autoridad activa)
> Autoridad vigente: Constitución de Pekín, Principio IV (Separación Principio-Herramienta), Principio V (Flujo Gobernado), Principio VIII (Autonomía Controlada)

---

## PROPÓSITO

Definir qué es un Engine en CURDEECLAU, cómo se diferencia de un Provider, las reglas que gobiernan su creación, su contrato canónico y los artefactos requeridos para su certificación.

---

## CONCEPTOS CLAVE

### Engine vs Provider

| | Engine | Provider |
|---|---|---|
| **Qué es** | Componente de runtime con lógica de dominio | Adapter que envuelve una herramienta externa |
| **Ejemplo** | `handoff-engine`, `calendar-engine`, `crm-engine` | `GHLClient`, `GoogleCalendarAdapter`, `PineconeRAGAdapter` |
| **Dependencia** | No depende de providers específicos | Implementa una interfaz definida por el engine |
| **Ubicación** | `packages/engines/<name>/` | Dentro del engine o en `packages/providers/` |
| **Autoridad** | Nivel 5 (Legos) en jerarquía Pekín | Sub-componente del engine, naturalizado por La Aduana |

### Principio fundacional

> No engine sin spec. No spec sin invariantes. No invariantes sin verificación.

---

## REQUISITOS DE ENGINE

### 1. Deterministic-First

- Toda transición de estado es rule-based, no decidida por IA
- `execute(action, context)` es pure-ish: mismos inputs → mismos outputs
- IA puede sugerir acciones; el engine las ejecuta determinísticamente

### 2. Provider-Agnostic

- El modelo de runtime del engine NO DEBE depender de ningún provider concreto
- Lógica específica de provider vive en adapters que implementan la interfaz del engine
- Entidades canónicas viven en `packages/shared/` — los engines las referencian, nunca las redefinen

### 3. Ownership-Aware

- Todo engine lee el estado de ownership de `shared/runtime/Ownership.ts`
- Las acciones están gateadas por ownership según la matriz de permisos (ver `pattern/ownership-propagation.md`)
- Solo handoff-engine escribe ownership

### 4. Event-Driven

- Toda mutación emite un `DomainEvent` (ver `reference/catalogo-eventos.md`)
- Eventos llevan `correlationId`, `causationId`, `actorId`
- Sin cambios de estado silenciosos — si algo cambió, emitió evento

### 5. Runtime-Oriented

- El engine es componente de runtime, no una librería
- Es llamado por `workflow-orchestrator`, no por código de aplicación directamente
- Implementa el contrato `Engine`

---

## CONTRATO CANÓNICO DEL ENGINE

```typescript
interface Engine {
  /** Identificador único. Usado por workflow steps para enrutar acciones. */
  readonly engineName: string;

  /**
   * Ejecuta una acción dentro de un contexto de runtime.
   *
   * @param action  Acción a ejecutar (ej. "create_contact", "move_opportunity")
   * @param context Contexto de runtime: conversationId, tenantId, workflowId,
   *                correlationId, actorId, state bag
   * @returns       Resultado estructurado: { success, data } o { error, message }
   *
   * NUNCA lanza excepciones. Errores se retornan como resultados estructurados.
   */
  execute(action: string, context: Record<string, unknown>): Promise<Record<string, unknown>>;
}
```

---

## REGLAS DE CREACIÓN DE ENGINES

1. **Especificación primero.** Todo engine nuevo requiere spec formal con entidades canónicas, provider interface, event catalog, invariantes y lifecycle.
2. **InMemory primero.** Primera implementación siempre es InMemory — sin dependencias externas.
3. **Provider adapter segundo.** Solo después de que InMemory pasa todos los tests.
4. **Persistencia tercero.** Postgres u otro storage solo cuando el modelo está validado.
5. **Observabilidad integrada.** Métricas y tracing desde el día 1, no como afterthought.

---

## PATRONES PROHIBIDOS

- ❌ Engine llamando directamente una API de provider (usar adapter interface)
- ❌ Engine gestionando su propio estado de ownership (delegar a `shared/runtime/Ownership`)
- ❌ Engine lanzando excepciones para errores de negocio (retornar errores estructurados)
- ❌ Engine dependiendo de framework específico (Next.js, Express)
- ❌ Engine hardcodeando provider IDs como primary keys
- ❌ Engine tomando decisiones de IA autónomamente
- ❌ Engine con side effects silenciosos (sin evento emitido)

---

## ARTEFACTOS REQUERIDOS

Todo engine debe tener:

1. **Spec formal** documentando entidades, provider interface, eventos, invariantes, lifecycle
2. **Tests** que prueben cada invariante
3. **Index export** en `src/index.ts` exportando la clase del engine y sus tipos
4. **TypeScript estricto:** strict mode, sin `any`, return types explícitos en métodos públicos
5. **README** con quickstart, arquitectura, y relación con otros engines

---

## CICLO DE VIDA DE UN ENGINE

```
Propuesta de spec
  → Diseño (entidades canónicas + provider interface)
    → Spec formal (invariantes + event catalog)
      → Implementación InMemory
        → Tests (unitarios + integración)
          → Provider adapter (GHL, Google Calendar, Pinecone…)
            → Persistencia (Postgres)
              → Observabilidad (métricas, tracing)
                → Multitenancy (aislamiento de tenant)
```

---

## RELACIÓN CON INSTITUCIONES DE PEKÍN

| Institución | Relación |
|-------------|----------|
| **La Armería** | Cataloga, versiona y certifica engines como legos maduros |
| **La Aduana** | Naturaliza providers antes de que el engine los integre |
| **La Forja** | Los engines operan dentro de harnesses que La Forja diseña |
| **El Cauce** | Los engines emiten eventos al catálogo; el orchestrator los coordina |
| **La Academia** | Extrae patrones de engines maduros para proponer nuevos patrones institucionales |

---

## PENDIENTES / PREGUNTAS ABIERTAS

- [ ] Completar specs formales de engines en fase diseño: knowledge-engine, ghl-engine, calendar-engine
- [ ] Definir criterios de madurez para certificación por La Armería (3+ verticales, 0 errores en prod, tests completos)
- [ ] Evaluar si `media-delivery-engine` y `ghl-engine` deben migrar a depender de `@curdeeclau/shared`
- [ ] E-8, E-9 (post RT-4): estados `INITIALIZING` y `FAILED` en EngineLifecycle

---

*Fin del Patrón Engine Governance v1.0.0*
*Absorbido de openspec/governance/engine-governance.md (RT-1.5) bajo autoridad de la Constitución de Pekín*
