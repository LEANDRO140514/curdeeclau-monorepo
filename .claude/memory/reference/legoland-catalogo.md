# LEGOLAND CATÁLOGO

> Tipo: reference
> Versión: 1.0.0 — Absorción Phase D
> Creado: 2026-06-11
> Fuente legacy absorbida: `docs/governance/canonical-definitions.md` (RT-1.5, 2026-05-30, supersedido como autoridad activa)
> Autoridad vigente: Constitución de Pekín Article IX (7 niveles), Instituciones: La Armería (Legoland), El Registro Civil

---

## PROPÓSITO

Catalogar, clasificar y mapear todos los módulos, engines, providers, apps y verticales del monorepo. Este catálogo es la fuente de referencia para La Armería — qué existe, dónde está, qué tipo de lego es, y su nivel de madurez.

---

## TAXONOMÍA DEL MONOREPO

Bajo Pekín, los módulos del monorepo se clasifican en 7 niveles jerárquicos (Article IX):

| Nivel Pekín | Categoría técnica | Ubicación |
|-------------|------------------|-----------|
| Nivel 1 | Constitución + Principios + Instituciones | `.claude/memory/institutional/` |
| Nivel 2 | Gobernanza (reglas, ADRs, convenciones) | `CLAUDE.md`, `.cursor/rules/`, `institutional/adr/` |
| Nivel 3 | Distritos (instituciones en operación) | `.claude/memory/` (Archivo, Academia, Cauce, etc.) |
| Nivel 4 | Patrones | `.claude/memory/pattern/` |
| **Nivel 5** | **Legos (packages reutilizables)** | `packages/` |
| Nivel 6 | Skills | `.claude/commands/` |
| Nivel 7 | Productos y Verticales | `apps/`, `verticals/` |

---

## INVENTARIO DE LEGOS (NIVEL 5)

### Foundation — Contratos Canónicos

| Package | Nombre npm | Contenido | Madurez |
|---------|------------|-----------|---------|
| `packages/shared/` | `@curdeeclau/shared` | 17 ID types, DomainEvent, EventCatalog (38 eventos), Ownership, EngineContract, EngineLifecycle, CRM/Calendar/Workflow types | ✅ Activo |

**Reglas:** Cero dependencias runtime. Solo TypeScript + Vitest. Todo tipo runtime-visible se declara aquí primero.

---

### Runtime — Orquestación

| Package | Nombre npm | Contenido | Madurez |
|---------|------------|-----------|---------|
| `packages/engines/workflow-orchestrator/` | `@curdeeclau/workflow-orchestrator` | WorkflowOrchestrator, WorkflowExecutor, EventDispatcher, EngineRegistry, StateResolver | ✅ Activo |
| `packages/algorithmus/algorithmus-core-engine/` | `@curdeeclau/algorithmus-core-engine` | FSM Engine, IdentityManager, Orchestrator (LLM/RAG + validation), WhatsApp Worker | ✅ Activo (v1.x) |

---

### Engines — Lógica de Dominio Provider-Agnóstica

| Engine | Package | Entidades canónicas | Contrato Engine | Madurez |
|--------|---------|---------------------|-----------------|---------|
| CRM | `packages/engines/crm-engine/` | CRMContact, CRMOpportunity, CRMPipeline, CRMCampaign | ✅ | RT-4 completado |
| Calendar | `packages/engines/calendar-engine/` | Calendar, TimeSlot, Reservation, Reminder | ✅ | RT-4 completado |
| Handoff | `packages/engines/handoff-engine/` | Ownership, Suppression, Recovery | ✅ | RT-4 completado |
| Message Buffer | `packages/engines/message-buffer-engine/` | Buffer, Dedup, Debounce, Batch | ❌ (V-C3) | Activo |
| Knowledge | `packages/engines/knowledge-engine/` | Chunking, Embedding, Retrieval, MemoryWindow | ⬜ Spec | Diseño |
| GHL | `packages/engines/ghl-engine/` | GHLContact, GHLOpportunity (stub) | ❌ (V-O6) | Stub |
| Media Delivery | `packages/engines/media-delivery-engine/` | Image, PDF, Audio, Video delivery | ⬜ | Stub |

**Estructura canónica de un Engine:**
```
<nombre>-engine/
├── src/
│   ├── types.ts              ← Interfaces locales
│   ├── engine/<Name>Engine.ts ← Implementa Engine contract
│   ├── entities/ o managers/  ← Lógica de negocio
│   ├── providers/             ← Implementaciones de provider interfaces
│   ├── events/                ← Fábricas de DomainEvent
│   └── __tests__/
```

---

### Providers — Adaptadores de Sistemas Externos

