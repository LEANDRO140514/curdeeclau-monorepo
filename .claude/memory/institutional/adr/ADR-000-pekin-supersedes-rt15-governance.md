# ADR-000 — Pekín Supersedes RT-1.5 / OpenSpec Governance

> Tipo: institutional/adr
> Versión: 1.0.0 — Fundacional
> Ratificado: 2026-06-11
> Autoridad: Asamblea de Pekín
> Supersede: `openspec/governance/rt-constitution.md` (RT-1.5), `openspec/README.md` (OpenSpec governance claim)

---

## Estado

**ACEPTADO / RATIFICADO**

---

## Contexto

### Etapa pre-Pekín (RT-1.5 / OpenSpec)

CURDEECLAU operó inicialmente bajo un sistema de gobernanza técnica llamado RT-1.5 / OpenSpec. Este sistema:

- Definió una constitución técnica (`openspec/governance/rt-constitution.md`) con 10 artículos
- Estableció el modelo de engines, providers, eventos canónicos, ownership y orquestación
- Creó specs formales para ghl-engine (22 invariantes), calendar-engine (30 invariantes), knowledge-engine (25 invariantes)
- Documentó el runtime topology, drift catalog, leakage audit y enforcement readiness
- Permitió el cierre de RT-4 (Ownership Propagation Runtime) con 69/69 tests

### Fundación de Pekín

El 2026-06-07 se estableció Pekín como la capital institucional de CURDEECLAU, creando:

- **Constitución** (`constitucion.md`) — 13 artículos definiendo la civilización tecnológica
- **10 Principios** (`principios.md`) — leyes fundacionales no negociables
- **10 Instituciones** (`instituciones.md`) — sistemas permanentes de la civilización
- **ADN de Pekín** (`dna/pekin.md`) — identidad de la capital
- **MEMORY.md** — puerta de entrada universal para todo agente

### Detección de doble gobernanza

Durante la revisión del monorepo post-fundación se detectó que coexistían dos sistemas de gobernanza:

1. **Pekín Foundation** (`.claude/memory/`) — autoridad constitucional activa
2. **RT-1.5 / OpenSpec** (`openspec/governance/rt-constitution.md`) — capa de gobernanza pre-Pekín que declaraba su propia supremacía

Esta dualidad viola el **Artículo XI de la Constitución de Pekín (Principio de No Dispersión):** *"Ningún componente de CURDEECLAU puede declarar su propia constitución independiente."*

### Absorción institucional

Para resolver el conflicto sin destruir conocimiento, se ejecutó un plan de absorción en 4 fases (A, B, C, D):

- **Phase A:** 7 documentos legacy marcados como SUPERSEDIDO COMO AUTORIDAD ACTIVA
- **Phase B:** 5 patrones + catálogos absorbidos (eventos, ownership, runtime, engines, orquestación)
- **Phase C:** 4 documentos operacionales absorbidos (auditorías, drift catalog, RT-4 closure)
- **Phase D:** 6 documentos de referencia y proceso absorbidos (legoland, UV-1, RT-1.6, FSM, invariantes, OpenSpec process)

---

## Decisión

La Asamblea de Pekín declara:

1. **Pekín es la única autoridad constitucional activa de CURDEECLAU.** La Constitución de Pekín, sus 10 Principios y sus 10 Instituciones son la fuente suprema de gobernanza.

2. **RT-1.5 queda supersedido como constitución activa.** El documento `openspec/governance/rt-constitution.md` ya no tiene autoridad constitucional. Su contenido técnico permanece preservado como antecedente histórico y fuente de patrones.

3. **OpenSpec queda supersedido como capa de gobernanza activa.** OpenSpec ya no es "architectural governance layer". Sobrevive como proceso técnico de especificación bajo la autoridad de Pekín, al servicio de La Academia, La Aduana, La Armería y La Forja.

4. **El conocimiento técnico pre-Pekín fue absorbido por el Archivo.** 15 documentos de Pekín ahora contienen el conocimiento extraído de 17+ fuentes legacy. Cero conocimiento técnico fue destruido.

5. **Los documentos legacy pueden conservarse como referencia histórica o técnica**, pero no como fuente de gobernanza activa. Su encabezado de supersedencia lo declara explícitamente.

6. **Toda futura decisión de arquitectura, gobernanza, diseño o implementación debe subordinarse a la Constitución de Pekín.**

---

## Consecuencias

### Positivas

- ✅ Se elimina la doble autoridad constitucional
- ✅ Se preserva todo el conocimiento técnico pre-Pekín (cero eliminaciones)
- ✅ Se reduce la confusión de agentes nuevos — MEMORY.md es la única puerta de entrada
- ✅ Se consolida el Archivo de Pekín con 27 archivos poblados en 6 capas
- ✅ Se habilita Phase E (archival) con respaldo institucional
- ✅ OpenSpec sobrevive como herramienta técnica útil sin conflicto de autoridad

### Costos y riesgos

- ⚠️ 7 documentos legacy requieren mantenimiento de sus encabezados de supersedencia
- ⚠️ Agentes familiarizados con RT-1.5 pueden seguir citándolo si no leen MEMORY.md primero
- ⚠️ Algunas convenciones (naming, ID prefixes, lifecycle) deberán actualizarse progresivamente para alinearse con Pekín
- ⚠️ Phase E (archival) aún no se ha ejecutado — los documentos legacy siguen en sus ubicaciones originales

