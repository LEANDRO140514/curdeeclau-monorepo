# CURDEECLAU — CANONICAL GOVERNANCE DEFINITIONS

> Derivadas del código real. No aspiracionales.
> Ratificado: 2026-05-30.

---

## 1. Foundation

**Definición canónica:**

Paquete sin dependencias runtime que establece los contratos, tipos, eventos, identificadores y políticas consumidos por todos los demás módulos. Es el único punto de acoplamiento permitido entre engines. No ejecuta lógica de negocio. No interactúa con sistemas externos.

**Implementación actual:** `packages/shared/` — `@curdeeclau/shared`

**Contenido:**
- `ids/EntityId.ts` — 17 branded ID types con prefijos
- `events/DomainEvent.ts` — Envelope canónico con tracing causal
- `runtime/EventCatalog.ts` — 38 tipos de eventos gobernados
- `runtime/Ownership.ts` — `AI | HUMAN | SHARED | LOCKED`
- `runtime/EngineContract.ts` — Interfaz `Engine`
- `runtime/EngineLifecycle.ts` — `UNINITIALIZED → READY → STOPPED`
- `crm/` — `CRMContact`, `CRMOpportunity`, `CRMPipeline`, `CRMCampaign`
- `calendar/` — `Calendar`, `TimeSlot`, `Reservation`, `Reminder`
- `workflow/` — `WorkflowState`, `WorkflowContext`

**Reglas:**
1. Cero dependencias externas.
2. Solo `typescript` y `vitest` como devDeps.
3. Todo tipo runtime-visible DEBE declararse aquí primero (invariante del EventCatalog).
4. Ningún engine puede definir tipos canónicos en archivos locales.

---

## 2. Runtime

**Definición canónica:**

Capa de orquestación que coordina múltiples engines, despacha eventos, gobierna el ciclo de vida del sistema y ejecuta workflows. No contiene lógica de negocio de dominio. No se acopla a providers específicos.

**Implementación actual:**
- `packages/engines/workflow-orchestrator/` — `@curdeeclau/workflow-orchestrator`
- `packages/algorithmus/algorithmus-core-engine/` — `@curdeeclau/algorithmus-core-engine`

**Contenido:**
- `WorkflowOrchestrator` — carga workflows, registra engines, ejecuta pasos
- `WorkflowExecutor` — itera pasos, evalúa condiciones, maneja fallos
- `EventDispatcher` — bus global de eventos (`on`, `off`, `dispatch`)
- `EngineRegistry` / `WorkflowRegistry` — registros runtime
- `StateResolver` — resuelve transiciones de state machine
- `RuntimeLifecycle` — `STARTING → ALIVE → DEGRADED → STOPPING → STOPPED`
- `OrchestrationPolicy` — `abort | skip | escalate | degrade`

**Reglas:**
1. Depende exclusivamente de Foundation (`@curdeeclau/shared`).
2. No conoce providers concretos (recibe engines por inyección).
3. No contiene lógica de negocio vertical-specific.
4. Todo side effect pasa por `DomainEvent` y el dispatcher.

---

## 3. Engine

**Definición canónica:**

Módulo que implementa el contrato `Engine` (`engineName`, `execute(action, context)`, `start/stop`) y encapsula lógica de negocio provider-agnóstica para un dominio específico. Delega persistencia y efectos externos a providers. Emite exactamente un `DomainEvent` por mutación.

**Implementaciones actuales:**
- `packages/engines/crm-engine/` — CRM (contacts, opportunities, pipelines, campaigns, tags)
- `packages/engines/calendar-engine/` — Calendario (availability, reservations, time slots, reminders)
- `packages/engines/handoff-engine/` — Handoff (ownership, suppression, recovery)
- `packages/engines/message-buffer-engine/` — Buffer (dedup, debounce, batch, flush)
- `packages/engines/knowledge-engine/` — RAG (chunking, embedding, retrieval)

**Estructura canónica:**

```
<nombre>-engine/
├── src/
│   ├── types.ts              ← Interfaces locales + Extract<RuntimeEventType>
│   ├── engine/<Name>Engine.ts ← Implementa Engine contract
│   ├── entities/ o managers/  ← Lógica de negocio (uno por entidad)
│   ├── providers/             ← Implementaciones de interfaces
│   ├── runtime/               ← Validación, event emitter, guards
│   ├── events/                ← Fábricas de DomainEvent
│   └── __tests__/
```

**Reglas:**
1. Depende de Foundation. Nunca de otro engine (salvo vía orchestrator).
2. No importa providers externos directamente — recibe interfaces.
3. Toda mutación tiene validación previa.
4. Estado interno solo vía eventos del orchestrator (ownership propagation).
5. `execute()` nunca lanza excepciones — retorna `{ error, message }`.

---

## 4. Provider

**Definición canónica:**

Implementación concreta de una interfaz definida por un Engine. Adapta sistemas externos (APIs, bases de datos, servicios) al contrato que el engine espera. Es intercambiable — el engine no conoce la implementación concreta.

**Implementaciones actuales:**

