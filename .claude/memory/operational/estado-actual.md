# ESTADO ACTUAL

> Tipo: operational
> Version: 1.0.0
> Creado: 2026-06-11
> Actualizado: 2026-06-14
> Autoridad vigente: Constitucion de Pekin

---

## CHECKPOINT POST-ABSORCION LEGACY

### Fundacion de Pekin: CERRADA

- Constitucion, Principios, Instituciones ratificados (2026-06-07)
- ADN de Pekin registrado
- MEMORY.md como puerta de entrada universal
- DNA de 3 verticales + 2 productos registrados

### Absorcion RT-1.5/OpenSpec: COMPLETADA

| Fase | Alcance | Estado |
|------|---------|--------|
| Phase A | 7 documentos legacy marcados SUPERSEDIDO | Commiteado |
| Phase B | 5 patrones + catalogos absorbidos | Commiteado |
| Phase C | 4 auditorias + drift catalog absorbidos | Commiteado |
| Phase D | 6 referencias + convenciones absorbidas | Commiteado |
| Phase F | ADR-000 ratificado | Commiteado |

### Doble gobernanza: RESUELTA

- Pekin es la unica autoridad constitucional activa
- RT-1.5/OpenSpec supersedido como autoridad
- OpenSpec preservado como proceso tecnico

---

## PHASE E — ARCHIVAL: COMPLETADA

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| Autoridad | ADR-000 |
| Commit | 4d8daa5 |
| Archivos movidos | 4 |
| Archivos creados | 1 (docs/archive/README.md) |
| Conocimiento eliminado | Cero |

---

## ORG-1A — REPOSITORY AUDIT: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| Reporte | operational/reports/org1a-synthesis-report.md |
| Conclusion | CURDEECLAU-MONOREPO es el nombre correcto. Pekin es la autoridad. Legoland es el catalogo. No se autoriza mover codigo todavia. |

---

## ORG-1B — DOCUMENTATION CLEANUP: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| Commit | 7a6d860 |
| Archivos archivados | 3 (STATE.md, governance/README.md, canonical-definitions.md) |
| Codigo modificado | Cero |

---

## ORG-1C — OPERATIONAL REPORTS: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| Commit | 681d101 |
| Reportes preservados | 2 (adr-triage-report.md, org1a-synthesis-report.md) |

---

## GOV-1 — GOVERNANCE LEVEL 2: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| Commit | 0620587 |
| Archivo creado | institutional/governance.md (14 secciones) |

---

## NAT-1 — NATURALIZATION FRAMEWORK: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| Commit | 2a5eef0 |
| Archivos creados | 7 (README + TEMPLATE + 5 fichas) |
| Fichas | GHL (Allied), Telegram (Naturalized Candidate), Supabase (Naturalized Candidate), OpenAI (Allied), Pinecone (Referenced) |

---

## DNA-1 — DNA TEMPLATES: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| Archivos creados | 8 (README + 7 templates) |
| Templates | Engine, Provider, Agent, App, Workflow, Pattern, Integration |
| Codigo modificado | Cero |
| Commit | 4b69577 |

---

## MAP-1 — SYSTEM MAP: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| Archivo creado | `reference/mapa-sistemas.md` (15 secciones) |
| Basado en | ORG-1A Repository Identity Audit |
| Codigo modificado | Cero |
| Commit | 8e32b3b |

---

## RUN-1 -- INITIAL RUNBOOKS: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| Archivos creados | 8 (README + 7 runbooks) |
| Runbooks | phase-closure, document-archival, operational-report, working-tree, adr-decision, handoff, no-code-change |
| Codigo modificado | Cero |
| Commit | Pendiente de commit |

---

## RISK-1 -- TECHNICAL RISK TRIAGE: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| Archivo creado | operational/reports/risk-1-technical-triage-report.md |
| Riesgos clasificados | 10 (2 P0, 2 P1, 3 P2, 3 P3) |
| Codigo modificado | Cero |
| Commit | Pendiente de commit |

---

## ADR-DOMAIN-EVENT-1 -- CANONICAL DOMAINEVENT: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| ADR | ADR-DOMAIN-EVENT-1 |
| Decision | shared/ es autoridad canonica exclusiva de DomainEvent |
| Wrapper orchestrator | Valido como helper (no es redefinicion) |
| Import desviado | telegram-provider (1 archivo) |
| Codigo modificado | Cero |
| Commit | Pendiente de commit |

---

## FIX-DOMAIN-EVENT-1 -- IMPORT CORREGIDO: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| Archivo modificado | telegram-provider/src/run.ts (1 linea) |
| Cambio | DomainEvent import de @curdeeclau/workflow-orchestrator a @curdeeclau/shared |
| Typecheck | shared, orchestrator, telegram — pasan |
| Tests | 115 pasan, 15 skipped (Postgres), 0 fallan |
| Commit | Pendiente de commit |