| Provider | Implementa | Tipo | Ubicación |
|----------|-----------|------|-----------|
| `InMemoryCRMProvider` | `CRMProvider` | Memory | `crm-engine/src/providers/` |
| `PostgresCRMProvider` | `CRMProvider` | PostgreSQL | `telegram-provider/src/` ⚠️ |
| `GHLClient` | `GHLApiClient` | REST API | `ghl-engine/src/` |
| `InMemoryCalendarProvider` | `CalendarProvider` | Memory | `calendar-engine/src/providers/` |
| `TelegramProvider` | (entry) | Polling | `telegram-provider/src/` |
| `YCloudClient` | (WhatsApp) | HTTP | `algorithmus-core-engine/src/infra/` ⚠️ |
| `PineconeRAGAdapter` | `RAGVectorAdapter` | Vector DB | `algorithmus-core-engine/src/core/rag/` ⚠️ |
| `LeadsRepository` | (data access) | PostgreSQL | `algorithmus-core-engine/src/infra/` |

⚠️ = Provider leakage detectado (ver `operational/auditorias/leakage-audit-absorbed.md`)

**Reglas de Provider:**
1. `providerName: string` — siempre declarado explícitamente
2. `providerIds` separados de IDs canónicos
3. Provider failures usan `ProviderError` taxonomy
4. Providers NUNCA emiten `DomainEvent` directamente
5. Un provider puede depender de paquetes externos

---

### Apps — Artefactos Desplegables (Nivel 7)

| App | Stack | Estado |
|-----|-------|--------|
| `apps/dental-ai-receptionist/` | Next.js 16 + React 19 | Fase 2 (web channel) |
| `apps/quiniela-2026_deepclaude/` | Vite + React 19 + Zustand | v1.0 producción |
| `apps/landing_oraculo_society_forge/` | Next.js (submodule) | Desarrollo |

**Reglas:** Vive en `apps/`. Puede importar de cualquier package. Ningún package importa de una app. No define contratos ni tipos canónicos.

---

### Verticales — Configuración de Dominio (Nivel 7)

| Vertical | Dominio | Conocimiento | Estado |
|----------|---------|-------------|--------|
| `verticals/dental/` | Clínicas dentales (es-MX) | FAQ, procedimientos, terminología, emergencias, seguros, precios | v0.2.1 |

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

---

### Módulos Fuera del Cuerpo Central

| Elemento | Razón |
|----------|-------|
| `apps/quiniela-2026_deepclaude/` | Producto final de apuestas. No reutilizable como lego |
| `apps/reducidas-2026/` | Static HTML legacy |
| `apps/survivor-world-cup/` | Specs de producto |
| `packages/math-engine/` (Python) | Fuera del workspace pnpm |
| `workflows/blueprints/` (39 JSON) | n8n legacy — runtime paralelo |

---

## TIPOS DE ID CANÓNICOS

17 prefijos de ID definidos en `packages/shared/src/ids/EntityId.ts`:

| Prefijo | Entidad |
|---------|---------|
| `usr_` | User |
| `cnt_` | Contact |
| `opp_` | Opportunity |
| `pip_` | Pipeline |
| `cmp_` | Campaign |
| `evt_` | DomainEvent |
| `wfl_` | Workflow |
| `exec_` | Execution |
| `conv_` | Conversation |
| `msg_` | Message |
| `tnt_` | Tenant |
| `wsp_` | Workspace |
| `vrt_` | Vertical |
| `cal_` | Calendar |
| `tsl_` | TimeSlot |
| `rsv_` | Reservation |
| `rmd_` | Reminder |
| `avw_` | AvailabilityWindow |

---

## EVENT CATALOG — 38 Tipos Gobernados

Declarados en `packages/shared/src/runtime/EventCatalog.ts`. Ver `reference/catalogo-eventos.md` para el catálogo completo con estructura y reglas.

---

## RELACIÓN CON INSTITUCIONES DE PEKÍN

| Institución | Relación |
|-------------|----------|
| **La Armería** | Este catálogo es su herramienta primaria. Debe mantenerse actualizado con cada nuevo lego |
| **El Registro Civil** | Cada lego debe tener ADN registrado antes de operar (Principio III) |
| **La Aduana** | Providers listados aquí deben pasar por naturalización |
| **El Cauce** | El EventCatalog (38 eventos) es la fuente de verdad para el Flujo Gobernado |

---

## PENDIENTES / PREGUNTAS ABIERTAS

- [ ] Certificar legos maduros: ¿qué engines califican como "3+ verticales, 0 errores prod, tests completos"?
- [ ] Extraer providers externos de algorithmus-core-engine (YCloud, Pinecone, OpenAI) — backlog de La Aduana
- [ ] Mover `PostgresCRMProvider` de `telegram-provider/` a `crm-engine/providers/`
- [ ] Completar specs formales para engines en fase diseño (knowledge, ghl, media-delivery)
- [ ] Definir criterios de madurez: experimental → estable → certificado

---

*Fin del Legoland Catálogo v1.0.0*
*Absorbido de docs/governance/canonical-definitions.md (RT-1.5) bajo autoridad de la Constitución de Pekín*
