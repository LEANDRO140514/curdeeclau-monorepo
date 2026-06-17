# MEMORIA DE PEKÍN — Índice Central

> Tipo: reference (índice raíz)
> Versión: 1.0.0 — Fundacional
> Creado: 2026-06-06
> Actualizado: 2026-06-14
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

### Poblamiento completado (RUN-1 Initial Runbooks, 2026-06-13)
- [x] `procedural/runbooks/` — README + 7 runbooks operativos

### Poblamiento completado (RISK-1 Technical Risk Triage, 2026-06-13)
- [x] `operational/reports/risk-1-technical-triage-report.md` — 10 riesgos clasificados y priorizados

### Poblamiento completado (ADR-DOMAIN-EVENT-1, 2026-06-13)
- [x] `institutional/adr/ADR-DOMAIN-EVENT-1.md` — DomainEvent canonico ratificado

### Poblamiento completado (FIX-DOMAIN-EVENT-1, 2026-06-13)
- [x] FIX-DOMAIN-EVENT-1 — Import de DomainEvent corregido en telegram-provider

### Poblamiento completado (ADR-LLM-1, 2026-06-13)
- [x] `institutional/adr/ADR-LLM-1.md` — LLMProvider canonico ratificado

### Poblamiento completado (LLM-1 LLM Contracts, 2026-06-13)
- [x] `packages/shared/src/llm/` — LLMProvider + EmbeddingProvider + tests (64 pasan)

### Poblamiento completado (ADR-LLM-2 Multi-provider Strategy, 2026-06-13)
- [x] `institutional/adr/ADR-LLM-2.md` — Estrategia OpenRouter-first multi-provider ratificada
- [x] `procedural/naturalizacion/openrouter.md` — Ficha OpenRouter creada

### Poblamiento completado (LLM-2 OpenRouter Adapter, 2026-06-13)
- [x] `packages/algorithmus/algorithmus-core-engine/src/infra/providers/openrouter/` — OpenRouterAdapter + 11 tests

### Poblamiento completado (LLM-3 OpenAI Direct Adapter, 2026-06-14)
- [x] `packages/algorithmus/algorithmus-core-engine/src/infra/providers/openai/OpenAIAdapter.ts` — OpenAIAdapter + 11 tests

### Poblamiento completado (LLM-4 DeepSeek Adapter, 2026-06-14)
- [x] `packages/algorithmus/algorithmus-core-engine/src/infra/providers/deepseek/DeepSeekAdapter.ts` — DeepSeekAdapter + 13 tests
- [x] `procedural/naturalizacion/deepseek.md` — Ficha DeepSeek creada

### Poblamiento completado (DNA-LLM-1 LLM Family DNA, 2026-06-14)
- [x] `dna/llm/README.md` — LLM Family overview
- [x] `dna/llm/LLMProvider.dna.md` — Canonical contract DNA
- [x] `dna/llm/EmbeddingProvider.dna.md` — Canonical contract DNA
- [x] `dna/llm/OpenRouterAdapter.dna.md` — Gateway adapter DNA
- [x] `dna/llm/OpenAIAdapter.dna.md` — Direct fallback adapter DNA
- [x] `dna/llm/DeepSeekAdapter.dna.md` — Economic fallback adapter DNA

### Poblamiento completado (LLM-5 AnthropicAdapter Premium, 2026-06-14)
- [x] `packages/algorithmus/algorithmus-core-engine/src/infra/providers/anthropic/AnthropicAdapter.ts` — AnthropicAdapter + 18 tests
- [x] `procedural/naturalizacion/anthropic.md` — Ficha Anthropic creada
- [x] `dna/llm/AnthropicAdapter.dna.md` — DNA AnthropicAdapter creado

### Poblamiento completado (LLM-RTR-1 LLMRouter v1, 2026-06-14)
- [x] `packages/algorithmus/algorithmus-core-engine/src/core/llm/LLMRouter.ts` — LLMRouter + 28 tests
- [x] `dna/llm/LLMRouter.dna.md` — DNA LLMRouter creado

### Poblamiento completado (UV-0 Universidad Latino Demo Scope, 2026-06-14)
- [x] `projects/universidad-latino/UV-0-demo-scope.md` — Alcance documental de la demo comercial

### Poblamiento completado (UV-1 Lead Capture + GHL Sync, 2026-06-14)
- [x] `packages/algorithmus/algorithmus-core-engine/src/core/leads/LeadCaptureService.ts` — Servicio + 36 tests
- [x] `packages/engines/ghl-engine/src/GHLClient.ts` — findContactByPhone + updateContact implementados
- [x] `packages/algorithmus/algorithmus-core-engine/src/core/leads/types.ts` — Tipos UV-1

### Poblamiento completado (UV-2 AI Admissions Assistant, 2026-06-14)
- [x] `packages/algorithmus/algorithmus-core-engine/src/core/admissions/AIAdmissionsAssistant.ts` — Asistente + 25 tests
- [x] `packages/algorithmus/algorithmus-core-engine/src/core/admissions/types.ts` — Tipos UV-2
- [x] `verticals/universidad-latino/` — Vertical completo (DNA, knowledge, prompts, flows)

### Poblamiento completado (UV-DEMO Demo Comercial Integrada, 2026-06-14)
- [x] `verticals/universidad-latino/demo/` — README, demo script, sample leads, checklist
- [x] `packages/algorithmus/algorithmus-core-engine/src/demo/universidad-latino/runAdmissionsDemo.ts` — Demo runner + 10 tests

