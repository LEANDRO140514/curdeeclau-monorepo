# INVARIANT CONVENTIONS — ABSORBIDO

> Tipo: procedural
> Versión: 1.0.0 — Absorción Phase D
> Creado: 2026-06-11
> Fuente legacy absorbida: `openspec/conventions/invariant-conventions.md` (RT-1.5, supersedido como autoridad activa)
> Autoridad vigente: Constitución de Pekín, Principio V (Flujo Gobernado), Principio VII (Fallo Visible)

---

## PROPÓSITO

Definir el formato canónico para escribir, documentar y verificar invariantes en specs de engines, patrones y procedimientos. Un invariante es una regla que SIEMPRE debe ser verdadera. Sin invariantes no hay spec completa. Sin verificación no hay invariante válido.

---

## QUÉ ES UN INVARIANTE

Un invariante es una condición lógica que se cumple:
- **Antes** de cada operación del engine (precondición)
- **Después** de cada operación del engine (postcondición)
- **A través** de todas las operaciones (system-wide)

---

## FORMATO CANÓNICO

```
I<N> — <Entity | Concern>: <rule in present tense, MUST/SHALL/CANNOT>
```

### Ejemplos correctos

```
I1 — Contact: providerIds MUST remain separated from the canonical id.
I2 — Event: Every state mutation MUST emit a DomainEvent.
I3 — Ownership: LOCKED ownership SHALL block all CRM write operations.
I4 — Campaign: Campaigns with status 'archived' CANNOT be resumed or paused.
I5 — Opportunity: Status 'won', 'lost', 'abandoned' are TERMINAL — no further moves.
```

### Ejemplos incorrectos

```
✗ "Provider IDs should probably be separate" — demasiado débil, sin MUST/SHALL
✗ "Handle errors" — no específico, no verificable
✗ "Be fast" — no medible, no es una condición lógica
```

---

## CATEGORÍAS DE INVARIANTES

### Identity Invariants
Reglas sobre identidad de entidades, IDs y separación de providers.
```
I1 — Contact: providerIds MUST remain separated from the canonical id.
I2 — Contact: The canonical id field is IMMUTABLE after creation.
I3 — Entity: All entities MUST use the correct ULID prefix per entity type.
I4 — Entity: providerIds SHALL NOT be used as primary keys in any operation.
```

### Lifecycle Invariants
Reglas sobre transiciones de estado válidas.
```
I5 — Pipeline: A pipeline MUST have at least 1 stage.
I6 — Pipeline: Stage 'order' MUST be unique within a pipeline.
I7 — Opportunity: Status 'won', 'lost', 'abandoned' are TERMINAL.
I8 — Campaign: Campaigns with status 'archived' CANNOT be resumed or paused.
```

### Ownership Invariants
Reglas sobre gating de ownership.
```
I9 — Ownership: LOCKED ownership SHALL block ALL engine write operations.
I10 — Ownership: Every ownership transition MUST emit an OwnershipChanged event.
I11 — Ownership: Only handoff-engine MAY modify ownership state.
```

### Event Invariants
Reglas sobre emisión de eventos y causalidad.
```
I12 — Event: Every state mutation MUST emit a DomainEvent.
I13 — Event: Events within a workflow execution MUST share correlationId.
I14 — Event: Every event that is a direct reaction MUST carry causationId.
```

### Data Invariants
Reglas sobre integridad de datos.
```
I15 — Contact: No two contacts may share the same providerIds value (same tenant).
I16 — Campaign: startAt MUST be before endAt (if both are set).
I17 — Opportunity: contactId MUST reference an existing contact.
I18 — Opportunity: pipelineId MUST reference an existing pipeline.
```

---

## FUERZA DE INVARIANTES

| Fuerza | Keyword | Significado |
|--------|---------|-------------|
| **Absoluto** | MUST, SHALL | Siempre verdadero. Violación = bug |
| **Prohibición** | MUST NOT, CANNOT, SHALL NOT | Nunca permitido. Violación = bug de seguridad/consistencia |
| **Recomendación** | SHOULD | Debería ser verdadero. Violación = code smell |
| **Opción** | MAY | Permitido pero no requerido |

Specs usan predominantemente **MUST** y **MUST NOT**. SHOULD y MAY son para guías de implementación.

---

## VERIFICACIÓN DE INVARIANTES

Todo invariante debe ser verificable por al menos uno de:

1. **Tests:** Unit/integration tests que aseveran el invariante
2. **Type system:** Tipos de TypeScript que fuerzan el invariante en compilación
3. **Runtime checks:** Aserciones en el engine que verifican en ejecución

Ejemplo:
```
I17 — Opportunity: contactId MUST reference an existing contact.
```
Verificado por:
```typescript
const contact = this.provider.getContact(input.contactId);
if (!contact) return { error: 'CONTACT_NOT_FOUND' };
```

---

## UBICACIÓN DE INVARIANTES

| Ubicación | Tipo de invariantes |
|-----------|-------------------|
| Spec del engine | Engine-specific (entidades, lifecycle, permisos) |
| `pattern/ownership-propagation.md` | Ownership (cross-cutting) |
| `pattern/workflow-orchestration.md` | Orchestration (cross-cutting) |
| `pattern/runtime-semantics.md` | Runtime (cross-cutting) |
| `reference/catalogo-eventos.md` | Eventos (cross-cutting) |

---

## NUMERACIÓN DE INVARIANTES

- Specs de engine: numeración continua desde I1
- Documentos de patrón: prefijados por dominio (I-E1 para eventos, I-O1 para orquestación, I-OW1 para ownership)
- Sin números duplicados dentro del mismo documento
- Números estables — no renumerar al agregar nuevos invariantes

---

## RELACIÓN CON INSTITUCIONES DE PEKÍN

| Institución | Relación |
|-------------|----------|
| **La Academia** | Los invariantes son la unidad mínima de conocimiento verificable. Alimentan el pipeline de extracción de patrones |
| **La Forja** | Los harnesses deben verificar invariantes en runtime. Violación de invariante = gate cerrado |
| **El Observatorio** | Violaciones de invariante en producción deben generar alertas |
| **El Archivo** | Toda spec de engine con invariantes se preserva en el Archivo |

---

## PENDIENTES / PREGUNTAS ABIERTAS

- [ ] ¿Debe existir un linter de invariantes que verifique formato MUST/SHALL/CANNOT?
- [ ] ¿Cómo se integra la verificación de invariantes en CI/CD?
- [ ] Formalizar el mapeo: invariante → test → runtime check → alerta

---

*Fin de Invariant Conventions v1.0.0*
*Absorbido de openspec/conventions/invariant-conventions.md (RT-1.5) bajo autoridad de la Constitución de Pekín*
