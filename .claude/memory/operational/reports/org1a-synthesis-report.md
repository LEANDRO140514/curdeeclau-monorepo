# ORG-1A — SYNTHESIS REPORT

> Tipo: operational/report
> Fecha: 2026-06-13
> Ejecutor: ORG-1A Orchestrator
> Agentes: AGENT 1 (Repository Identity), AGENT 2 (Module Inventory), AGENT 3 (Pattern Audit), AGENT 4 (Topology Proposal), AGENT 5 (Operating Docs & Remote)
> Alcance: Solo lectura. Cero modificaciones ejecutadas.

---

## 1. QUE ES CURDEECLAU-MONOREPO

CURDEECLAU-MONOREPO es un **monorepo de plataforma en transicion**. No es una coleccion de proyectos personales, aunque nacio como tal. No es una app unica. Es el territorio fisico donde opera la civilizacion CURDEECLAU.

El nombre `curdeeclau-monorepo` es correcto y debe mantenerse. Algorithmus es una vertical dentro de CURDEECLAU, no la entidad contenedora. Todos los paquetes usan el scope `@curdeeclau/*`. El remote GitHub ya apunta a `curdeeclau-monorepo`.

Identidad declarada (Constitucion, Articulo I):

> CURDEECLAU no es el repositorio. CURDEECLAU es la civilizacion.

El monorepo es el **territorio** que la civilizacion ocupa actualmente.

---

## 2. QUE ES PEKIN

Pekin es la **capital institucional** de CURDEECLAU. Reside en `.claude/memory/`. Su rol:

- **Constitucional.** Define la Constitucion, 10 Principios y 10 Instituciones.
- **Gobernanza.** ADR-000 la declaro unica autoridad constitucional activa, supersediendo RT-1.5/OpenSpec.
- **Memoria.** El Archivo preserva intencion, contexto, decisiones, principios, patrones y consecuencias.
- **No es runtime.** Pekin no escribe codigo, no despliega apps, no ejecuta workflows.
- **Es regenerable.** Si todo el codigo se perdiera, Pekin contiene los principios para reconstruirlo.

Pekin es parcialmente aspiracional: sus instituciones (Archivo, Academia, Cauce, Senado, etc.) estan documentadas pero la mayoria no tiene implementacion operativa. El Archivo es la unica plenamente funcional.

---

## 3. QUE ES LEGOLAND

Legoland (La Armeria) es una de las 10 Instituciones de Pekin. Es el **sistema de catalogacion y certificacion** de componentes reutilizables (legos).

Su catalogo (`reference/legoland-catalogo.md`) clasifica cada modulo por tipo, ubicacion, madurez y drift. Define:

- 17 prefijos canonicos de ID (usr_, cnt_, opp_, pip_, etc.)
- 28 eventos canonicos DomainEvent
- Taxonomia de engines, providers, apps y verticals
- Deteccion de fugas (provider code fuera de su boundary)

Legoland es la lente a traves de la cual Pekin ve sus componentes tecnicos. Es tambien la herramienta para detectar drift arquitectonico.

---

## 4. MODULOS CORE

Estos modulos son el **nucleo irreducible** de CURDEECLAU. No deben separarse jamas:

| Modulo | Razon |
|--------|-------|
| `packages/shared/` | Contratos canonicos. Todos los engines dependen de el. |
| `packages/engines/workflow-orchestrator/` | Sistema nervioso central. Coordina todos los engines. |
| `packages/engines/handoff-engine/` | Gobernanza AI/HUMANO. Unico en su tipo. Mas completo y testeado. |
| `packages/engines/message-buffer-engine/` | Buffer deterministico puro. Sin dependencias externas. |
| `.claude/memory/` | Pekin mismo. La autoridad constitucional. |

Secundarios core (alta reutilizacion, arquitectonicamente alineados):

| Modulo | Razon |
|--------|-------|
| `packages/engines/calendar-engine/` | Motor de calendario generico. 14 source files, 7 tests. |
| `packages/engines/crm-engine/` | Motor CRM generico. 12 source files, 7 tests. |
| `packages/knowledge-engine/` | RAG agnostico de vertical. |
| `packages/memory/semantic-memory/` | Memoria cross-sesion con FTS y trust scoring. |

---

## 5. MODULOS APP/PRODUCTO

Estos son **productos finales** que consumen (o deberian consumir) los modulos core:

| Modulo | Estado | Recomendacion |
|--------|--------|---------------|
| `apps/dental-ai-receptionist/` | Activo. Next.js. Usa knowledge-engine. | Mantener. Pertenece a vertical dental. |
| `apps/quiniela-2026_deepclaude/` | Activo. Vite + React. No usa engines. | Archivar o migrar a consumir engines. |
| `apps/quiniela-2026/` | Esqueleto. Solo docs/. | Archivar. La version viva es deepclaude. |
| `apps/reducidas-2026/` | Estatico. Un solo HTML. | Archivar. |
| `apps/survivor-world-cup/` | Solo diseno. 7 MDs, cero codigo. | Archivar. |
| `verticals/dental/` | Activo. Configuracion completa. | Pertenece con dental-ai-receptionist. |

