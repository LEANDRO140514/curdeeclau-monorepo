# MAPA DE SISTEMAS — CURDEECLAU / PEKIN

> Tipo: reference
> Version: 1.0.0 — Inicial
> Creado: 2026-06-13
> Basado en: ORG-1A Repository Identity Audit
> Autoridad: Governance Level 2, Secciones 4 y 5
>
> **Estado del mapa:** Describe el sistema actual. No representa topologia final.
> **Actualizacion:** Debe revisarse tras ORG-2 o cualquier ADR de topologia.

---

## 1. PROPOSITO

Este mapa describe el estado actual del monorepo CURDEECLAU como sistema de componentes interconectados. No es una propuesta de reorganizacion. No es una topologia ideal futura. Es el plano de referencia para que cualquier agente entienda:

- Donde esta parado
- Que puede tocar y que no
- Que es core, que es app, que es externo
- Como se relacionan los componentes entre si
- Que esta activo, que esta archivado y que es candidato

---

## 2. LEYENDA

| Tipo | Simbolo | Definicion |
|------|---------|------------|
| **Pekin** | [PEK] | Capital institucional. `.claude/memory/` |
| **Foundation** | [FND] | Contratos inmutables compartidos. `packages/shared/` |
| **Runtime** | [RUN] | Orquestacion, event bus, FSM. `workflow-orchestrator` |
| **Engine** | [ENG] | Logica de dominio pura, provider-agnostica |
| **Provider** | [PRV] | Adapter de servicio externo |
| **Integration** | [INT] | Conexion entre sistemas CURDEECLAU o con externos |
| **App** | [APP] | Producto desplegable con UI y/o backend |
| **Vertical** | [VRT] | Configuracion de dominio + conocimiento |
| **External Platform** | [EXT] | Servicio externo utilizado por CURDEECLAU |
| **Archive** | [ARC] | Documento o codigo preservado historicamente |
| **Legacy** | [LEG] | Heredado, en proceso de migracion o archival |
| **Candidate** | [CAN] | Propuesto, no implementado o parcial |
| **Allied** | [ALL] | Externo utilizado, no completamente naturalizado |
| **Naturalized** | [NAT] | Externo integrado con adapter + ficha |

---

## 3. VISTA INSTITUCIONAL

```
                        ALGORITHMUS
                             |
                    CURDEECLAU / PEKIN
                    (.claude/memory/)
                        /        \
                 LEGOLAND          APPS / PRODUCTOS
            (packages/ reusable)    (apps/ + verticals/)
                /        \              |
           ENGINES    PROVIDERS    EXTERNAL PLATFORMS
        (domain logic) (adapters)  (GHL, Supabase, etc.)
```

Pekin gobierna. Legoland cataloga los componentes reutilizables. Las apps y productos consumen legos. Los providers envuelven plataformas externas. Los engines contienen logica de dominio.

---

## 4. VISTA ACTUAL DEL MONOREPO

