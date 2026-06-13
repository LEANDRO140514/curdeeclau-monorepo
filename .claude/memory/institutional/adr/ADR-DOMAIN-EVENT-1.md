# ADR-DOMAIN-EVENT-1 — Canonical DomainEvent Authority

> Tipo: institutional/adr
> Version: 1.0.0
> Ratificado: 2026-06-13
> Autoridad: Asamblea de Pekin
> Riesgo relacionado: R-2 (RISK-1 Technical Triage)
> Drifts relacionados: D-001, D-002 (Drift Catalog)

---

## 1. ESTADO

**ACEPTADO / RATIFICADO**

---

## 2. CONTEXTO

### El riesgo R-2 detectado en RISK-1

El mapa de sistemas (MAP-1) y el reporte de riesgos (RISK-1) identificaron un riesgo de duplicidad en las definiciones de `DomainEvent`. La investigacion revelo lo siguiente:

**Hecho 1: `packages/shared/` ES la autoridad canonica de facto.**
Todos los engines importan `DomainEvent` (tipo) y `createDomainEvent` (fabrica) desde `@curdeeclau/shared`:
- `calendar-engine` — importa de shared
- `crm-engine` — importa de shared
- `handoff-engine` — importa de shared
- `message-buffer-engine` — importa de shared
- `workflow-orchestrator` — importa de shared (y re-exporta)

**Hecho 2: `workflow-orchestrator/src/events/DomainEvent.ts` es un wrapper, no una redefinicion.**
El archivo en el orchestrator importa `createDomainEvent` y `DomainEvent` desde `@curdeeclau/shared` y expone:
- `createEvent(type, overrides)` — wrapper que restringe `type` a `RuntimeEventType`
- `isEventType(event, type)` — helper de comparacion

No redefine la interfaz. No crea un tipo divergente. Es una capa de conveniencia.

**Hecho 3: Existe UNA importacion incorrecta.**
`telegram-provider/src/run.ts:41` importa `DomainEvent` desde `@curdeeclau/workflow-orchestrator` en lugar de `@curdeeclau/shared`. Es el unico engine que no importa del origen canonico.

**Hecho 4: Los aliases en `types.ts` son re-exports, no redefiniciones.**
`WorkflowContext = ExecutionContext`, `EventDispatcher = RuntimeEventDispatcher`, etc. son alias de tipos importados de shared. No crean divergencia. Son naming local.

### Conclusion del diagnostico

La severidad de R-2 se recalifica: no es un problema de tipos divergentes (P0), sino de **autoridad canonica implicita pero no declarada** y una **importacion desviada** (P1). La autoridad existe de facto. Falta declararla de jure.

---

## 3. PROBLEMA

Si la autoridad canonica de `DomainEvent` no se declara explicitamente:

1. **Nuevos engines podrian crear sus propias definiciones.** Sin declaracion explicita, nada impide que un futuro engine redefina DomainEvent localmente.
2. **La importacion desviada en telegram-provider sienta precedente.** Si no se corrige, otros providers podrian importar del orchestrator en lugar de shared.
3. **El wrapper en workflow-orchestrator genera ambiguedad.** Aunque es inofensivo hoy, su existencia sugiere que el orchestrator tiene autoridad sobre DomainEvent, cuando no la tiene.
4. **La naturalizacion de providers requiere claridad.** Un provider nuevo debe saber de donde importar sin ambiguedad.

---

## 4. DECISION

La Asamblea de Pekin declara:

1. **`packages/shared/` es la autoridad canonica exclusiva de `DomainEvent`.** La interfaz `DomainEvent`, la fabrica `createDomainEvent`, el guard `isDomainEvent` y el catalogo `EventCatalog` residen en shared y solo en shared.

2. **Ningun otro modulo puede definir `DomainEvent`.** Puede importarlo, usarlo, extender su payload — pero no redefinir su interfaz ni crear una definicion paralela.

3. **El wrapper `createEvent` en workflow-orchestrator es valido como conveniencia local.** No viola la autoridad porque importa de shared, no redefine, y agrega type-safety sobre `RuntimeEventType`. Se permite que permanezca como helper.

4. **La importacion en `telegram-provider` desde `@curdeeclau/workflow-orchestrator` debe corregirse.** Debe importar `DomainEvent` directamente de `@curdeeclau/shared`.

5. **Los aliases en `workflow-orchestrator/src/types.ts` son validos.** Re-exportar tipos de shared con nombres locales no crea autoridad paralela. Son conveniencia de naming.

6. **Todo futuro engine, provider, app o integracion debe importar `DomainEvent` exclusivamente de `@curdeeclau/shared`.**