---

## 6. PATTERNS QUE SON INSTITUCIONES

De los 15 patterns auditados, **7 tienen evidencia real en codigo y merecen estatus institucional**:

| Pattern | Madurez | Evidencia |
|---------|---------|-----------|
| Ownership Propagation | Canonico | 69/69 tests, RT-4 cerrado. Tipos en shared, guards en 4 engines. |
| Engine | Estable | Contrato comun en 4 engines. Lifecycle FSM estandarizado. |
| Provider | Estable | Implementado en CRM, Calendar, GHL, Telegram. InMemory-first. |
| Event | Estable | DomainEvent con 7 campos. EventCatalog. Emitters por engine. |
| Identity Mapping | Estable | 17 prefijos. Branded types. Validacion de prefijos. |
| Config | Estable | Vertical dental completo: vertical.json, policies, states, knowledge. |
| Adapter | Estable | GHLClient, TelegramProvider, YCloudSender, PineconeRAGAdapter. |

**3 patterns son parciales** (tienen codigo pero necesitan maduracion):

| Pattern | Problema |
|---------|----------|
| Workflow | Tipos duplicados (D-001, D-002). Blueprints en n8n JSON, no consumibles por el orchestrator. |
| Runtime | Tipos en shared, pero sin implementacion concreta. Engines manejan su propio lifecycle. |
| Multitenant | tenantId fluye en eventos, pero sin provisioning, registry ni isolation runtime. |

**2 patterns no deberian ser instituciones todavia:**

| Pattern | Razon |
|---------|-------|
| Agent | Solo existe como JSON de n8n. Sin abstraccion en codigo. |
| Repository | Una sola implementacion (LeadsRepository). Sin interfaz, sin patron DDD. |

---

## 7. NOMBRES DESALINEADOS

| Hallazgo | Problema | Recomendacion |
|----------|----------|---------------|
| `telegram-provider/` en `packages/engines/` | Un provider en directorio de engines | Mover a `providers/` cuando se reorganice |
| `ghl-engine/` en `packages/engines/` | Es un provider, no un engine de dominio | Mover a `providers/` cuando se reorganice |
| `algorithmus-core-engine/` | Nombre sugiere algo mas pequeno de lo que es (runtime conversacional completo) | Evaluar renombrar a `algorithmus-runtime/` |
| `math-engine/` en `packages/` | Python, sin package.json, fuera del toolchain pnpm | Mover a `apps/` o extraer a repo propio |
| `knowledge-engine/` fuera de `packages/engines/` | Es un engine de dominio, pero vive en `packages/` raiz | Mover a `engines/` cuando se reorganice |
| `memory/semantic-memory/` | Directorio `memory/` actua como namespace sin ser workspace | Estructuralmente correcto, documentar |

---

## 8. QUE NO DEBE MOVERSE TODAVIA

- **Ningun engine.** La arquitectura actual funciona. Los tests pasan. Reorganizar sin valor inmediato es riesgo puro.
- **Ningun provider.** Mismo principio.
- **Ningun package.json, tsconfig, o config de build.** El toolchain funciona.
- **Ningun archivo en `.claude/memory/institutional/`.** Ya esta gobernado.
- **Ningun archivo en `docs/archive/`.** Phase E ya los movio.

Solo dos movimientos de dokumentacion se consideran seguros y alineados con ADR-000:

1. **Archivar STATE.md** a `docs/archive/state-md-historical.md`. Su contenido ya fue absorbido por `.claude/memory/operational/` y `.claude/memory/reference/`. Su presencia en la raiz crea doble autoridad.
2. **Archivar docs/governance/ residual** (README.md y canonical-definitions.md marcados SUPERSEDIDO) a `docs/archive/`.

Ambos requieren autorizacion explicita. No ejecutar sin orden.

---

## 9. RECOMENDACION DE SIGUIENTE PASO CONTROLADO

**ORG-1B — Documentation Cleanup (alcance minimo):**

1. Archivar `STATE.md` -> `docs/archive/state-md-historical.md`
2. Archivar `docs/governance/README.md` y `docs/governance/canonical-definitions.md` -> `docs/archive/`
3. Eliminar directorio `docs/governance/` (vacio tras archival)
4. Actualizar `MEMORY.md` y `estado-actual.md` para reflejar el archival
5. Commit atomico

**NO incluye:**
- Mover codigo
- Renombrar paquetes
- Reorganizar carpetas
- Cambiar remotes
- Crear nuevos layers (foundation/, runtime/, providers/, etc.)

La propuesta de topologia (Agente 4) queda como **referencia conceptual** para cuando se autorice reorganizacion fisica. No ejecutar antes de que exista un ADR que la ratifique.

---

*Fin del ORG-1A Synthesis Report*
*Generado el 2026-06-13 por ORG-1A Orchestrator*
