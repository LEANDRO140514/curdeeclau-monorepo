# RISK-1 — TECHNICAL RISK TRIAGE REPORT

> Tipo: operational/report
> Version: 1.0.0
> Fecha: 2026-06-13
> Basado en: MAP-1 (mapa-sistemas.md), ORG-1A (synthesis report)
> Autoridad: Governance Level 2, Seccion 7

---

## 1. PROPOSITO

Este reporte clasifica, prioriza y recomienda acciones sobre los riesgos tecnicos detectados en el monorepo CURDEECLAU. No corrige ningun riesgo. No modifica codigo. Es un diagnostico para decision del Senado.

---

## 2. FUENTE DE RIESGOS

Riesgos extraidos de:
- **MAP-1** (`reference/mapa-sistemas.md`, Seccion 12): 10 riesgos catalogados.
- **ORG-1A** (`operational/reports/org1a-synthesis-report.md`): nombres desalineados, patterns sin madurar, apps legacy.
- **Drift Catalog** (`operational/drift-catalog-absorbed.md`): D-001..D-010.

---

## 3. INVENTARIO DE RIESGOS

### R-1: Sin interfaz LLMProvider — OpenAI acoplado directamente

- **Descripcion:** `algorithmus-core-engine` referencia OpenAI directamente en el pipeline LLM. No existe interfaz `LLMProvider` como si existe `CRMProvider` o `CalendarProvider`.
- **Origen:** MAP-1 Seccion 12. Confirmado en ORG-1A Agente 3 (Pattern Audit).
- **Impacto:** Cambiar de proveedor LLM requiere reescribir codigo en multiple puntos. Viola Principio IV (Separacion Principio-Herramienta).
- **Evidencia:** `algorithmus-core-engine/src/core/llm/`, `src/infra/providers/openai/`.

### R-2: Tipos duplicados D-001/D-002 en workflow-orchestrator

- **Descripcion:** `workflow-orchestrator/src/types.ts` redefine `DomainEvent`, `WorkflowContext` y `StateTransition` en lugar de importarlos de `@curdeeclau/shared`.
- **Origen:** Drift Catalog D-001, D-002. Confirmado en ORG-1A Agente 3.
- **Impacto:** Los tipos en `shared/` y en `workflow-orchestrator/` divergen. Cambios en shared no se propagan. Riesgo de inconsistencia en el sistema nervioso central.

### R-3: Nombres desalineados — providers en engines/

- **Descripcion:** `telegram-provider` y `ghl-engine` viven en `packages/engines/` pero son providers (adapters externos), no engines de dominio. `knowledge-engine` vive en `packages/` raiz en lugar de `packages/engines/`. `math-engine` es Python, sin package.json, fuera del toolchain pnpm.
- **Origen:** ORG-1A Agente 2. MAP-1 Seccion 12.
- **Impacto:** Confusion para agentes nuevos. Dificulta la catalogacion en Legoland. No es un bug funcional.

### R-4: Apps legacy sin integracion con engines

- **Descripcion:** `quiniela-2026_deepclaude` es una app funcional (Vite + React) que no consume ningun `@curdeeclau/*` package. `quiniela-2026`, `reducidas-2026`, `survivor-world-cup` son esqueletos o solo diseno.
- **Origen:** ORG-1A Agente 1. MAP-1 Seccion 8.
- **Impacto:** Las apps legacy no se benefician de la plataforma. Ocupan espacio cognitivo. No son arquitectonicamente CURDEECLAU.

### R-5: Blueprints n8n no consumibles por el orchestrator TypeScript

- **Descripcion:** Los 30+ blueprints en `workflows/blueprints/` son JSON exportado de n8n. El `workflow-orchestrator` es TypeScript y no puede ejecutarlos.
- **Origen:** ORG-1A Agente 3. MAP-1 Seccion 12.
- **Impacto:** Los blueprints documentan intencion pero no son ejecutables. El orchestrator no tiene workflows reales que ejecutar.

### R-6: algorithmus-core-engine / platform con nombres ambiguos

- **Descripcion:** `algorithmus-core-engine` es un runtime conversacional completo (FSM, LLM, RAG, WhatsApp, Redis, PostgreSQL), no un "engine" en el sentido de los otros. `algorithmus-platform` es scaffolding que solapa con `algorithmus-core-engine`.
- **Origen:** ORG-1A Agente 2.
- **Impacto:** La palabra "algorithmus" aparece en el nombre del paquete pero Algorithmus es una vertical, no el nombre de un engine.

### R-7: Pinecone vs pgvector