### Poblamiento completado (UV-CLOSE Cierre Documental, 2026-06-14)
- [x] `verticals/universidad-latino/demo/HANDOFF.md` — Handoff tecnico
- [x] `verticals/universidad-latino/demo/PRESENTATION_NOTES.md` — Notas comerciales
- [x] `verticals/universidad-latino/demo/NEXT_STEPS.md` — Proximos pasos controlados
- [x] Linea Universidad Latino cerrada como demo comercial lista para presentacion

### Poblamiento completado (UV-TELEGRAM Canal Telegram, 2026-06-14)
- [x] `packages/algorithmus/algorithmus-core-engine/src/demo/universidad-latino/runTelegramAdmissionsDemo.ts` — Runner Telegram + 18 tests
- [x] `verticals/universidad-latino/demo/TELEGRAM_SETUP.md` — Guia de configuracion Telegram

### Poblamiento completado (UV-KB-1 Knowledge Base Real, 2026-06-14)
- [x] `verticals/universidad-latino/knowledge/` — 8 archivos con datos reales del cliente
- [x] `verticals/universidad-latino/knowledge/sources/` — Referencia a archivos fuente

### Poblamiento completado (UV-LIVE Validacion Mock, 2026-06-14)
- [x] `verticals/universidad-latino/demo/TELEGRAM_LIVE_VALIDATION.md` — Guia de validacion live
- [x] Mock mode: 5 casos de prueba OK, 216 tests pasan
- [ ] Real Telegram: BLOCKED — `TELEGRAM_BOT_TOKEN` no configurado

### Poblamiento completado (GOV-0 Governance Baseline, 2026-06-16)
- [x] `CLAUDE.md` — Reescrito con identidad, jerarquia, reglas, LOOP Engineering
- [x] `STATE.md` — Creado en raiz: declaracion de estado real del monorepo
- [x] `institutional/IMPERIO_ARCHITECTURE.md` — Arquitectura del Imperio Algorithmus
- [x] `institutional/LOOP_ENGINEERING.md` — Sistema inmunologico de Pekin
- [x] `operational/estado-actual.md` — Actualizado con cierre GOV-0
- [x] `MEMORY.md` — Este resumen (este mismo bloque)

### Poblamiento completado (GOV-1 Battlefield Readiness, 2026-06-16)
- [x] `institutional/ELITE_GUERRERA.md` — Doctrina de Ocho Banderas, roles, límites
- [x] `institutional/CONSTRUCTOR_ENVIRONMENT.md` — Entorno local, constructores, filesystem
- [x] `institutional/EQUIPMENT_REGISTRY.md` — Skills (22+6+n8n), MCPs (16), Readiness Matrix
- [x] `institutional/MCP_ACTIVATION_RUNBOOK.md` — Activación/verificación segura de 16 MCPs
- [x] `institutional/SKILL_READINESS_RUNBOOK.md` — Revisión, creación, clasificación, n8n sync
- [x] `institutional/BATTLEFIELD_READINESS_CHECKLIST.md` — Checklist de entrada al campo
- [x] `institutional/SOVEREIGN_DATA_ORIGINS.md` — Ley de Dos Orígenes, Supabase/Insforge coexistencia
- [x] `institutional/IMPERIO_ARCHITECTURE.md` — Actualizado con Élite Guerrera y equipamiento
- [x] `institutional/LOOP_ENGINEERING.md` — Actualizado con herramientas de verificación
- [x] `.claude/skills/` — 6 battle skills creadas (verify, review, memory, model-routing, mcp-readiness, equipment-registry)
- [x] `CLAUDE.md` — Actualizado con equipamiento de batalla
- [x] `STATE.md` — Actualizado con estado de equipamiento GOV-1
- [x] `estado-actual.md` — Actualizado con checkpoint GOV-1
- [x] Doctrina Supabase/PostgreSQL corregida: activo gobernado, no restringido
- [x] Insforge incorporado como prioridad inmediata
- [x] 22 skills de producto: verificadas (0 existen, todas MISSING)
- [x] MCPs: 0 configurados. 16 clasificados con estado exacto. Docker disponible.
- [x] n8n Battle Pack: MCP PRIORITY_PENDING_DOCKER, skills PRIORITY_PENDING_NETWORK

### Poblamiento pendiente (Proximos hitos)
- [ ] UV-LIVE Real — Configurar `TELEGRAM_BOT_TOKEN` y ejecutar validacion real
- [ ] UV-WA-0 WhatsApp channel (requiere UV-LIVE real completado)
- [ ] LLM-MIG-1 Migracion de consumidores a LLMProvider/LLMRouter
- [ ] GOV-1 — Proximo nivel de gobernanza (refinamiento de harnesses y procedimientos)

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

## PARA TODOS LOS AGENTES (cada sesión)

**ANTES de escribir cualquier archivo o output**, ejecuta el checklist de inicio:

1. **Lee `procedural/session-startup.md`** — Checklist obligatorio de inicio de sesión.
2. **Ejecuta el Paso 2 (encoding de terminal)** — Sin esto, los caracteres Unicode (tildes, eñes, box-drawing) se corrompen en la salida.
3. **Verifica con `chcp`** que la página de códigos activa es 65001.

---

*Fin del MEMORY.md v1.0.0*
*Puerta de entrada universal a la civilización CURDEECLAU*