```
curdeeclau-monorepo/
│
├── .claude/memory/                    [PEK] Capital institucional
│   ├── institutional/                 Constitucion, Principios, Instituciones, ADRs, DNA, Governance
│   ├── operational/                   Estado actual, auditorias, drift catalog, reports
│   ├── procedural/                    Naturalizacion, DNA templates, convenciones, runbooks
│   ├── pattern/                       Patrones documentados (ownership, runtime, engine, etc.)
│   └── reference/                     Catalogos, mapas, closure reports
│
├── packages/
│   ├── shared/                        [FND] Contratos canonicos. IDs, eventos, runtime types.
│   │
│   ├── engines/
│   │   ├── workflow-orchestrator/     [RUN] Sistema nervioso central. FSM, event dispatch.
│   │   ├── calendar-engine/           [ENG] Calendario provider-agnostico
│   │   ├── crm-engine/                [ENG] CRM provider-agnostico
│   │   ├── handoff-engine/            [ENG] Gobernanza AI/HUMANO
│   │   ├── message-buffer-engine/     [ENG] Buffer deterministico de mensajes
│   │   ├── media-delivery-engine/     [ENG] Envio multimedia (skeleton)
│   │   ├── ghl-engine/                [PRV] Adapter GoHighLevel (mal ubicado como engine)
│   │   ├── telegram-provider/         [PRV] Adapter Telegram Bot (mal ubicado como engine)
│   │   └── workflow-orchestrator/     [RUN] (listado duplicado, mismo modulo)
│   │
│   ├── algorithmus/
│   │   ├── algorithmus-core-engine/   [ENG] Runtime conversacional (nombre confuso)
│   │   └── algorithmus-platform/      [RUN] Plataforma de orquestacion (scaffolding)
│   │
│   ├── knowledge-engine/              [ENG] RAG engine (fuera de engines/)
│   ├── math-engine/                   [ENG] Python solver (fuera del toolchain pnpm)
│   └── memory/
│       └── semantic-memory/           [ENG] Memoria cross-sesion (fuera de engines/)
│
├── apps/
│   ├── dental-ai-receptionist/        [APP] Next.js. Vertical dental activo.
│   ├── quiniela-2026_deepclaude/      [APP] Vite + React. Producto de apuestas. No usa engines.
│   ├── quiniela-2026/                 [LEG] Esqueleto. Solo docs/. Archivable.
│   ├── reducidas-2026/                [LEG] HTML estatico. Archivable.
│   └── survivor-world-cup/            [CAN] Solo diseno. 7 MDs. Cero codigo. Archivable.
│
├── verticals/
│   └── dental/                        [VRT] Configuracion completa de Sarah (conocimiento, politicas, workflows)
│
├── workflows/
│   ├── blueprints/                    [CAN] JSON de n8n. No consumibles por el orchestrator.
│   └── extracted-patterns/            [ARC] Documentacion de patrones extraidos.
│
├── openspec/                          [ARC] Gobernanza supersedida. Preservado como referencia.
│
├── docs/
│   ├── architecture/                  [ARC] Documentos tecnicos historicos
│   ├── archive/                       [ARC] Documentos archivados en Phase E + ORG-1B
│   └── governance/
│       └── uv1-directive.md           [LEG] Directiva UV-1. Activa como referencia.
│
├── CLAUDE.md                          [PEK] Runtime spec para agentes Claude Code
├── README.md                          [PEK] Onboarding humano
└── package.json                       [FND] Root workspace definition
```

---

## 5. NUCLEO IRREDUCIBLE

Componentes que no deben separarse jamas del monorepo (segun ORG-1A):

| Componente | Tipo | Razon |
|------------|------|-------|
| `.claude/memory/` | [PEK] | Autoridad constitucional. Sin Pekin no hay civilizacion. |
| `packages/shared/` | [FND] | Contratos canonicos. Todos los engines dependen de el. |
| `workflow-orchestrator` | [RUN] | Sistema nervioso central. Coordina todos los engines. |
| `handoff-engine` | [ENG] | Gobernanza AI/HUMANO. Mas completo y testeado. Unico en su tipo. |
| `message-buffer-engine` | [ENG] | Buffer deterministico puro. Sin dependencias externas. |

---

## 6. CORE SECUNDARIO

Componentes de alta reutilizacion, arquitectonicamente alineados con Pekin:

| Componente | Tipo | Estado | Consumidores |
|------------|------|--------|-------------|
| `calendar-engine` | [ENG] | Active (14 src, 7 tests) | Dental AI |
| `crm-engine` | [ENG] | Active (12 src, 7 tests) | telegram-provider, Dental AI |
| `knowledge-engine` | [ENG] | Active (7 src) | Dental AI |
| `semantic-memory` | [ENG] | Active (migrations) | algorithmus-core-engine |
| `algorithmus-core-engine` | [ENG] | Active (runtime conversacional) | Dental AI |

---

## 7. PROVIDERS E INTEGRACIONES

| Componente | Tipo | Estado | Plataforma externa | Naturalizacion |
|------------|------|--------|-------------------|----------------|
| `ghl-engine` | [PRV] | Active (mal ubicado) | GHL | Allied |
| `telegram-provider` | [PRV] | Active (mal ubicado) | Telegram | Naturalized Candidate |
| `algorithmus-core-engine` (supabase client) | [INT] | Active | Supabase | Naturalized Candidate |
| `knowledge-engine` (pinecone adapter) | [INT] | Active | Pinecone | Referenced |
| `algorithmus-core-engine` (openai gateway) | [INT] | Active | OpenAI | Allied |

---

## 8. APPS / PRODUCTOS / VERTICALES

| Componente | Tipo | Estado | Dependencias de engines | Recomendacion |
|------------|------|--------|------------------------|---------------|
| `dental-ai-receptionist` | [APP] | Active | knowledge-engine | Mantener. Vertical activo. |
| `verticals/dental/` | [VRT] | Active | Configuracion completa | Mantener con dental-ai. |
| `quiniela-2026_deepclaude` | [APP] | Active | Ninguna (standalone) | Archivar o migrar a engines. |
| `quiniela-2026` | [APP] | Legacy | Ninguna (solo docs) | Archivar. |
| `reducidas-2026` | [APP] | Legacy | Ninguna (HTML estatico) | Archivar. |
| `survivor-world-cup` | [APP] | Candidate | Ninguna (solo diseno) | Archivar. |