---

## Documentos supersedidos como autoridad activa

| Documento | Fecha supersedencia | Autoridad que lo supersede |
|-----------|-------------------|---------------------------|
| `openspec/governance/rt-constitution.md` | 2026-06-11 | `constitucion.md` Article XI |
| `openspec/README.md` | 2026-06-11 | `constitucion.md` + `MEMORY.md` |
| `docs/governance/README.md` | 2026-06-11 | `MEMORY.md` |
| `docs/governance/canonical-definitions.md` | 2026-06-11 | `constitucion.md` Article IX (7 niveles) |
| `docs/architecture/memory-governance.md` | 2026-06-11 | `principios.md` Principio II (Primacía de la Memoria) |
| `docs/naming-topology-normalization.md` | 2026-06-11 | `constitucion.md` (naming es Nivel 2, no Nivel 1) |
| `openspec/conventions/naming-conventions.md` | 2026-06-11 | `constitucion.md` (convenciones son Nivel 2) |

Todos conservan su contenido técnico. Solo pierden el claim de autoridad constitucional.

---

## Documentos absorbidos por Pekín

### Phase B — Critical Absorption (5 documentos)

| Destino Pekín | Fuente legacy | Tipo |
|---------------|---------------|------|
| `reference/catalogo-eventos.md` | `openspec/governance/event-model.md` | Catálogo |
| `pattern/ownership-propagation.md` | `openspec/governance/ownership-model.md` | Patrón |
| `pattern/runtime-semantics.md` | `openspec/governance/runtime-semantics.md` | Patrón |
| `pattern/engine-governance.md` | `openspec/governance/engine-governance.md` | Patrón |
| `pattern/workflow-orchestration.md` | `openspec/governance/orchestration-model.md` | Patrón |

### Phase C — Operational Absorption (4 documentos)

| Destino Pekín | Fuente legacy | Tipo |
|---------------|---------------|------|
| `operational/auditorias/leakage-audit-absorbed.md` | `docs/architecture/leakage-audit.md` | Auditoría |
| `operational/auditorias/constitutional-drift-audit-absorbed.md` | `docs/enforcement-readiness-assessment.md` | Auditoría |
| `operational/drift-catalog-absorbed.md` | `STATE.md` (drift section) | Operacional |
| `reference/rt4-closure-report.md` | `STATE.md` (RT-4 section) | Referencia |

### Phase D — Reference Absorption (6 documentos)

| Destino Pekín | Fuente legacy | Tipo |
|---------------|---------------|------|
| `reference/legoland-catalogo.md` | `docs/governance/canonical-definitions.md` | Catálogo |
| `reference/uv1-directive-reference.md` | `docs/governance/uv1-directive.md` | Referencia |
| `reference/rt-1.6-drift-closure-historical.md` | `docs/rt-1.6-constitutional-drift-closure.md` | Referencia |
| `pattern/fsm-authority.md` | `openspec/conventions/lifecycle-conventions.md` | Patrón |
| `procedural/invariant-conventions-absorbed.md` | `openspec/conventions/invariant-conventions.md` | Procedural |
| `procedural/openspec-process-absorbed.md` | `openspec/README.md` | Procedural |

---

## Reglas posteriores a este ADR

1. **Ningún documento legacy puede citarse como autoridad superior a Pekín.** Si un agente, engine, vertical o producto referencia RT-1.5 u OpenSpec como autoridad, debe corregirse.

2. **OpenSpec puede usarse como proceso técnico**, no como constitución. Sus templates, specs y convenciones son herramientas de ingeniería.

3. **RT-1.5 puede citarse como antecedente histórico** de la etapa Runtime/Engines. Es parte de la historia de CURDEECLAU.

4. **Todo nuevo agente debe entrar por `MEMORY.md`.** Es la puerta de entrada universal. Desde allí navega a Constitución, Principios, Patrones y Referencia.

5. **Toda nueva gobernanza debe residir bajo `.claude/memory/institutional/`.** No se crearán nuevas capas de gobernanza fuera del Archivo.

6. **Phase E (archival) solo puede ejecutarse después de este ADR.** Este ADR es la autorización constitucional para mover documentos legacy a `docs/archive/`.

---

## Relación con Phase E

Este ADR autoriza Phase E — el archivo de documentos legacy cuyos conocimientos ya fueron absorbidos:

- Mover documentos obsoletos o puramente históricos fuera de namespaces activos
- Preservar trazabilidad de lo movido (a dónde fue, por qué)
- Cero eliminación de conocimiento
- `docs/archive/README.md` como índice de lo archivado

Phase E NO debe ejecutarse sin autorización explícita posterior a este ADR.

---

## Pendientes post-ADR-000

- [ ] `institutional/governance.md` — documento de gobernanza operativa (Nivel 2)
- [ ] Templates de DNA para nuevos verticales, productos, engines y agentes
- [ ] **Phase E** — archival de documentos legacy absorbidos
- [ ] PWA Pekín Control Tower — dashboard institucional
- [ ] Memory System District — poblado completo de `operational/`, `procedural/runbooks/`, `procedural/naturalizacion/`
- [ ] Naturalization Framework formal — fichas de naturalización para GHL, Telegram, Supabase, OpenAI, Pinecone

---

*Fin del ADR-000 v1.0.0*
*Ratificado por la Asamblea de Pekín el 11 de junio de 2026*