---

## ADR-LLM-1 -- CANONICAL LLM PROVIDER: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| ADR | ADR-LLM-1 |
| Decision | LLMProvider y EmbeddingProvider en shared/. Embeddings interfaz separada. Streaming/tool calling diferidos a v2. |
| Acoplamientos detectados | LLMGateway (tipos locales), EmbeddingService (skeleton), semantic-memory (OpenAI directo) |
| Codigo modificado | Cero |
| Commit | Pendiente de commit |

---

## LLM-1 -- LLM PROVIDER CONTRACTS: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| Archivos creados | 4 (LLMProvider.ts, EmbeddingProvider.ts, index.ts, llm.test.ts) |
| Typecheck | Pasa |
| Tests | 64 pasan (55 + 9 LLM), 0 fallan |
| Engines/Apps tocados | Cero |
| Dependencias externas | Cero |
| Commit | Pendiente de commit |

---

## ADR-LLM-2 -- MULTI-PROVIDER LLM STRATEGY: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| ADR | ADR-LLM-2 |
| Decision | OpenRouter-first, not OpenRouter-only. LLMProvider canonico. OpenAI/DeepSeek/Claude como fallbacks. |
| Ficha OpenRouter | procedural/naturalizacion/openrouter.md (Allied candidate) |
| Ficha OpenAI actualizada | Secciones 18-19 (rutas de consumo via OpenRouter + directo) |
| Codigo modificado | Cero |
| Commit | Pendiente de commit |

---

## LLM-2 -- OPENROUTER ADAPTER: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-13 |
| Adapter | OpenRouterAdapter en algorithmus-core-engine/src/infra/providers/openrouter/ |
| Contrato | Implementa LLMProvider de shared/ |
| Tests | 11 pasan (fake HTTP), 0 fallan |
| LLamadas reales | Cero |
| Credenciales | Cero |
| Engines/Apps migrados | Cero |
| Commit | Pendiente de commit |

---

## LLM-3 -- OPENAI DIRECT ADAPTER: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-14 |
| Adapter | OpenAIAdapter en algorithmus-core-engine/src/infra/providers/openai/ |
| Contrato | Implementa LLMProvider de shared/ |
| Tests | 11 pasan (fake HTTP), 0 fallan |
| LLamadas reales | Cero |
| Credenciales | Cero |
| Engines/Apps migrados | Cero |
| Dependencias externas | Cero (usa fetch nativo) |
| Commit | Pendiente de commit |

---

## LLM-4 -- DEEPSEEK ADAPTER: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-14 |
| Adapter | DeepSeekAdapter en algorithmus-core-engine/src/infra/providers/deepseek/ |
| Contrato | Implementa LLMProvider de shared/ |
| Tests | 13 pasan (fake HTTP), 0 fallan |
| LLamadas reales | Cero |
| Credenciales | Cero |
| Engines/Apps migrados | Cero |
| Dependencias externas | Cero (usa fetch nativo) |
| Commit | Pendiente de commit |

---

## DNA-LLM-1 -- LLM FAMILY DNA: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-14 |
| Autoridad | ADR-LLM-1, ADR-LLM-2 |
| Activos documentados | 5 (LLMProvider, EmbeddingProvider, OpenRouterAdapter, OpenAIAdapter, DeepSeekAdapter) |
| Archivos creados | 6 (README + 5 fichas DNA) |
| Codigo modificado | Cero |
| Evidencia usada | ADR-LLM-1, ADR-LLM-2, codigo fuente, tests, fichas de naturalizacion |
| Commit | Pendiente de commit |

**Resumen:** DNA-LLM-1 documenta la identidad institucional de la familia LLM. Cada activo tiene ficha DNA con: proposito, responsabilidades, exclusiones, riesgos, evidencia, tests, relacion con Pekin, ADRs y naturalizacion, y como regenerarlo si se pierde.

**Hallazgos:**
- LLMProvider es el contrato canonico. 3 adapters lo implementan. 9 tests pasan.
- EmbeddingProvider esta implementado como contrato, pero sin adapter operativo.
- Los 3 adapters comparten patron estructural identico: `HttpFetch` inyectable, `LLMProviderError`, timeout, mapeo OpenAI-compatible.
- Ningun adapter ha ejecutado llamadas reales. Todos operan con fake HTTP en tests.
- La familia LLM esta lista para recibir LLM-5 (AnthropicAdapter), LLM-RTR-1 (Router) y LLM-MIG-1 (migracion de consumidores).

---


