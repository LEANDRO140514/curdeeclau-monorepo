# ARCHITECTURE BOUNDARIES — Forge / Claude Code / CURDEECLAU

**Versión:** 1.0
**Fecha:** 2026-06-08
**Contexto:** Forge-Pro 4.1 (`~/.forge/`) · Claude Code global (`~/.claude/`) · CURDEECLAU (`/mnt/c/Users/vonde/Proyectos/curdeeclau-monorepo/`)

---

## 1. Mapa de Capas

```
┌──────────────────────────────────────────────────────────────────────┐
│  CAPA 1 — FORGE-PRO  (~/.forge/)                                     │
│  La herramienta. No es un proyecto. Es la fábrica de fábricas.       │
├──────────────────────────────────────────────────────────────────────┤
│  core/FORGE.md          Factory OS canónico. Agnóstico de plataforma.│
│  core/skills/           Fuente de verdad de todos los skills.        │
│  core/commands/         Fuente de verdad de todos los comandos.      │
│  core/agents/           Fuente de verdad de todos los agentes.       │
│  core/design-systems/   Biblioteca de diseño. Referenciada, no       │
│                         copiada.                                     │
│  core/prompts/          El Yunque y otros procesos.                  │
│  core/hooks/            Hooks de automatización de calidad.          │
│  wrappers/              Thin wrappers por plataforma (~60 LOC c/u).  │
│  src/                   Template Next.js copiable al correr `forge`. │
│  docs/ · decisions.md   ADRs y arquitectura interna de Forge.        │
│  .claude/               Copia de trabajo LOCAL al repo de Forge.     │
│                         No es la global.                             │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  CAPA 2 — CLAUDE CODE GLOBAL  (~/.claude/)                           │
│  Runtime de Forge inyectado en Claude Code.                          │
│  Disponible en toda sesión, en todo proyecto.                        │
├──────────────────────────────────────────────────────────────────────┤
│  skills/                Poblado por Forge. Claude Code lo ejecuta.   │
│  commands/              40+ slash commands disponibles globalmente.  │
│  agents/                11 agentes especializados disponibles.       │
│  design-systems/        130+ sistemas de diseño. Solo lectura.       │
│  prompts/               El Yunque. Solo lectura.                     │
│  hooks/                 Activados por settings.json de cada proyecto.│
│  settings.json          Permisos globales. Mínimo — solo lo que      │
│                         aplica a TODO proyecto.                      │
│  settings.local.json    Overrides locales. Permisos de paths         │
│                         específicos (CURDEECLAU, etc.) van aquí.     │
│  projects/              Memorias per-proyecto. Nativo de Claude Code.│
│                         No tocar manualmente.                        │
│  skills/algorithmus-*/  Skills custom de Algorithmus. Conviven con   │
│                         Forge sin conflicto por namespace propio.    │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  CAPA 3 — CURDEECLAU MONOREPO                                        │
│  (/mnt/c/Users/vonde/Proyectos/curdeeclau-monorepo/)                 │
│  Sistema de orquestación de IA distribuida. Filosofía propia.        │
├──────────────────────────────────────────────────────────────────────┤
│  CLAUDE.md              Runtime Spec propio. Karpathy + Architect    │
│                         Blueprint + Cyber Neo Security.              │
│                         No derivado de Forge. No reemplazar.         │
│  STATE.md               Memoria de sesión. Mismo concepto que Forge, │
│                         contenido completamente propio.              │
│  openspec/              Specs canónicas. Equivalente funcional a los │
│                         PRPs de Forge, con formato propio.           │
│  packages/shared/       Contratos canónicos: DomainEvent, Ownership, │
│                         ExecutionContext, CRM, Calendar, Workflow.   │
│  packages/engines/      8 engines deterministas especializados.      │
│  packages/algorithmus/  Core engine system.                          │
│  packages/memory/       Memory engine.                               │
│  apps/                  Aplicaciones desplegables.                   │
│  .cursor/rules/         Reglas por capa. Coordinadas con CLAUDE.md.  │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  CAPA 4 — ALGORITHMUS  (dentro de CURDEECLAU)                        │
│  Motor de orquestación IA determinista y provider-agnostic.          │
├──────────────────────────────────────────────────────────────────────┤
│  algorithmus-core-engine/   Engine principal.                        │
│  algorithmus-platform/      Platform layer.                          │
│                                                                      │
│  Principios invariantes:                                             │
│  · Deterministic-first: reglas gobiernan, IA enriquece contexto.     │
│  · Provider-agnostic: plataformas externas son adapters.             │
│  · Event-driven: toda mutación emite un DomainEvent canónico.        │
│  · Ownership-aware: modos AI / HUMAN / SHARED / LOCKED.              │
│  · Solo handoff-engine puede mutar ownership.                        │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  CAPA 5 — PROYECTOS INDIVIDUALES  (creados con `forge`)              │
│  Ejemplo actual: /home/vonde/  (forge-app)                           │
├──────────────────────────────────────────────────────────────────────┤
│  .claude/               Copia local del runtime Forge. Copiada por   │
│                         `forge init`. Actualizable con /update-forge.│
│  CLAUDE.md              Factory OS copiado de Forge. Extensible con  │
│                         aprendizajes locales del proyecto.           │
│  .mcp.json              Credenciales del proyecto. Nunca en git.     │
│  src/                   Código del producto. Arquitectura            │
│                         Feature-First.                               │
│  .claude/PRPs/PIEZA-*.md Blueprints del producto. Pertenecen al      │
│                         proyecto, no a Forge.                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Reglas Cardinales

**RC-01 — Forge-Pro es una herramienta, no una dependencia.**
`~/.forge/` nunca es importada, copiada ni referenciada desde ningún proyecto.
Es una herramienta que empuja contenido a `~/.claude/`.

**RC-02 — `~/.claude/` es la zona pública de Forge.**
Todos los proyectos y CURDEECLAU consumen `~/.claude/` de forma transparente.
Solo Forge escribe en `~/.claude/skills/`, `~/.claude/commands/` y `~/.claude/agents/`.
La excepción permitida: skills custom `algorithmus-*` escritos por el usuario.

**RC-03 — CURDEECLAU tiene filosofía propia. No se normaliza a Forge.**
Su `CLAUDE.md`, su `STATE.md` y su `openspec/` son soberanos.
No se reemplazan, no se mezclan, no se adaptan al Golden Path de Forge.

**RC-04 — Proyectos individuales son autónomos.**
No comparten código entre sí. No exportan nada a CURDEECLAU.
Su `.claude/` local se actualiza desde Forge, no desde otros proyectos.

**RC-05 — El flujo es unidireccional.**
`~/.forge/` empuja → `~/.claude/` distribuye → proyectos y CURDEECLAU consumen.
Nunca al revés.

**RC-06 — `settings.json` global contiene solo lo universal.**
Permisos específicos a paths de CURDEECLAU van en `settings.local.json`.
Permisos específicos a un proyecto individual van en `.claude/settings.json` local.

---

## 3. Reglas de No Contaminación

### De Forge-Pro hacia CURDEECLAU

| Origen | Destino | Estado | Razón |
|--------|---------|--------|-------|
| `~/.forge/src/` | CURDEECLAU | ❌ PROHIBIDO | Golden Path no aplica a CURDEECLAU |
| `~/.forge/CLAUDE.md` | `CURDEECLAU/CLAUDE.md` | ❌ PROHIBIDO | CURDEECLAU tiene filosofía propia |
| `~/.forge/core/FORGE.md` | CURDEECLAU | ❌ PROHIBIDO | CURDEECLAU no es un proyecto Forge |
| `~/.forge/.claude/` | CURDEECLAU | ❌ PROHIBIDO | Es la capa interna del repo de Forge |
| `~/.forge/example.mcp.json` | CURDEECLAU | ❌ PROHIBIDO | Credenciales incompatibles de dominio |

### De `~/.claude/` hacia CURDEECLAU (copia explícita)

| Origen | Destino | Estado | Razón |
|--------|---------|--------|-------|
| `~/.claude/hooks/` | `CURDEECLAU/.claude/` | ❌ PROHIBIDO | CURDEECLAU tiene workflow propio |
| `~/.claude/commands/` | `CURDEECLAU/.claude/` | ❌ PROHIBIDO | Ya los usa globalmente — copiarlos duplica |
| `~/.claude/skills/` | `CURDEECLAU/` | ❌ PROHIBIDO | Son globales, no locales |
| `~/.claude/design-systems/` | `CURDEECLAU/` | ❌ PROHIBIDO | Solo referencia, nunca copia física |

### Entre proyectos individuales

| Origen | Destino | Estado | Razón |
|--------|---------|--------|-------|
| `proyecto-A/.claude/` | `proyecto-B/.claude/` | ❌ PROHIBIDO | Cada proyecto actualiza desde Forge |
| `proyecto-A/CLAUDE.md` | `CURDEECLAU/CLAUDE.md` | ❌ PROHIBIDO | Dominios distintos |

### De CURDEECLAU hacia proyectos individuales

| Origen | Destino | Estado | Razón |
|--------|---------|--------|-------|
| `CURDEECLAU/packages/` | `proyecto-A/src/` | ❌ PROHIBIDO | Los engines no son librerías de SaaS |
| `CURDEECLAU/CLAUDE.md` | `proyecto-A/CLAUDE.md` | ❌ PROHIBIDO | Filosofías incompatibles |
| `CURDEECLAU/openspec/` | `proyecto-A/.claude/PRPs/` | ❌ PROHIBIDO | Formatos y propósitos distintos |

---

## 4. Reglas de Integración Permitida

### CURDEECLAU ← `~/.claude/` (automático, sin configuración)

Claude Code carga `~/.claude/skills/`, `~/.claude/commands/` y `~/.claude/agents/`
en **toda** sesión, incluyendo sesiones dentro de CURDEECLAU.
No requiere acción, no requiere copia, no requiere configuración.

Comandos Forge útiles en contexto CURDEECLAU:

| Comando | Uso válido en CURDEECLAU |
|---------|--------------------------|
| `/plan` | Planificar un engine nuevo con La Herrería antes de codificar |
| `/build` | Ejecutar un blueprint de engine aprobado |
| `/adversarial-review` | Buscar vulnerabilidades en engines o adapters |
| `/forge-check` | Diagnóstico del entorno de desarrollo |
| `agents/backend-specialist` | Implementar lógica de un engine |
| `agents/db-architect` | Diseñar schema de un engine con estado persistido |

### CURDEECLAU → `settings.local.json`

`~/.claude/settings.local.json` es el lugar correcto para permisos
de paths específicos a CURDEECLAU. Regla de segregación:

```
Permisos de TODO proyecto         → ~/.claude/settings.json
Permisos específicos a CURDEECLAU → ~/.claude/settings.local.json
Permisos de un proyecto individual → [proyecto]/.claude/settings.json
```

### CURDEECLAU → `~/.claude/skills/algorithmus-*/`

La única integración de escritura permitida desde el dominio de CURDEECLAU
hacia `~/.claude/` es la creación de skills custom con namespace `algorithmus-`.
Estas conviven con los skills de Forge sin conflicto.

---

## 5. Convención para Skills Custom: `algorithmus-*`

### Estructura de directorios

```
~/.claude/skills/
├── algorithmus-contracts/
│   └── SKILL.md
├── algorithmus-engines-map/
│   └── SKILL.md
├── algorithmus-handoff/
│   └── SKILL.md
├── algorithmus-openspec/
│   └── SKILL.md
└── algorithmus-workflow/
    └── SKILL.md