- **Descripcion:** Pinecone se usa como vector store pero Supabase (el backend principal) soporta pgvector. Mantener Pinecone anade un proveedor externo adicional con costo y riesgo.
- **Origen:** NAT-1 ficha pinecone.md. MAP-1 Seccion 9.
- **Impacto:** Dos sistemas de persistencia externos cuando uno (Supabase) podria cubrir ambos. Costo operativo y complejidad.

### R-8: Supabase como dependencia externa critica

- **Descripcion:** Supabase es el backend principal. Si Supabase desaparece, CURDEECLAU pierde su base de datos. Aunque el acoplamiento es bajo (PostgreSQL estandar con migraciones SQL), la dependencia operativa es total.
- **Origen:** NAT-1 ficha supabase.md. MAP-1 Seccion 7.
- **Impacto:** Plan de contingencia documentado pero no verificado (backup + restauracion en otro provider).

### R-9: Apps legacy — archive candidates

- **Descripcion:** `quiniela-2026` (solo docs), `reducidas-2026` (HTML estatico), `survivor-world-cup` (solo diseno) no tienen codigo activo ni futuro claro.
- **Origen:** MAP-1 Seccion 8. ORG-1A Agente 1.
- **Impacto:** Ocupan espacio en `apps/`. Generan confusion sobre que esta activo y que no.

### R-10: Remote historico quiniela-archive

- **Descripcion:** El remote `quiniela-archive` apunta a `https://github.com/LEANDRO140514/quiniela-engine.git`, un repositorio separado que contiene la version pre-monorepo de quiniela.
- **Origen:** ORG-1A Agente 5. MAP-1 Seccion 12.
- **Impacto:** Bajo. Es solo un remote adicional. No interfiere con operaciones. Pero no hay decision documentada sobre si mantenerlo o removerlo.

---

## 4. CLASIFICACION POR SEVERIDAD

| ID | Riesgo | Severidad | Probabilidad | Impacto | Area | Bloquea UV-1? | Requiere ADR? | Requiere codigo? |
|----|--------|-----------|-------------|---------|------|---------------|---------------|-----------------|
| R-1 | Sin LLMProvider | Alta | Cierta | Alto | Runtime/Integration | Si | Si | Si |
| R-2 | Tipos duplicados D-001/D-002 | Alta | Cierta | Alto | Runtime/Architectural | Si | Si | Si |
| R-3 | Nombres desalineados | Media | Cierta | Medio | Naming | No | Si | Si (mover archivos) |
| R-4 | Apps sin integracion | Media | Cierta | Medio | Legacy/Archive | No | Tal vez | No (archival) |
| R-5 | Blueprints n8n no ejecutables | Media | Cierta | Medio | Runtime/Workflow | Parcial | Si | Si |
| R-6 | Nombres algorithmus ambiguos | Baja | Cierta | Bajo | Naming | No | Si | Si (renombrar) |
| R-7 | Pinecone vs pgvector | Media | Cierta | Medio | External Dependency | No | Tal vez | Si (migrar) |
| R-8 | Supabase dependencia critica | Media | Baja | Alto | External Dependency | No | No | No (verificar backup) |
| R-9 | Apps legacy archive | Baja | Cierta | Bajo | Legacy/Archive | No | No | No (archival) |
| R-10 | Remote quiniela-archive | Baja | Cierta | Bajo | Governance | No | No | No (git remote remove) |

---

## 5. CLASIFICACION POR TIPO

| Tipo | Riesgos |
|------|---------|
| **Architectural** | R-2 (tipos duplicados) |
| **Runtime** | R-1 (LLMProvider), R-5 (blueprints n8n) |
| **Integration** | R-7 (Pinecone vs pgvector) |
| **External Dependency** | R-1 (OpenAI), R-7 (Pinecone), R-8 (Supabase) |
| **Naming** | R-3 (providers en engines/), R-6 (algorithmus ambiguo) |
| **Legacy/Archive** | R-4 (apps sin integracion), R-9 (archive candidates) |
| **Governance** | R-10 (remote historico) |

---

## 6. PRIORIZACION

### P0 — Atender antes de cualquier feature

| Riesgo | Justificacion |
|--------|---------------|
| R-1 (LLMProvider) | Sin abstraccion, cambiar de proveedor LLM requiere reescribir. Viola Principio IV. Bloquea naturalizacion de OpenAI. |
| R-2 (D-001/D-002) | Tipos duplicados en el sistema nervioso central. Cada cambio en shared no se propaga. Divergencia garantizada. |