- No mover codigo, packages, engines ni providers
- No renombrar paquetes ni carpetas
- No ejecutar topologia propuesta en ORG-1A sin ADR que la ratifique
- No crear nuevas capas de gobernanza fuera de .claude/memory/
- No cambiar remote sin autorizacion explicita
- UV-1 y AdmissionFlow sin cambios
- No iniciar PWA sin autorizacion

---

## ARCHIVO DE PEKIN — INVENTARIO

| Capa | Archivos |
|------|----------|
| institutional/ | 5 (constitucion, principios, instituciones, governance, ADN pekin) |
| institutional/dna/ | 6 (pekin + 3 verticales + 2 productos) |
| institutional/adr/ | 4 (ADR-000, ADR-DOMAIN-EVENT-1, ADR-LLM-1, ADR-LLM-2) |
| reference/ | 7 (catalogo-eventos, rt4-closure, legoland, uv1-directive, rt-1.6-drift, mapa-sistemas) |
| pattern/ | 6 (ownership, runtime, engine, orchestration, fsm-authority, +1) |
| operational/ | 4 (estado-actual, drift-catalog, 2 auditorias) |
| operational/reports/ | 3 (adr-triage-report, org1a-synthesis-report) |
| procedural/ | 2 (invariant-conventions, openspec-process) |
| procedural/naturalizacion/ | 9 (README, TEMPLATE + 6 fichas) |
| procedural/dna/ | 8 (README + 7 templates) |
| dna/llm/ | 6 (README + 5 fichas LLM family DNA) |
| procedural/runbooks/ | 9 (README + 8 runbooks) |

---

## PENDIENTES DESTACADOS

- **LLM-RTR-1 — LLMRouter v1:** Habilitar seleccion multi-provider real con los 4 adapters.
- **LLM-MIG-1 — Migration:** Migrar consumidores existentes detras de `LLMProvider`.

---

## LLM-5 — ANTHROPIC ADAPTER PREMIUM: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-14 |
| Adapter | AnthropicAdapter en algorithmus-core-engine/src/infra/providers/anthropic/ |
| Contrato | Implementa LLMProvider de shared/ |
| Tests | 18 pasan (fake HTTP), 0 fallan |
| LLamadas reales | Cero |
| Credenciales | Cero |
| Engines/Apps migrados | Cero |
| Dependencias externas | Cero (usa fetch nativo) |
| API | Anthropic Messages (no OpenAI-compatible) |
| Ficha naturalizacion | procedural/naturalizacion/anthropic.md |
| DNA | dna/llm/AnthropicAdapter.dna.md |
| Commit | Pendiente de commit |

**Resumen:** LLM-5 completa la familia de 4 adapters LLM (OpenRouter gateway, OpenAI directo, DeepSeek economico, Anthropic premium). AnthropicAdapter es el unico adapter que NO usa API OpenAI-compatible — mapea la API Messages de Anthropic con system como top-level param, x-api-key header, anthropic-version, y response content[] arrays. 53 tests totales entre los 4 adapters (18 Anthropic + 13 DeepSeek + 11 OpenAI + 11 OpenRouter).

---

## LLM-RTR-1 — LLM ROUTER v1: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-14 |
| Router | LLMRouter en algorithmus-core-engine/src/core/llm/LLMRouter.ts |
| Dependencia | LLMProvider de shared/ |
| Providers | Inyectados via register() — sin instanciacion interna |
| Estrategias | default, cheap, premium, reasoning, specificProvider |
| Fallback | Automatico en errores retryable. Secuencia configurable via fallbackSequence. |
| Tests | 28 pasan (mock providers), 0 fallan |
| Llamadas reales | Cero |
| Credenciales | Cero |
| APIs conectadas | Cero |
| Apps migradas | Cero |
| semantic-memory modificado | Cero |
| Adaptadores modificados | AnthropicAdapter (fix tipos filter/map, no logica) |
| DNA | dna/llm/LLMRouter.dna.md |
| Commit | Pendiente de commit |

**Resumen:** LLM-RTR-1 implementa la capa interna de seleccion multi-provider prevista en ADR-LLM-2. LLMRouter opera sobre instancias de LLMProvider inyectadas, selecciona por estrategia simple (default → openrouter, cheap → deepseek, premium/reasoning → anthropic), y aplica fallback automatico en errores retryable. No conoce endpoints, no maneja credenciales, no llama APIs. 81 tests totales entre router + 4 adapters. Typecheck: solo TS2307 preexistentes (workspace resolution de @curdeeclau/shared).

---

