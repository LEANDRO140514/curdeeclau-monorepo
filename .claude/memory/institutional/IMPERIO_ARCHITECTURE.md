# ARQUITECTURA DEL IMPERIO ALGORITHMUS

> Tipo: institutional
> Versión: 1.0.0 — GOV-0 Governance Baseline
> Creado: 2026-06-16
> Ratificado por: Asamblea de Pekín mediante GOV-0
> Deriva de: Constitución de Pekín, Análisis Arquitectónico del Imperio

---

## I. EL IMPERIO

**Algorithmus es el Imperio.**

No es una empresa. No es un producto. No es un stack. Es la entidad soberana que contiene, organiza y gobierna todas las civilizaciones tecnológicas construidas bajo sus principios.

El Imperio establece:
- La filosofía que gobierna toda construcción.
- La soberanía sobre los datos, las decisiones y el conocimiento.
- La identidad compartida de todas las civilizaciones que lo componen.

---

## II. LA CAPITAL

**CURDEECLAU / Pekín es la capital tecnológica del Imperio.**

Así como todo imperio necesita una capital — un centro de gobierno, memoria, conocimiento y decisión — Algorithmus necesita Pekín.

Pekín no es una aplicación. Pekín no es un monorepo. Pekín no es un vertical. Pekín es el lugar donde reside la identidad de la civilización, su constitución, sus principios, sus instituciones, sus patrones, su memoria y su capacidad de decisión.

Pekín es al Imperio lo que el núcleo es a una célula: el centro que organiza todo lo demás.

---

## III. DISTRITOS DE PEKÍN

Pekín se organiza en 10 distritos institucionales:

| # | Distrito | Institución | Función |
|---|----------|-------------|---------|
| 1 | **El Archivo** | Memoria institucional | Custodiar, indexar, preservar y servir conocimiento. `.claude/memory/` |
| 2 | **La Academia** | Sistema de conocimiento | Convertir datos crudos en saber estructurado, reusable y transmisible. |
| 3 | **El Cauce** | Sistema de flujo | Gobernar eventos, estados, transiciones y compuertas entre sistemas. |
| 4 | **El Senado** | Sistema de control | Decidir, autorizar, vetar, priorizar. Consume métricas. Produce decisiones. |
| 5 | **El Observatorio** | Sistema de observabilidad | Medir, detectar, alertar, registrar. Produce métricas. No decide. |
| 6 | **La Cancillería** | Sistema de soporte | Atender, resolver, escalar incidencias de ciudadanos (productos, verticales). |
| 7 | **La Aduana** | Naturalización | Integrar herramientas externas con adapter, ficha y plan de contingencia. |
| 8 | **La Armería (Legoland)** | Catálogo de legos | Clasificar, certificar y evitar duplicación en `packages/`. |
| 9 | **La Forja** | Ingeniería de harnesses | Diseñar, mantener y hacer cumplir harnesses de agentes. |
| 10 | **El Registro Civil** | Identidad y ADN | Registrar el DNA de todo componente que forme parte de la civilización. |

---

## IV. CAPAS TÉCNICAS DEL IMPERIO

### Runtime — Sistema Nervioso

El Runtime es lo que permite que Pekín opere. No es una institución — es el tejido que conecta todas las instituciones.

**Componentes del Runtime:**
- Claude Code (ejecutor de agentes)
- pnpm workspaces (gestión de dependencias)
- TypeScript (lenguaje de implementación)
- Node.js (entorno de ejecución)
- Git (memoria de cambios)

El Runtime es reemplazable. Las instituciones no.

### Engines — Capacidades Reutilizables

Los engines son bloques de lógica de dominio pura, sin acoplamiento a proveedores externos.

| Engine | Función | Estado |
|--------|---------|--------|
| algorithmus-core-engine | Motor conversacional, leads, admisiones, LLM routing | Active |
| ghl-engine | Cliente GHL CRM (findContact, create, update) | Active |
| knowledge-engine | Indexación y búsqueda semántica (Pinecone) | Active |
| calendar-engine | Gestión de citas y disponibilidad | Active |
| crm-engine | Lógica de CRM independiente de proveedor | Active |
| handoff-engine | Transferencia agente-humano | Active |

**Contrato de Engine:**
1. No importa SDKs de proveedores externos directamente.
2. Expone interfaces inyectables.
3. Tiene implementación InMemory para tests.
4. Declara su DNA en `institutional/dna/` o `dna/`.

### Providers — Canales e Integraciones

Los providers son adapters que envuelven servicios externos. Implementan interfaces definidas por Pekín.

| Provider | Servicio externo | Estado |
|----------|-----------------|--------|
| telegram-provider | Telegram Bot API | Naturalized Candidate |
| OpenRouterAdapter | OpenRouter API | Naturalized |
| OpenAIAdapter | OpenAI API | Naturalized |
| DeepSeekAdapter | DeepSeek API | Naturalized |
| AnthropicAdapter | Anthropic API | Naturalized |
| Pinecone (vía knowledge-engine) | Pinecone Vector DB | Referenced |
| Supabase | Base de datos y auth | Allied |
| GHL (vía ghl-engine) | GoHighLevel CRM | Allied (naturalización en proceso) |

### Knowledge — Memoria Operativa