### Verticales futuros (sin implementacion)

| Vertical | Estado | DNA |
|----------|--------|-----|
| Universidad Latino | Future | No registrado |
| PORKYRIOS | Future | No registrado |
| Afropikal | Future | No registrado |
| PWA Pekin Control Tower | Future | No registrado |

---

## 9. DEPENDENCIAS PRINCIPALES

| Origen | Destino | Tipo | Estado | Riesgo |
|--------|---------|------|--------|--------|
| `workflow-orchestrator` | `shared` | Contratos (DomainEvent, tipos) | En uso | Medio — tipos duplicados (D-001) |
| `calendar-engine` | `shared` | Contratos (Calendar types) | En uso | Bajo |
| `crm-engine` | `shared` | Contratos (CRM types) | En uso | Bajo |
| `handoff-engine` | `shared` | Contratos (Ownership) | En uso | Bajo |
| `message-buffer-engine` | `shared` | Contratos | En uso | Bajo |
| `crm-engine` | `ghl-engine` | Provider (CRM via GHL) | En uso | Medio |
| `telegram-provider` | `crm-engine` | CRM persistence | En uso | Bajo |
| `telegram-provider` | `ghl-engine` | GHL sync | En uso | Bajo |
| `telegram-provider` | `workflow-orchestrator` | Event emission | En uso | Bajo |
| `dental-ai-receptionist` | `knowledge-engine` | RAG retrieval | En uso | Bajo |
| `algorithmus-core-engine` | Supabase | Persistencia | En uso | Bajo |
| `algorithmus-core-engine` | OpenAI | LLM Gateway | En uso | Medio — sin interfaz LLMProvider |
| `knowledge-engine` | Pinecone | Vector store | En uso | Medio — evaluar pgvector |
| `quiniela-2026_deepclaude` | (ninguno core) | — | Standalone | Alto — sin integracion |
| `verticals/dental/` | `knowledge-engine` | Configuracion RAG | En uso | Bajo |

---

## 10. PATTERNS INSTITUCIONALES

| Pattern | Estado | Evidencia | Preservado como institucion? |
|---------|--------|-----------|------------------------------|
| Ownership Propagation | Canonical | 69/69 tests. RT-4 cerrado. 4 engines lo usan. | Si |
| Engine | Stable | Contrato comun en 4+ engines. FSM estandarizado. | Si |
| Provider | Stable | Implementado en CRM, Calendar, GHL, Telegram. InMemory-first. | Si |
| Event | Stable | DomainEvent con 7 campos. EventCatalog. Emitters por engine. | Si |
| Identity Mapping | Stable | 17 prefijos. Branded types. Validacion. | Si |
| Config | Stable | Vertical dental completo. vertical.json, policies, states, knowledge. | Si |
| Adapter | Stable | GHLClient, TelegramProvider, YCloudSender, Pinecone. | Si |
| Workflow | Partial | Orquestador funcional. Tipos duplicados (D-001/D-002). Blueprints en n8n JSON. | Parcial |
| Runtime | Partial | Tipos en shared. Sin implementacion concreta unificada. | Parcial |
| Multitenant | Partial | tenantId fluye en eventos. Sin provisioning ni isolation runtime. | Parcial |
| Agent | Candidate | Solo existe como JSON de n8n. Sin abstraccion en codigo. | No |
| Repository | Candidate | Una sola implementacion (LeadsRepository). Sin interfaz. | No |
| Harness | Partial | `.claude/commands/` funcional. Sin runtime de harness. | Parcial |
| Skill | Stable | 4 comandos funcionales (arquitecto, cyberneo, simplificador, avivar). | Si |

---

## 11. FRONTERAS

### Pertenece a Pekin (`.claude/memory/`)

- Constitucion, Principios, Instituciones
- ADRs ratificados
- Governance Level 2
- Memoria operacional (estado-actual, auditorias, reports)
- Procedimientos (naturalizacion, DNA templates, runbooks, convenciones)
- Patrones documentados
- Referencias y catalogos (legoland, eventos, mapas)

### Pertenece a Legoland (`packages/`)

- Engines reutilizables (calendar, crm, handoff, message-buffer, knowledge, semantic-memory)
- Providers (ghl-engine, telegram-provider)
- Foundation (shared)
- Runtime (workflow-orchestrator)
- NO pertenecen a Legoland: `apps/`, `verticals/`, `docs/`, `.claude/`