| Provider | Implementa | Tipo |
|---|---|---|
| `InMemoryCRMProvider` | `CRMProvider` | Memory |
| `PostgresCRMProvider` | `CRMProvider` | PostgreSQL |
| `GHLProviderPlaceholder` | `CRMProvider` | Stub |
| `GHLClient` | `GHLApiClient` | REST API |
| `InMemoryCalendarProvider` | `CalendarProvider` | Memory |
| `GoogleCalendarProvider` | `CalendarProvider` | Stub |
| `TelegramProvider` | (entry) | Polling |
| `YCloudClient` | (WhatsApp) | HTTP |
| `PineconeRAGAdapter` | `RAGVectorAdapter` | Vector DB |
| `LeadsRepository` | (data access) | PostgreSQL |

**Reglas:**
1. `providerName: string` — siempre declarado explícitamente.
2. `providerIds` separados de IDs canónicos (invariante I1).
3. Provider failures usan `ProviderError` taxonomy (`UNAVAILABLE | REJECTED | UNKNOWN`).
4. Providers NUNCA emiten `DomainEvent` directamente — retornan datos, el engine emite.
5. Un provider puede depender de paquetes externos (`pg`, `node-telegram-bot-api`, `@pinecone-database/pinecone`).

**Provider vs Engine — Límite:**

| Engine | Provider |
|---|---|
| Lógica de negocio | Acceso a sistemas externos |
| Validación | Transporte (HTTP, SQL, WebSocket) |
| Emisión de eventos | Respuesta cruda del sistema externo |
| Ownership guard | Sin conocimiento de ownership |
| Provider-agnóstico | Sistema-específico |

---

## 5. App

**Definición canónica:**

Artefacto desplegable con punto de entrada propio (`main.ts`, `server.ts`, `run.ts`, `next build`). Compone engines, providers y runtimes en una configuración concreta para un propósito específico. No es importado por ningún package. Puede tener su propio `package.json`, build system y variables de entorno.

**Implementaciones actuales:**
- `apps/dental-ai-receptionist/` — Next.js
- `apps/landing_oraculo_society_forge/` — Next.js (submodule)
- `apps/quiniela-2026_deepclaude/` — Vite SPA

**Reglas:**
1. Vive en `apps/`, nunca en `packages/`.
2. Puede importar de cualquier package en el workspace.
3. Ningún package puede importar de una app.
4. Tiene sus propias credenciales, `.env`, y configuración de deploy.
5. No define contratos, tipos canónicos ni interfaces reutilizables.

---

## 6. Vertical

**Definición canónica:**

Perfil de configuración que especializa el runtime genérico para un dominio de negocio específico (dental, académico, legal). Consiste en archivos JSON que definen: knowledge base, prompts del sistema, personalidad del agente, políticas de handoff, reglas de calendario, schemas de datos, state machines y manifiestos de herramientas. No contiene código ejecutable.

**Implementación actual:** `verticals/dental/`

**Estructura canónica:**

```
verticals/<nombre>/
├── manifest.json           ← Identidad del vertical
├── config/vertical.json    ← Parámetros de configuración
├── knowledge/              ← Base de conocimiento
├── prompts/                ← Personalidad, reglas de escalación
├── policies/               ← Políticas (calendar, handoff, media)
├── schemas/                ← Esquemas de datos específicos
├── states/                 ← State machine del vertical
├── tools/                  ← Herramientas disponibles
└── workflows/              ← Workflows del vertical
```

**Reglas:**
1. Un vertical no contiene TypeScript ejecutable.
2. Se carga en runtime por el orchestrator vía `verticalId`.
3. Múltiples verticales pueden coexistir sin modificar engines.
4. Los engines leen config del vertical, nunca hardcodean comportamiento vertical-specific.
5. `verticalId` se propaga en `DomainEvent`, `ExecutionContext`, `ConversationContext`.

---

## 7. Config

**Definición canónica:**

Archivo declarativo (JSON, YAML, `.env`) que parametriza el comportamiento de engines, providers y runtimes sin modificar código. Puede vivir en `verticals/<name>/config/`, en raíz de package (tsconfig, package.json), o en `.claude/settings.local.json`.

**Implementaciones actuales:**
- `verticals/dental/config/vertical.json`
- `verticals/dental/policies/calendar-policy.json`
- `verticals/dental/policies/handoff-policy.json`
- `verticals/dental/manifest.json`
- `.claude/settings.local.json`
- `.cursor/rules/*.mdc`
- `tsconfig.json` (por package)
- `.env` / `.env.example`

**Reglas:**
1. Config no contiene lógica condicional ejecutable.
2. Cambios de config no requieren recompilación.
3. Secrets en `.env`, nunca en config JSON commiteado.
4. `vertical.json` es el punto de entrada de configuración de un vertical.

---

## 8. Agent

**Definición canónica:**

Definición de un actor autónomo con un `systemPrompt`, un conjunto de `tools`, un `model` (LLM), y reglas de decisión (`policy`). Opera dentro de un vertical. Es invocado por el runtime, no se ejecuta como proceso independiente. Su comportamiento está gobernado por el FSM y las políticas de ownership del runtime.