El conocimiento que alimenta los engines y verticales. Versionado. Estructurado. Validable.

**Fuentes de conocimiento:**
- `verticals/*/knowledge/` — Datos de dominio por vertical
- `.claude/memory/` — Memoria institucional
- `institutional/dna/` — ADN de componentes
- `pattern/` — Patrones extraídos del código

### Harnesses — Disciplina de Agentes

Los harnesses son contratos entre agentes y civilización. Definen permisos, límites, verificaciones.

| Harness | Implementación | Función |
|---------|---------------|---------|
| CLAUDE.md | Raíz del repo | Runtime spec + gobernanza operativa |
| .cursor/rules/ | Reglas por dominio | Frontend, backend, agents, tests |
| settings.json | Claude Code config | Permisos, hooks, environment |
| MEMORY.md | Puerta de entrada | Índice universal para agentes |
| governance.md | Nivel 2 | Reglas de modificación, estados, prohibiciones |

### Workflows — Procesos Repetibles

Flujos gobernados entre engines. Cada workflow tiene: canal, eventos, estados, compuertas, responsable, nivel de autonomía.

| Workflow | Vertical | Estado |
|----------|----------|--------|
| AdmissionFlow | Universidad Latino | Implementado (mock) |
| LeadClassifier | Universidad Latino | Implementado |
| reservar-cita | Dental | Definido |
| enviar-asesor | Multi-vertical | Definido |

---

## V. CIUDADANOS DEL IMPERIO

### Verticals — Ciudadanos Comerciales

Los verticales son dominios de negocio con identidad, conocimiento y configuración propios. No son apps. No son engines.

| Vertical | Estado |
|----------|--------|
| Universidad Latino | Validado (demo comercial) |
| Dental (Sarah) | Registrado (DNA) |
| PORKYRIOS | Registrado |
| Afropikal | Registrado |
| Algorithmus (core) | Fundacional |

### Apps — Experiencias Ejecutables

Las apps son productos desplegables que consumen engines y providers.

| App | Vertical | Estado |
|-----|----------|--------|
| quiniela-2026 | Quiniela | En desarrollo |
| dental-ai-receptionist | Dental | En desarrollo |

**No se autoriza crear nuevas apps sin vertical validado.**

---

## VI. ENTIDADES EXTERNAS

### Forge-Pro — Constructor Externo

Forge-Pro es una herramienta de construcción que reside fuera del monorepo CURDEECLAU.

- **No es una institución de Pekín.** No reside en `.claude/memory/`.
- **No gobierna CURDEECLAU.** Es una herramienta, no una autoridad.
- **Relación actual:** Aliado externo. Puede ser naturalizado en el futuro.
- **Principio aplicable:** Separación de Principio y Herramienta (Principio IV).

### GHL — Sistema Operativo Comercial Externo

GoHighLevel es el CRM utilizado para gestionar leads, pipelines y seguimiento comercial.

- **Relación actual:** Allied. Naturalización en proceso vía ghl-engine.
- **Adapters:** `ghl-engine` implementa cliente contra GHL API.
- **Plan de contingencia:** Si GHL desaparece, los datos de leads residen en PostgreSQL. El CRM es reemplazable.

---

## VII. SOBERANÍA DE DATOS

**PostgreSQL / Algorithmus DB es la fuente de verdad de datos operativos.**

Principios de soberanía:

1. **Ningún proveedor externo es fuente de verdad única.** GHL, Telegram, Supabase — todos son espejos o canales, no fuentes de verdad.
2. **Los datos se respaldan.** PostgreSQL tiene backups. La memoria institucional está en git.
3. **Los datos se migran.** Si un proveedor desaparece, los datos se preservan y migran.
4. **Los datos se poseen.** CURDEECLAU es dueño de sus datos. No dependen de ningún proveedor.

---

## VIII. EL CÓDIGO — MANIFESTACIÓN TEMPORAL

El código es la manifestación temporal de principios eternos.

Se escribe. Se testea. Se despliega. Se reemplaza.

Los principios permanecen. El código evoluciona.

Si todo el código desapareciera mañana, Pekín debe contener suficiente conocimiento — constitución, principios, patrones, ADN, memoria — para regenerar la civilización. No necesariamente idéntica. Pero sí coherente con sus principios.

**La arquitectura del Imperio sobrevive a su implementación.**

---

## IX. JERARQUÍA DE ENTIDADES

```
Algorithmus (Imperio)
├── CURDEECLAU / Pekín (Capital)
│   ├── Instituciones (10 distritos)
│   ├── Engines
│   ├── Providers
│   ├── Workflows
│   ├── Verticals
│   │   ├── Universidad Latino
│   │   ├── Dental
│   │   ├── PORKYRIOS
│   │   └── Afropikal
│   └── Apps
│       ├── quiniela-2026
│       └── dental-ai-receptionist
├── Legoland (Distrito de legos técnicos)
├── Runtime (Sistema nervioso)
├── Knowledge (Memoria operativa)
└── Aliados externos
    ├── Forge-Pro
    ├── GHL
    ├── Supabase
    ├── OpenAI
    ├── Anthropic
    ├── DeepSeek
    ├── Pinecone
    └── Telegram
```

---

_Fin de la Arquitectura del Imperio v1.0.0_
_Ratificada por GOV-0 el 16 de junio de 2026_