```

### Reglas de naming

- Prefijo obligatorio: `algorithmus-`
- Kebab-case después del prefijo
- Un skill por engine o por contrato transversal
- Nombre = `algorithmus-[engine-sin-sufijo-engine]`
  - `handoff-engine` → `algorithmus-handoff`
  - `workflow-orchestrator` → `algorithmus-workflow`
  - `shared/` contracts → `algorithmus-contracts`

### Estructura interna de cada SKILL.md

```markdown
# [Nombre del Skill]

## Propósito
Una línea: qué provee este skill a Claude Code.

## Cuándo usar
Condiciones que disparan la lectura de este skill.

## Módulo de referencia
Path en el monorepo: packages/[módulo]/

## Contratos canónicos
[Interfaces y tipos clave]

## Invariantes
MUST: [...]
MUST NOT: [...]

## Patrones frecuentes
[Ejemplos de uso válido]

## Anti-patrones
[Qué no hacer — errores comunes]
```

### Sincronización con el monorepo

Los skills `algorithmus-*` se actualizan manualmente cuando:
- Cambia una interfaz en `packages/shared/`
- Se estabiliza un engine (alcanza RT-4)
- Se agrega un nuevo engine
- Se emite un ADR constitucional que modifica invariantes

No existe sincronización automática. El skill es documentación
curada, no reflejo automático del código.

---

## 6. Propuesta Inicial de Skills Algorithmus

### `algorithmus-contracts`

**Módulo:** `packages/shared/`
**Propósito:** Proveer a Claude Code los contratos canónicos antes de tocar cualquier engine.

Contenido mínimo:
- Interfaz `DomainEvent`: `correlationId`, `causationId`, `actorId`, `type`, `payload`
- Modos de ownership: `AI / HUMAN / SHARED / LOCKED` y reglas de transición
- `ExecutionContext`: campos obligatorios
- Contratos base `CRM` y `Calendar`
- Regla de retorno: `{ error, message }` — nunca `throw`
- Restricción cross-engine: solo vía orchestrator + DomainEvent
- Restricción de imports: `shared/` no importa de engines, providers ni verticals

---

### `algorithmus-engines-map`

**Módulo:** `packages/engines/` (visión global)
**Propósito:** Mapa rápido de los 8 engines — rol, estado RT-4, dependencias.

Contenido mínimo:

```
calendar-engine        Coordinación temporal (reservas, disponibilidad)    RT-4 ✅
crm-engine             CRM provider-agnostic                                RT-4 ✅
ghl-engine             Adapter GoHighLevel                                  Spec/Implement
handoff-engine         Ownership AI↔Human (único con autoridad de mutación) RT-4 ✅
media-delivery-engine  Entrega de medios                                    Activo
message-buffer-engine  Buffer de mensajes (infra — sin ownership view)      RT-4 ✅
workflow-orchestrator  Orquestación central                                 Activo
telegram-provider      Adapter de transporte (infra — sin ownership view)   Activo
```

Notas constitucionales:
- ADR #35: engines de infra (telegram-provider, message-buffer-engine)
  NO participan en ownership propagation
- Engines RT-4: interfaces estabilizadas — todo cambio requiere spec previa

---

### `algorithmus-handoff`

**Módulo:** `packages/engines/handoff-engine/`
**Propósito:** Que Claude Code respete las reglas de ownership al trabajar
en cualquier engine con autoridad conversacional.

Contenido mínimo:
- `handoff-engine` es el **único** que puede mutar ownership
- ADR #35: ownership propagation solo aplica a engines de autoridad conversacional
- ADR #37: post-start, autoridad de ownership viene exclusivamente de
  `ownershipView` local + eventos `OwnershipChanged`.
  Ningún query path de ownership puede permanecer en `execute()`
- ADR #38: migraciones constitucionales pueden eliminar APIs query-driven
  deprecadas sin backward compatibility
- Cuándo un engine tiene autoridad vs cuándo es infra de transporte

---

### `algorithmus-workflow`

**Módulo:** `packages/engines/workflow-orchestrator/`
**Propósito:** Que Claude Code entienda el orchestrator antes de diseñar
o modificar cualquier flujo de orquestación.

Contenido mínimo:
- Rol: único punto de comunicación cross-engine
- Routing: deterministic-first (reglas > IA)
- Ciclo de vida: Blueprint → Execution → DomainEvent emitido
- Cómo se registran engines en el orchestrator
- Invariantes MUST / MUST NOT del workflow
- Referencia a flujos canónicos de `apps/dental-ai-receptionist`

---

### `algorithmus-openspec`

**Módulo:** `openspec/` + gobernanza del monorepo
**Propósito:** Que Claude Code produzca specs en el formato correcto de OpenSpec
al planificar engines o features nuevas.

Contenido mínimo:
- Jerarquía de autoridad: Constitución RT-1.5 > OpenSpec Governance >
  Engine Specs > `shared/` > engines
- Cadena Algorithmus: Blueprint → Pattern → Canonical Contracts →
  OpenSpec → Engine → Provider Adapter → Vertical
- Estructura obligatoria de una spec: invariantes `MUST` / `MUST NOT`,
  contratos de entrada/salida, DomainEvents emitidos
- Cómo referenciar contratos de `shared/` desde una spec
- Ejemplo mínimo completo de spec válida

---

## 7. Rutina de Mantenimiento

### Frecuencia: por evento (no periódica)

| Evento | Acción |
|--------|--------|
| `git pull` en `~/.forge/` (Forge actualiza) | Ejecutar `/update-forge` en proyectos individuales para sincronizar `.claude/` local |
| CURDEECLAU agrega un engine nuevo | Crear `~/.claude/skills/algorithmus-[engine]/SKILL.md` |
| CURDEECLAU modifica contratos en `packages/shared/` | Actualizar `~/.claude/skills/algorithmus-contracts/SKILL.md` |
| CURDEECLAU emite un ADR constitucional | Evaluar si impacta `algorithmus-handoff` o `algorithmus-workflow` y actualizar |
| Un engine alcanza RT-4 | Marcar en `algorithmus-engines-map` y crear/actualizar su skill propio |
| Se agrega un proyecto individual nuevo | Correr `forge init` en el directorio — no copiar de otro proyecto |
| Cambio en `~/.claude/settings.json` | Revisar si el cambio debía ir en `settings.local.json` — aplicar RC-06 |

### Checklist de higiene trimestral

```
[ ] Verificar que ningún proyecto individual tiene contenido de otro en .claude/
[ ] Verificar que CURDEECLAU/CLAUDE.md no contiene referencias a Forge Golden Path
[ ] Verificar que ~/.claude/settings.json no tiene permisos de paths específicos
    (deben estar en settings.local.json)
[ ] Verificar que los skills algorithmus-* reflejan el estado actual de los engines
[ ] Verificar que ~/.forge/ está en la versión correcta con git status
```

---

## 8. Invariante Final

```
~/.forge/ empuja → ~/.claude/ distribuye → proyectos y CURDEECLAU consumen
```

El flujo es **estrictamente unidireccional**.

- `~/.forge/` es la fuente. Nunca receptor.
- `~/.claude/` es el canal. Recibe de Forge, entrega a todos.
- Proyectos individuales y CURDEECLAU son consumidores. Nunca empujan hacia arriba.
- Los skills `algorithmus-*` son la única excepción controlada: el usuario escribe
  hacia `~/.claude/skills/` para extender el canal con conocimiento de dominio propio.
  No violan la invariante porque no modifican lo que Forge empujó — lo extienden
  en un namespace separado.

---

*Este documento describe el estado de diseño aprobado en 2026-06-08.
Actualizar cuando cambie la topología de capas, no cuando cambie el contenido dentro de ellas.*