## UV-0 — UNIVERSIDAD LATINO DEMO SCOPE: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-14 |
| Documento | projects/universidad-latino/UV-0-demo-scope.md (15 secciones) |
| Tipo | Documental — cero codigo |
| Flujo definido | Prospecto → IA → LeadStore → CRM → GHL → Pipeline → Seguimiento |
| Carreras | 10 en oferta minima |
| Preguntas frecuentes | 23 preguntas clasificadas en 5 categorias |
| Datos del lead | 9 campos (5 requeridos, 3 recomendados, 1 opcional) |
| Pipeline GHL | 7 etapas |
| Criterios de exito | 10 (6 tecnicos, 4 comerciales) |
| Riesgos | 6 identificados con mitigacion |
| Fases siguientes | UV-1 (captura + sync), UV-2 (asistente IA), UV-DEMO (demo integrada) |
| Codigo modificado | Cero |
| APIs conectadas | Cero |
| Credenciales | Cero |
| Commit | Pendiente de commit |

**Resumen:** UV-0 define el alcance comercial y funcional de la demo de admisiones de Universidad Latino con GHL. Pekin ya tiene los motores (LLM, CRM, GHL, WhatsApp). UV-0 define que construir con ellos para un caso de negocio real. UV-1 implementara la captura y sincronizacion. UV-2 implementara el asistente IA.

---

## UV-1 — LEAD CAPTURE + GHL SYNC: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-14 |
| Servicio | LeadCaptureService en algorithmus-core-engine/src/core/leads/ |
| Dependencias | LeadStore + GHLContactSync (interfaces inyectables) |
| GHLClient | findContactByPhone + updateContact implementados (eran stubs) |
| Validacion | 5 campos requeridos + formato E.164 + enums |
| Normalizacion | Inferencia de nivel_interes, split first/last name, E.164 |
| Dedup | Por telefono (local + GHL). Upsert sin crear duplicados. |
| Tags | 7 tags: 3 base + canal + carrera + interes + horario |
| Pipeline | Nuevo prospecto (stage inicial UV-0) |
| Logs | Pino estructurado con mascara de telefono |
| Tests | 36 pasan (mock LeadStore + mock GHL), 0 fallan |
| Engine tests | 163 pasan, 12 suites, 0 fallan |
| Typecheck | Solo TS2307 preexistentes |
| GHL real | Cero llamadas |
| Credenciales | Cero |
| IA | No implementada (UV-2) |
| Commit | Pendiente de commit |

**Resumen:** UV-1 implementa la captura de leads de Universidad Latino con validacion completa (5 campos requeridos, E.164, enums de UV-0), normalizacion, persistencia local (LeadStore inyectable), sincronizacion GHL con dedup (findContactByPhone + create/update), tags estructurados (7 tags), y logs con mascara de telefono. GHLClient extendido con findContactByPhone y updateContact (eran stubs BV-1.03). 36 tests con mocks. Cero APIs reales, cero credenciales, cero IA.

---

## UV-2 — AI ADMISSIONS ASSISTANT: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | 2026-06-14 |
| Asistente | AIAdmissionsAssistant en algorithmus-core-engine/src/core/admissions/ |
| LLM | LLMProvider inyectado (mock en tests) |
| Captura | LeadCaptureFn inyectado → delega a LeadCaptureService (UV-1) |
| Conocimiento | Estatico versionado en verticals/universidad-latino/knowledge/ |
| Prompt | Template versionado en verticals/universidad-latino/prompts/ |
| Estados | GREETING → COLLECTING → CONFIRMING → CAPTURING → DONE/ERROR |
| Extraccion | Heuristicas: E.164 regex, keywords de carreras, horarios, canales |
| Fallback LLM | Respuesta generica si LLM falla. Estado preservado. |
| Vertical | Creado: PRODUCT_DNA, CLIENT_DNA, FAQ, oferta-academica, flows, prompts |
| Tests | 25 pasan (mock LLMProvider + mock captureFn), 0 fallan |
| Engine tests | 188 pasan, 13 suites, 0 fallan |
| Typecheck | Solo TS2307 preexistentes |
| APIs reales | Cero |
| Credenciales | Cero |
| GHL directo | Cero — el asistente no conoce GHL |
| Commit | Pendiente de commit |

**Resumen:** UV-2 implementa el asistente conversacional de admisiones de Universidad Latino. Usa LLMProvider inyectado para generacion de lenguaje natural, conocimiento estatico versionado (FAQ + oferta academica en verticals/), maquina de estados (GREETING→COLLECTING→CONFIRMING→CAPTURING→DONE/ERROR), extraccion de datos por heuristicas (E.164, keywords de carreras/horarios/canales), y delegacion a LeadCaptureService (UV-1) para la captura final. No llama GHL directamente. 25 tests con mocks prueban 5 casos de aceptacion UV-2.

---

## SIGUIENTE LINEA RECOMENDADA

**UV-DEMO — Demo comercial integrada.** Conectar UV-1 + UV-2 en un flujo completo funcional. Preparar script de demo, datos de ejemplo, y entorno controlado para presentacion a Universidad Latino.

---

*Fin del Estado Actual v1.0.0*