### Pertenece a Apps (`apps/`, `verticals/`)

- Productos desplegables
- Configuraciones de vertical
- NO gobiernan el monorepo. Son ciudadanos, no autoridad.

### Pertenece a Plataformas Externas

- GHL, Supabase, OpenAI, Pinecone, Telegram, Vercel, GitHub
- Son proveedores. No tienen autoridad dentro de CURDEECLAU.

### Fuera del monorepo

- `quiniela-engine` (remote archive en GitHub)
- Forge-Pro (herramienta externa de construccion)
- Landing pages y proyectos satelite

---

## 12. RIESGOS ACTUALES

| Riesgo | Severidad | Descripcion |
|--------|-----------|-------------|
| Nombres desalineados | Media | `telegram-provider` y `ghl-engine` en `packages/engines/` siendo providers. `algorithmus-core-engine` nombre demasiado modesto. `math-engine` fuera del toolchain pnpm. `knowledge-engine` fuera de `engines/`. |
| Providers dentro de engines | Media | Mezcla de engines de dominio con adapters de proveedor en el mismo directorio. |
| Apps legacy mezcladas | Baja | `quiniela-2026`, `reducidas-2026`, `survivor-world-cup` sin codigo activo. Ocupan espacio cognitivo. |
| Remote historico pendiente | Baja | `quiniela-archive` remote apunta a repo externo. Sin decision de mantener o remover. |
| Math engine fuera del toolchain | Media | `math-engine` es Python, sin package.json, fuera de pnpm workspaces. |
| Sin interfaz LLMProvider | Alta | OpenAI se usa directamente sin abstraccion. Acoplamiento medio-alto. |
| Tipos duplicados (D-001/D-002) | Alta | `workflow-orchestrator` redefine DomainEvent en lugar de importar de shared. |
| Apps sin integracion con engines | Media | `quiniela-2026_deepclaude` no consume ningun `@curdeeclau/*` package. |
| Blueprints n8n no consumibles | Media | Workflows en JSON de n8n no ejecutables por el orchestrator TypeScript. |
| Sin runtime unificado | Media | Engines manejan su propio lifecycle. No hay orquestador de bootstrap/shutdown. |

---

## 13. REGLAS DE LECTURA PARA AGENTES

Todo agente que opere en CURDEECLAU debe leer este mapa para entender:

1. **Donde esta parado.** Este es un monorepo con capas. No es una app unica.
2. **Que puede tocar.** `operational/`, `procedural/`, `docs/`, codigo en `packages/` y `apps/` segun su harness.
3. **Que no debe asumir.** Que `apps/` son el centro del monorepo. Que `packages/engines/` solo contiene engines. Que todos los modulos siguen la convencion de nombres.
4. **Que es core.** El nucleo irreducible (Seccion 5). No se toca sin ADR.
5. **Que es app.** Productos finales (Seccion 8). Pueden moverse o extraerse.
6. **Que es externo.** Plataformas (Seccion 7). Se usan via adapters, no directamente.
7. **Que esta archivado.** `docs/archive/`, `openspec/`, apps legacy. No son autoridad activa.

---

## 14. PROXIMOS MAPAS DERIVADOS

Documentos sugeridos para futuras fases (no crear ahora):

| Mapa | Proposito | Fase sugerida |
|------|-----------|---------------|
| `dependency-map.md` | Grafo completo de dependencias npm entre packages | MAP-2 |
| `app-inventory.md` | Inventario detallado de apps con estado, deuda, plan | MAP-3 |
| `provider-map.md` | Mapa de providers con riesgos y planes de contingencia | MAP-4 |
| `engine-map.md` | Mapa de engines con invariantes y consumidores | MAP-5 |
| `external-platform-map.md` | Mapa de plataformas externas con nivel de acoplamiento | MAP-6 |
| `archive-candidates.md` | Lista de apps y docs candidatos a archival | ORG-2 |

---

## 15. ESTADO DEL MAPA

- **Version:** 1.0.0 — Inicial
- **Basado en:** ORG-1A Repository Identity Audit (2026-06-13)
- **No ejecuta cambios.** Es puramente descriptivo.
- **No representa topologia final.** La topologia propuesta en ORG-1A (foundation/, runtime/, engines/, providers/, platform/, agents/, skills/, plugins/, mcp/, workflows/, apps/, configs/) es aspiracional y requiere ADR para ejecutarse.
- **Debe actualizarse tras:** ORG-2 (si se autoriza), cualquier ADR de topologia, o cambios significativos en la estructura de packages.

---

*Fin del Mapa de Sistemas v1.0.0*