### P1 — Atender antes de reorganizacion/topology

| Riesgo | Justificacion |
|--------|---------------|
| R-5 (Blueprints n8n) | El orchestrator no tiene workflows ejecutables. Sin esto, el runtime no demuestra su valor. |
| R-3 (Nombres desalineados) | Corregir antes de cualquier topology migration. Mover providers fuera de engines/. Unificar engines en un solo directorio. |

### P2 — Atender antes de escalar verticales

| Riesgo | Justificacion |
|--------|---------------|
| R-8 (Supabase backup) | Verificar que el plan de contingencia funciona (backup + restore en otro provider). |
| R-7 (Pinecone vs pgvector) | Evaluar migracion. Simplifica infraestructura. Reduce costo. |
| R-4 (Apps sin integracion) | Decidir si quiniela se integra a la plataforma o se extrae del monorepo. |

### P3 — Diferible

| Riesgo | Justificacion |
|--------|---------------|
| R-6 (Nombres algorithmus) | Cosmetico. No afecta funcionamiento. |
| R-9 (Apps legacy archive) | Limpieza deseable pero no urgente. |
| R-10 (Remote quiniela-archive) | No interfiere. Remover cuando se decida el futuro de quiniela. |

---

## 7. RECOMENDACION EJECUTIVA

Que debe venir despues de RISK-1:

**Opcion recomendada: A — ADR-DOMAIN-EVENT-1 (resolver duplicidad DomainEvent) + B — ADR-LLM-1 (definir LLMProvider)**

Razon:
- R-1 y R-2 son los unicos riesgos P0. Ambos requieren ADR. Ambos bloquean UV-1 y cualquier vertical nueva.
- R-2 (DomainEvent duplicado) es quirurgico: toca pocos archivos, tiene alto impacto.
- R-1 (LLMProvider) es mas grande pero esencial para la soberania de proveedor LLM.

Secuencia sugerida:
1. ADR-DOMAIN-EVENT-1: unificar DomainEvent. Eliminar duplicacion en workflow-orchestrator.
2. ADR-LLM-1: definir interfaz LLMProvider en shared/. Envolver OpenAI. Implementar segundo provider como prueba.
3. ADR-TOP-1: solo despues de resolver P0 y P1. No reorganizar sobre bases fragiles.

---

## 8. NO BLOCKERS

Riesgos que NO bloquean avances de negocio:

- R-3 (nombres desalineados): Cosmetico. No impide construir.
- R-6 (nombres algorithmus): Cosmetico.
- R-9 (apps legacy archive): Limpieza, no bloqueo.
- R-10 (remote quiniela-archive): Inocuo.

---

## 9. BLOCKERS REALES

Riesgos que SI bloquean:

| Bloquea | Riesgos |
|---------|---------|
| **UV-1** | R-1 (LLMProvider), R-2 (DomainEvent duplicado), R-5 (blueprints no ejecutables) |
| **PWA Pekin Control Tower** | R-1, R-2 |
| **ORG-2 (topology migration)** | R-3 (nombres), R-5 (blueprints) |
| **Naturalizacion OpenAI** | R-1 (sin interfaz que naturalizar) |
| **Naturalizacion GHL** | R-3 (ghl-engine mal ubicado) — bajo, se puede naturalizar sin mover |
| **Naturalizacion Telegram** | R-3 (telegram-provider mal ubicado) — bajo, se puede naturalizar sin mover |

---

## 10. REGLAS DE NO EJECUCION

RISK-1 NO ejecuto:

- No modifico codigo.
- No movio packages.
- No renombro carpetas.
- No toco engines ni providers ni apps.
- No cambio remotes.
- No creo ADRs.
- No implemento LLMProvider.
- No unifico DomainEvent.
- No migro Pinecone a pgvector.
- No archivo apps legacy.
- No hizo push.

---

## 11. RESUMEN PARA EL SENADO

| Prioridad | Cantidad | Riesgos |
|-----------|----------|---------|
| P0 | 2 | R-1 (LLMProvider), R-2 (DomainEvent duplicado) |
| P1 | 2 | R-5 (Blueprints n8n), R-3 (Nombres desalineados) |
| P2 | 3 | R-8 (Supabase backup), R-7 (Pinecone vs pgvector), R-4 (Apps sin integracion) |
| P3 | 3 | R-6, R-9, R-10 |

Accion inmediata recomendada: **ADR-DOMAIN-EVENT-1** (unificar DomainEvent, resolver D-001/D-002).

---

*Fin del RISK-1 Technical Triage Report v1.0.0*
