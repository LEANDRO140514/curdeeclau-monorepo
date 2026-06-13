# MEMORIA DE PEKÍN — Índice Central

> Tipo: reference (índice raíz)
> Versión: 1.0.0 — Fundacional
> Creado: 2026-06-06
> Actualizado: 2026-06-11
>
> **Regla de entrada:** Este es el primer documento que todo agente debe leer.
> Después de leer este índice, el agente debe leer `institutional/constitucion.md`
> y `institutional/principios.md` antes de ejecutar cualquier trabajo.

---

## BIENVENIDO A PEKÍN

Eres un agente operando en CURDEECLAU, una civilización tecnológica.

Tu primera responsabilidad no es escribir código.
Tu primera responsabilidad es entender la civilización en la que operas.

Este índice te guiará.

---

## LECTURA OBLIGATORIA (antes de cualquier trabajo)

1. **Este índice** — `MEMORY.md` (este archivo)
2. **La Constitución** — `institutional/constitucion.md`
   - Qué es CURDEECLAU
   - Qué es Pekín
   - Por qué existe
   - Qué preserva
3. **Los Principios** — `institutional/principios.md`
   - Las 10 leyes fundacionales
   - No son sugerencias — son leyes

---

## ESTRUCTURA DEL ARCHIVO

```
.claude/memory/
│
├── MEMORY.md                     ← ESTE ARCHIVO: puerta de entrada universal
│
├── institutional/                ← LO QUE PEKÍN ES (inmutable sin Asamblea)
│   ├── constitucion.md           ← La Constitución (lectura obligatoria #2)
│   ├── principios.md             ← 10 Principios Constitucionales (lectura obligatoria #3)
│   ├── instituciones.md          ← 10 Instituciones Fundamentales
│   ├── adr/                      ← Architecture Decision Records ratificadas
│   └── dna/                      ← ADN de verticales y productos
│       ├── pekin.md              ← ADN de la propia civilización
│       ├── vertical-algorithmus.md
│       ├── vertical-dental.md
│       ├── vertical-uv1.md
│       ├── producto-quiniela.md
│       └── producto-admissionflow.md
│
├── operational/                  ← LO QUE ESTÁ SUCEDIENDO (volátil)
│   ├── estado-actual.md          ← Checkpoint de trabajo en curso
│   ├── decisiones-pendientes.md  ← Decisiones no ratificadas
│   └── auditorias/               ← Hallazgos de auditorías
│
├── procedural/                   ← CÓMO SE HACEN LAS COSAS
│   ├── runbooks/                 ← Procedimientos de operación
│   ├── naturalizacion/           ← Fichas de naturalización por proveedor
│   ├── despliegue.md
│   └── onboarding-agentes.md
│
├── pattern/                      ← QUÉ SE REPITE
│   ├── provider-pattern.md
│   ├── event-sourcing.md
│   ├── fsm-authority.md
│   ├── fail-closed.md
│   ├── ownership-propagation.md
│   ├── idempotent-sync.md
│   ├── structured-logging.md
│   └── feature-first.md
│
└── reference/                    ← DÓNDE ESTÁN LAS COSAS
    ├── legoland-catalogo.md      ← Inventario de packages
    ├── mapa-sistemas.md          ← Dependencias entre engines
    ├── catalogo-eventos.md       ← EventCatalog anotado
    ├── skills-registro.md        ← Skills disponibles
    └── agentes-directorio.md     ← Agentes y capacidades
```

---

## QUÉ SIGNIFICA CADA CARPETA

| Carpeta | Es | No es |
|---------|----|-------|
| `institutional/` | Decisiones permanentes, principios, ADN, ADRs ratificadas | Sesiones de trabajo, decisiones de producto específico, código |
| `operational/` | Estado actual, trabajo en curso, hallazgos recientes | Principios, procedimientos maduros, patrones |
| `procedural/` | Runbooks, guías, fichas de naturalización | Decisiones de arquitectura, código, estado actual |
| `pattern/` | Abstracciones con 3+ ocurrencias en código | Una sola implementación, hipótesis sin evidencia |
| `reference/` | Mapas, índices, catálogos, punteros | Contenido original, decisiones, procedimientos |

---

## CICLO DE VIDA DEL CONOCIMIENTO

```
Experiencia → Observación → Decisión → Procedimiento → Skill → Patrón → Institución
     ↑                                                              ↑
   Crudo.                                                    Irreversible.
   Sin procesar.                                            Parte de Pekín.
```

