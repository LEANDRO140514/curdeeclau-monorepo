# OPENSPEC PROCESS — ABSORBIDO

> Tipo: procedural
> Versión: 1.0.0 — Absorción Phase D
> Creado: 2026-06-11
> Fuente legacy absorbida: `openspec/README.md` (RT-1.5, supersedido como autoridad activa)
> Autoridad vigente: Constitución de Pekín, Instituciones: La Academia, La Aduana, La Armería, La Forja

---

## PROPÓSITO

Definir qué partes de OpenSpec sobreviven como proceso técnico bajo Pekín y qué partes quedaron supersedidas. OpenSpec ya no es autoridad constitucional — es un proceso de especificación técnica al servicio de las instituciones de Pekín.

---

## QUÉ ERA OPENSPEC

OpenSpec fue el sistema de especificación técnica de Algorithmus Platform. Su ciclo de vida:

```
Blueprint → Pattern → Canonical Contracts → OpenSpec → Engine → Provider Adapter → Vertical
```

### Qué queda SUPERSEDIDO

- ❌ OpenSpec como "architectural governance layer" — Pekín es la única autoridad constitucional
- ❌ El Algorithmus Chain como cadena de autoridad — reemplazado por los 7 niveles de Pekín
- ❌ `openspec/governance/rt-constitution.md` como constitución — supersedido por `constitucion.md`
- ❌ OpenSpec como fuente de verdad de gobernanza — reemplazado por `.claude/memory/`

### Qué SOBREVIVE como proceso técnico

- ✅ Templates de especificación (proposal, design, tasks, engine-spec)
- ✅ Ciclo de vida de desarrollo de engines (spec → InMemory → tests → provider → persistencia)
- ✅ Formato de invariantes (MUST/SHALL/CANNOT)
- ✅ Specs de engines existentes (ghl, calendar, knowledge)
- ✅ Convenciones de naming y lifecycle

---

## CÓMO USAR OPENSPEC BAJO PEKÍN

OpenSpec ahora es un **proceso de especificación técnica** que opera en los Niveles 4-5 de Pekín:

| Paso OpenSpec | Equivalente Pekín |
|---------------|-------------------|
| Blueprint | La Academia — diseño de patrón |
| Pattern | `pattern/` — patrón documentado con 3+ ocurrencias |
| Canonical Contracts | `packages/shared/` — contratos en TypeScript |
| OpenSpec Proposal | Propuesta técnica para El Senado |
| OpenSpec Design | Diseño validado por La Academia |
| OpenSpec Spec | Spec formal con invariantes |
| Engine Implementation | La Forja — implementación dentro de harness |
| Provider Adapter | La Aduana — naturalización de herramienta externa |
| Vertical | `verticals/` + DNA registrado en El Registro Civil |

---

## TEMPLATES DISPONIBLES

OpenSpec proporciona 4 templates reutilizables (ubicados en `openspec/templates/`):

| Template | Uso |
|----------|-----|
| `proposal-template.md` | Proponer nuevo engine, provider o refactor mayor |
| `design-template.md` | Diseño detallado con arquitectura ASCII, entidades canónicas, eventos |
| `tasks-template.md` | Plan de implementación en 2 fases (core + provider adapter) |
| `engine-spec-template.md` | Spec formal con Identity, Entities, Provider Interface, Events, Ownership Matrix, Invariants, Lifecycle |

---

## CICLO DE VIDA DE UN ENGINE (CON OPENSPEC)

```
Propuesta (proposal-template.md)
  → Diseño (design-template.md)
    → Spec formal (engine-spec-template.md)
      → Implementación InMemory
        → Tests (unitarios + integración)
          → Provider adapter (naturalizado por La Aduana)
            → Persistencia (Postgres)
              → Observabilidad (métricas, tracing)
                → Multitenancy (aislamiento de tenant)
```

---

## RELACIÓN CON INSTITUCIONES DE PEKÍN

| Institución | Cómo usa OpenSpec |
|-------------|-------------------|
| **La Academia** | Usa los templates para documentar patrones y specs de engines |
| **La Aduana** | Usa el design template para documentar la naturalización de providers |
| **La Armería** | Cataloga engines que completaron el ciclo OpenSpec completo |
| **La Forja** | Implementa engines siguiendo las specs formales de OpenSpec |
| **El Senado** | Revisa proposals de OpenSpec para decidir qué engines/providers se construyen |

---

## SPECS DE ENGINE EXISTENTES (REFERENCIA)

| Engine | Spec location | Estado |
|--------|--------------|--------|
| GHL Engine | `openspec/changes/create-ghl-engine/specs/ghl-engine.md` | 22 invariantes, 4 entidades |
| Calendar Engine | `openspec/changes/create-calendar-engine/specs/calendar-engine.md` | 30 invariantes, 5 entidades |
| Knowledge Engine | `openspec/changes/create-knowledge-engine/` | Diseño, 25 invariantes, 6 entidades |

Estas specs siguen siendo referencia técnica válida. No son autoridad constitucional.

---

## PENDIENTES / PREGUNTAS ABIERTAS

- [ ] ¿Deben migrarse los templates de `openspec/templates/` a `procedural/`?
- [ ] ¿Debe existir un template Pekín para ADRs además de los 4 de OpenSpec?
- [ ] Completar specs formales para knowledge-engine, ghl-engine, calendar-engine
- [ ] Definir criterios de aceptación para que La Academia valide una spec

---

*Fin de OpenSpec Process Absorbido v1.0.0*
*Absorbido de openspec/README.md (RT-1.5) bajo autoridad de la Constitución de Pekín*