---

## 5. ALCANCE DE LA DECISION

### Incluye

- `DomainEvent` (interfaz) — autoridad exclusiva en shared
- `createDomainEvent` (fabrica) — autoridad exclusiva en shared
- `isDomainEvent` (guard) — autoridad exclusiva en shared
- `EventCatalog` — autoridad exclusiva en shared
- `RuntimeEventType` — autoridad exclusiva en shared
- Patron de importacion para todo el monorepo

### No incluye

- La implementacion del fix (eso es FIX-DOMAIN-EVENT-1)
- La eliminacion del wrapper en workflow-orchestrator (es valido como helper)
- Cambios en otros engines (ya importan correctamente)
- Topology migration
- UV-1 o PWA

---

## 6. CONSECUENCIAS

### Positivas

- Autoridad canonica declarada explicitamente. Cero ambiguedad para nuevos modulos.
- El riesgo R-2 pasa de "sin decision" a "decidido". Solo queda implementar.
- La naturalizacion de providers (NAT-1) tiene un contrato claro que referenciar.
- UV-1 y PWA pueden asumir `DomainEvent` desde shared sin riesgo.
- El wrapper en workflow-orchestrator queda legitimado, no eliminado.

### Costos y riesgos

- Requiere una fase de implementacion (FIX-DOMAIN-EVENT-1) para corregir la importacion en telegram-provider.
- La fase de fix es minima: un archivo, una linea de import.
- Si no se ejecuta FIX-DOMAIN-EVENT-1, la decision es simbolica pero no efectiva.

---

## 7. ESTRATEGIA DE IMPLEMENTACION FUTURA

### Fase: FIX-DOMAIN-EVENT-1

Alcance minimo:

1. Localizar la importacion desviada en `telegram-provider/src/run.ts:41`.
2. Cambiar `import type { DomainEvent } from '@curdeeclau/workflow-orchestrator'` por `import type { DomainEvent } from '@curdeeclau/shared'`.
3. Verificar que no hay otras importaciones desviadas en el monorepo.
4. Ejecutar typecheck (`tsc --noEmit`) en shared, workflow-orchestrator y telegram-provider.
5. Ejecutar tests de workflow-orchestrator y telegram-provider.
6. Commit atomico con mensaje `fix(pekin): enforce canonical domainevent import in telegram-provider`.

### No incluye en FIX-DOMAIN-EVENT-1

- Eliminar el wrapper en workflow-orchestrator (es valido).
- Modificar otros engines (ya cumplen).
- Cambiar la interfaz de DomainEvent.
- Topology migration.

---

## 8. CRITERIOS DE ACEPTACION PARA FIX-DOMAIN-EVENT-1

- [ ] `telegram-provider` importa `DomainEvent` de `@curdeeclau/shared`.
- [ ] Ningun modulo fuera de shared define `DomainEvent`.
- [ ] Ningun modulo importa `DomainEvent` de una fuente no canonica.
- [ ] Typecheck pasa en modulos afectados.
- [ ] Tests pasan en modulos afectados.
- [ ] Cero cambios de comportamiento.

---

## 9. RELACION CON PEKIN

Esta decision preserva:

- **Principio II (Primacia de la Memoria):** La decision queda registrada. Futuros agentes saben donde esta la autoridad.
- **Principio XI (No Dispersion):** Un solo `DomainEvent`. Una sola autoridad. Sin definiciones paralelas.
- **Governance Level 2, Seccion 8:** Los contratos en shared/ son fundacionales. Modificarlos requiere ADR. Este ADR establece que `DomainEvent` es uno de esos contratos.

---

## 10. RELACION CON RIESGOS

| Riesgo | Estado anterior | Estado posterior |
|--------|----------------|-----------------|
| R-2 (DomainEvent duplicado) | P0 — Sin decision | P1 — Decidido. Pendiente FIX-DOMAIN-EVENT-1. |
| D-001 (wrapper en orchestrator) | Drift activo | Resuelto: el wrapper es valido como helper. |
| D-002 (import desviado en telegram) | Drift activo | Decidido. Pendiente correccion en FIX-DOMAIN-EVENT-1. |

---

## 11. PROXIMO PASO AUTORIZADO

**FIX-DOMAIN-EVENT-1** — Ejecutar la correccion minima: cambiar el import en `telegram-provider` y verificar.

Seguido de: **ADR-LLM-1** — Definir LLMProvider (R-1 en RISK-1).

---

*Fin del ADR-DOMAIN-EVENT-1 v1.0.0*
*Ratificado por la Asamblea de Pekin el 13 de junio de 2026*