**Implementaciones actuales:**
- `verticals/dental/prompts/receptionist.system.txt`
- `verticals/dental/prompts/receptionist.personality.json`
- `verticals/dental/prompts/escalation-rules.json`
- `verticals/dental/tools/manifest.json`

**Reglas:**
1. Un agente no es un proceso independiente — es invocado por el orchestrator.
2. Su `systemPrompt` se carga del vertical, no está hardcodeado.
3. Sus herramientas están declaradas en `tools/manifest.json`.
4. Respeta `SuppressionMode` y ownership — no actúa si está suprimido.
5. Las decisiones del agente pasan por `AIValidationLayer` antes de ejecutarse.

---

## 9. Workflow

**Definición canónica:**

Secuencia declarativa de pasos (`steps`) con condiciones, dependencias, timeouts y políticas de fallo. Define qué engines se ejecutan, en qué orden, con qué inputs. Un workflow se registra en el `WorkflowRegistry` y es ejecutado por el `WorkflowOrchestrator`.

**Implementaciones actuales:**
- `workflows/blueprints/` — 14 dominios con definiciones JSON
- `verticals/dental/workflows/manifest.json`
- `verticals/dental/workflows/sarah-runtime.manifest.json`
- `packages/engines/workflow-orchestrator/src/types.ts` — `WorkflowDefinition`, `WorkflowStep`

**Workflow vs Engine vs Agent:**

| Workflow | Engine | Agent |
|---|---|---|
| Orquestación (qué, cuándo) | Ejecución (cómo) | Decisión AI (qué decir/hacer) |
| Secuencia de pasos | Lógica de negocio | LLM + tools |
| Condiciones y branches | Validación y mutación | System prompt y policy |
| Stateless (pasos) | Stateful (entidades) | Stateless (invocación) |

**Reglas:**
1. Un workflow no contiene lógica de negocio — coordina engines.
2. Los pasos referencian engines por nombre (`engineName`).
3. Las condiciones usan el estado del `ExecutionContext`.
4. Timeouts y fallback steps están declarados en el paso.

---

## 10. Exclusiones — Qué NO pertenece al cuerpo central

**Principio:** Pertenece al cuerpo central si es un bloque reutilizable que múltiples verticales pueden necesitar.

### NO pertenece:

| Elemento | Razón |
|---|---|
| `apps/quiniela-2026_deepclaude/` | Producto final de apuestas deportivas |
| `apps/reducidas-2026/` | Static HTML, artefacto de distribución |
| `apps/survivor-world-cup/` | Specs de producto, no código reutilizable |
| `packages/math-engine/` (Python) | Fuera del workspace pnpm, ecosistema quiniela |
| `apps/quiniela-2026_deepclaude.zip` | Archivo comprimido, backup/quarantine |
| n8n blueprints en `workflows/blueprints/` | Runtime paralelo duplicando capacidades TypeScript |

### Pertenece PARCIALMENTE (requiere purga):

| Elemento | Qué queda | Qué sale |
|---|---|---|
| `knowledge-engine` | Chunking, embedding, retrieval genérico | Schemas dental-specific → `verticals/dental/schemas/` |
| `algorithmus-core-engine` | FSM + LLM Gateway + Validation pipeline | YCloud/Pinecone/OpenAI → `packages/providers/` |
| `telegram-provider` | Telegram polling + DomainEvent emission | `PostgresCRMProvider` → `crm-engine/providers/`, `GHLSyncService` → `providers/ghl-sync/` |

---

## Taxonomía canónica

```
FOUNDATION   →  @curdeeclau/shared
                Tipos, eventos, IDs, contratos. Cero deps.

RUNTIME      →  @curdeeclau/workflow-orchestrator
                @curdeeclau/algorithmus-core-engine
                Orquestación, event dispatch, lifecycle. No lógica de dominio.

ENGINE       →  crm-engine, calendar-engine, handoff-engine,
                message-buffer-engine, knowledge-engine
                Engine contract. Provider-agnóstico. Un dominio.

PROVIDER     →  InMemoryCRMProvider, PostgresCRMProvider, GHLClient,
                TelegramProvider, YCloudClient, PineconeRAGAdapter
                Adaptador externo. Implementa interfaz de engine.

APP          →  apps/*
                Desplegable. Entry point. No importado por packages.

VERTICAL     →  verticals/<name>/
                Config JSON. Knowledge, prompts, policies, schemas, tools.

CONFIG       →  *.json, .env, tsconfig.json, .cursor/rules/
                Declarativo. Sin lógica ejecutable.

AGENT        →  System prompt + tools + model + policy
                Invocado por runtime. Gobernado por FSM y ownership.

WORKFLOW     →  Secuencia de pasos con condiciones
                Coordina engines. Definido en JSON o TypeScript.

NO PERTENECE →  quiniela-2026, reducidas-2026, survivor-world-cup,
                math-engine (Python), n8n blueprints duplicados
```