- **operational/**: Observaciones y Decisiones (no ratificadas)
- **procedural/**: Procedimientos y Runbooks
- **pattern/**: Patrones (3+ ocurrencias en 3+ contextos)
- **institutional/**: Instituciones (ratificadas por Asamblea)

---

## REGLAS DE GOBERNANZA DEL ARCHIVO

1. **Nada se borra.** Lo revertido se marca `[DEROGADO]`. Lo obsoleto `[DEPRECADO]`. Lo superado `[SUPERSEDIDO]`.
2. **Todo documento declara:** tipo, versión, fecha de creación, fecha de revisión.
3. **Toda decisión cita:** alternativas consideradas, razones del descarte.
4. **Todo procedimiento referencia:** la decisión institucional que lo autoriza.
5. **Todo patrón evidencia:** 3+ ocurrencias concretas en el código.
6. **El Archivo no duplica:** código (git), commits (git log), tests (CI), configuraciones (.env).
7. **El Archivo sí preserva:** intención, contexto, decisiones, principios, patrones, consecuencias.
8. **Ningún agente escribe en `institutional/`** — solo la Asamblea.
9. **Consolidación obligatoria:** 3+ observaciones → decisión. 3+ decisiones → procedimiento. 3+ procedimientos → patrón.

---

## MEMORY PROFILES

| Entidad | Memoria | Retención | Escritura |
|---------|---------|-----------|-----------|
| Pekín | institutional, pattern, reference | Permanente | Solo Asamblea |
| Vertical | operational, procedural, DNA | Vida del vertical + 3 meses | Agentes del vertical |
| Producto | operational, procedural, DNA | Vida del producto + 3 meses | Agentes del producto |
| Agente | operational (scope sesión) | Duración de sesión | El propio agente |

---

## ESTADO ACTUAL DEL ARCHIVO

### Poblamiento completado (Fundación, 2026-06-07)
- [x] `institutional/constitucion.md`
- [x] `institutional/principios.md`
- [x] `institutional/instituciones.md`
- [x] `institutional/dna/pekin.md`
- [x] `MEMORY.md` (este archivo)

### Poblamiento completado (Registro Civil, 2026-06-11)
- [x] `institutional/dna/vertical-algorithmus.md`
- [x] `institutional/dna/vertical-dental.md`
- [x] `institutional/dna/vertical-uv1.md`
- [x] `institutional/dna/producto-quiniela.md`
- [x] `institutional/dna/producto-admissionflow.md`

### Poblamiento completado (Absorción Legacy RT-1.5/OpenSpec, 2026-06-11)

- [x] `institutional/adr/ADR-000-pekin-supersedes-rt15-governance.md` — Ratificado
- [x] `reference/catalogo-eventos.md` — 28 eventos canónicos, DomainEvent, causalidad
- [x] `reference/legoland-catalogo.md` — 17 ID types, 7 engines, 10 providers, taxonomía
- [x] `reference/rt4-closure-report.md` — RT-4 closure, 69/69 tests, 4 motores
- [x] `reference/uv1-directive-reference.md` — Contexto histórico UV-1
- [x] `reference/rt-1.6-drift-closure-historical.md` — Plan de remediación V-C1..V-C5
- [x] `pattern/ownership-propagation.md` — AI/HUMAN/SHARED/LOCKED, matriz de permisos
- [x] `pattern/runtime-semantics.md` — Estados, transiciones, recovery, side effects
- [x] `pattern/engine-governance.md` — Engine vs Provider, contrato, requisitos, ciclo de vida
- [x] `pattern/workflow-orchestration.md` — WorkflowOrchestrator, DAGs, state machines
- [x] `pattern/fsm-authority.md` — 5 lifecycle types, naming, estados terminales
- [x] `operational/auditorias/leakage-audit-absorbed.md` — 18 fugas, 6 categorías
- [x] `operational/auditorias/constitutional-drift-audit-absorbed.md` — V-C1..V-C5, V-O1..V-O7
- [x] `operational/drift-catalog-absorbed.md` — D-001..D-010 reclasificados
- [x] `operational/estado-actual.md` — Checkpoint post-absorción
- [x] `procedural/invariant-conventions-absorbed.md` — Formato MUST/SHALL/CANNOT
- [x] `procedural/openspec-process-absorbed.md` — OpenSpec como proceso técnico bajo Pekín

### Poblamiento completado (ORG-1 Monorepo Order Recovery, 2026-06-13)
- [x] ORG-1A — Repository + Module + Pattern Identity Audit
- [x] ORG-1B — Documentation cleanup (STATE.md + governance docs archived)
- [x] ORG-1C — Operational reports preserved in git

### Poblamiento completado (GOV-1 Governance Level 2, 2026-06-13)
- [x] `institutional/governance.md` — Governance Level 2 creado

### Poblamiento completado (NAT-1 Naturalization Framework, 2026-06-13)
- [x] `procedural/naturalizacion/` — README + TEMPLATE + 5 fichas (GHL, Telegram, Supabase, OpenAI, Pinecone)

### Poblamiento completado (DNA-1 DNA Templates, 2026-06-13)
- [x] `procedural/dna/` — README + 7 templates (Engine, Provider, Agent, App, Workflow, Pattern, Integration)

### Poblamiento completado (MAP-1 System Map, 2026-06-13)
- [x] `reference/mapa-sistemas.md` — Primer mapa institucional de sistemas

### Poblamiento pendiente (Proximos hitos)
- [ ] `procedural/runbooks/`
- [ ] Templates de DNA para engines, providers, agentes

---

## PARA AGENTES NUEVOS

Si eres un agente nuevo en CURDEECLAU:

1. **Lee este archivo primero.** Ya lo estás haciendo.
2. **Lee `institutional/constitucion.md`.** Entiende qué es esta civilización.
3. **Lee `institutional/principios.md`.** Conoce las 10 leyes que gobiernan todo.
4. **Lee `institutional/dna/pekin.md`.** Comprende la identidad de Pekín.
5. **Consulta `reference/`** para encontrar lo que necesitas.
6. **Nunca escribas en `institutional/`** sin autorización de la Asamblea.
7. **Registra tus decisiones** en `operational/`.
8. **Respeta los principios.** No son sugerencias.

---

*Fin del MEMORY.md v1.0.0*
*Puerta de entrada universal a la civilización CURDEECLAU*
