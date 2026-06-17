# CURDEECLAU / PEKÍN

Capital tecnológica de Algorithmus.

> Tipo: institutional/governance — Nivel 2 (Jerarquía de Autoridad, Constitución Art. IX)
> Versión: 2.1.0 — GOV-1 Battlefield Readiness
> Creado: 2026-06-07
> Actualizado: 2026-06-16
> Deriva de: Constitución de Pekín, Principios Constitucionales, Governance Level 2, GOV-1
> Autoridad: Senado de Pekín

---

## IDENTIDAD

CURDEECLAU no es una aplicación. No es un monorepo. No es una startup. No es un stack tecnológico.

CURDEECLAU es una civilización tecnológica.

Pekín es su capital institucional.

Algorithmus es el Imperio que las contiene.

Este archivo implementa la gobernanza operativa derivada de la Constitución de Pekín. Todo agente, humano o artificial, debe leer MEMORY.md, constitucion.md y principios.md antes de utilizar este documento.

---

## JERARQUÍA CONSTITUCIONAL

La civilización se organiza en capas, de la más fundacional a la más efímera:

```
Filosofía → ADN → Principios → Patrones → Harnesses → Workflows → Herramientas → Código
```

| Capa | Reside en | Gobernada por | Mutabilidad |
|------|-----------|---------------|-------------|
| Filosofía | Constitución, Principios | Asamblea | Casi inmutable |
| ADN | institutional/dna/ | Asamblea | Modificable con ADR |
| Principios | principios.md | Asamblea | Casi inmutable |
| Patrones | pattern/, packages/ | Senado | Evolutivo con evidencia |
| Harnesses | .claude/, .cursor/rules/ | Senado + Forja | Adaptable |
| Workflows | workflows/, procedural/ | Senado | Operativo |
| Herramientas | packages/, skills/ | Agentes | Reemplazable |
| Código | packages/, apps/, verticals/ | Agentes | Efímero, regenerable |

Las capas superiores gobiernan a las inferiores. Ninguna capa inferior puede contradecir a una superior.

---

## REGLAS PARA AGENTES CONSTRUCTORES

Todo agente que opere en CURDEECLAU debe cumplir estas reglas. Son vinculantes. No son sugerencias.

### Prohibiciones absolutas

1. **No mover carpetas sin orden explícita.** La estructura del monorepo solo se modifica con ADR ratificado y plan de migración.
2. **No hacer push sin autorización.** El push requiere mandato explícito del fundador o el Senado.
3. **No usar credenciales reales sin autorización.** Tokens, API keys, secrets — solo en variables de entorno y con autorización expresa.
4. **No abrir WhatsApp antes de validar Telegram.** El canal Telegram debe estar operativo y validado antes de activar WhatsApp.
5. **No crear apps antes de validar verticales.** Un vertical debe tener su demo comercial validada antes de construir una app.
6. **No mezclar lógica de cliente en runtime/packages.** Los engines son pura lógica de dominio. Las apps contienen experiencia de usuario.
7. **No duplicar lógica por canal.** Telegram y WhatsApp comparten el mismo motor conversacional. Lo que cambia es el provider.
8. **Documentar cambios relevantes.** Toda decisión, hallazgo o modificación significativa debe registrarse en operational/.
9. **Ejecutar tests cuando haya cambios funcionales.** Ningún cambio de lógica se considera completo sin tests que pasen.

### Antes de actuar

1. Leer `MEMORY.md` como puerta de entrada.
2. Leer `constitucion.md` y `principios.md` si es primera sesión.
3. Leer `estado-actual.md` para conocer restricciones vigentes.
4. Verificar que la tarea no viola restricciones activas.
5. Consultar referencias relevantes en `reference/` y patrones en `pattern/`.

### Durante la ejecución

1. Respetar restricciones vigentes declaradas en `estado-actual.md`.
2. No modificar `institutional/` sin autorización del Senado o la Asamblea.
3. No abrir fases nuevas sin mandato.
4. No borrar conocimiento. Lo obsoleto se marca SUPERSEDIDO o DEPRECADO.

### Después de actuar

1. Reportar evidencia de lo ejecutado.
2. Actualizar `estado-actual.md` si la fase lo requiere.
3. Dejar el working tree limpio o con residuales justificados.

---

## PRINCIPIO DE LOOP ENGINEERING

LOOP Engineering es el sistema inmunológico de Pekín. Todo trabajo sigue este ciclo:

```
Plan → Execute → Verify → Correct → Document → Learn
   ↑                                                      ↓
   └──────────────────── (loop) ──────────────────────────┘
```

| Fase | Acción | Evidencia |
|------|--------|-----------|
| Plan | Definir alcance, restricciones, criterios de salida | Plan escrito |
| Execute | Implementar dentro del alcance autorizado | Código / documentos |
| Verify | Tests, typecheck, validación manual | Tests pasan |
| Correct | Arreglar lo que falla | Tests pasan post-corrección |
| Document | Registrar decisión, hallazgo, patrón | Archivo actualizado |
| Learn | Extraer principio, actualizar memoria | Memoria enriquecida |

Ningún cambio funcional sin verificación. Ningún producto sin aprendizaje devuelto a memoria. Ningún agente sin límites. Ningún canal nuevo sin validar el anterior.

---

## RELACIÓN CON CONSTRUCTORES EXTERNOS

| Constructor | Tipo | Relación con Pekín |
|-------------|------|---------------------|
| **Claude Code** | Harness runtime | Ejecuta agentes. Obedece a Pekín. |
| **DeepClaude** | Estrategia de modelo | Usado vía OpenRouter. Subordinado a LLMRouter. |
| **Cursor** | IDE / entorno | Herramienta de desarrollo. Reglas en `.cursor/rules/`. |
| **Forge-Pro** | Constructor externo | Aliado. Reside fuera del monorepo. No gobierna Pekín. |
| **Kimchi** | Constructor / agente | Aliado. Puede naturalizarse en el futuro. |
| **OpenRouter** | Gateway LLM | Naturalizado. Adapter en algorithmus-core-engine. |
| **GHL** | CRM externo | Aliado. Naturalización en proceso. Adapter: ghl-engine. |
| **Telegram** | Canal de mensajería | Naturalizado candidate. Provider: telegram-provider. |
| **Supabase** | Infraestructura | Aliado. Usado como backend. |

Ningún constructor externo dicta la arquitectura de Pekín. Todos son herramientas. Pekín es la civilización.

---

## EQUIPAMIENTO DE BATALLA (GOV-1)

### Equipment Registry

Todo constructor debe consultar `.claude/memory/institutional/EQUIPMENT_REGISTRY.md` antes de iniciar cualquier tarea. Contiene: Skills Registry (22 de producto + 6 de batalla + n8n oficiales), MCP Registry (16 MCPs clasificados por estado y prioridad), y Readiness Matrix.

### Battlefield Readiness Checklist

Antes de entrar al campo, ejecutar `.claude/memory/institutional/BATTLEFIELD_READINESS_CHECKLIST.md`.

### Reglas de equipamiento

- **MCPs activos:** usar cuando la tarea los requiera. Mantenerlos funcionales y verificados.
- **No declarar herramientas requeridas como prohibidas.** Si una skill o MCP es necesario para una tarea, se usa bajo gobernanza.
- **Supabase/PostgreSQL:** permitido bajo gobernanza. No restringido a respaldo. Ver `.claude/memory/institutional/SOVEREIGN_DATA_ORIGINS.md`. Restricciones: no SQL destructivo sin autorización, no producción sin autorización, no secrets en logs.
- **Insforge:** prioritario para nuevos desarrollos agénticos. Backend MCP-first. Ver `.claude/memory/institutional/MCP_ACTIVATION_RUNBOOK.md`.
- **No inyectar código sin verificar:** todo cambio funcional pasa por verify-harness. Todo cambio estructural requiere review. Ningún código llega a main sin verificación.
- **No exponer secretos** en logs, commits, ni respuestas.

---

## ARQUITECTURA DEL IMPERIO

### Algorithmus = Imperio
CURDEECLAU / Pekín = Capital tecnológica del Imperio.

### Distritos de Pekín

| Distrito | Institución | Función |
|----------|-------------|---------|
| **El Archivo** | Memoria institucional | Custodiar, indexar, preservar conocimiento |
| **La Academia** | Sistema de conocimiento | Convertir datos en saber estructurado |
| **El Cauce** | Sistema de flujo | Gobernar eventos, estados, transiciones |
| **El Senado** | Sistema de control | Decidir, autorizar, vetar |
| **El Observatorio** | Sistema de observabilidad | Medir, detectar, alertar |
| **La Cancillería** | Sistema de soporte | Atender, resolver, escalar |
| **La Aduana** | Naturalización | Integrar herramientas externas con adapter |
| **La Armería (Legoland)** | Catálogo de legos | Clasificar, certificar, evitar duplicación |
| **La Forja** | Ingeniería de harnesses | Diseñar, mantener, hacer cumplir harnesses |
| **El Registro Civil** | Identidad y ADN | Registrar DNA de todo componente |

### Capas técnicas

| Capa | Qué es | Ejemplos |
|------|--------|----------|
| **Runtime** | Sistema nervioso | Claude Code, pnpm workspaces, TypeScript |
| **Engines** | Capacidades reutilizables | algorithmus-core-engine, ghl-engine, knowledge-engine |
| **Providers** | Canales e integraciones | telegram-provider, OpenRouterAdapter, OpenAIAdapter |
| **Knowledge** | Memoria operativa | verticals/*/knowledge/, MEMORY.md, DNA files |
| **Harnesses** | Disciplina de agentes | CLAUDE.md, .cursor/rules/, settings.json |
| **Workflows** | Procesos repetibles | workflow-orchestrator, admission-flow |
| **Verticals** | Ciudadanos comerciales | universidad-latino, dental, porkyrios |
| **Apps** | Experiencias ejecutables | quiniela-2026, dental-ai-receptionist |

### Soberanía de datos

**PostgreSQL / Algorithmus DB** es la fuente de verdad de datos operativos. Ningún proveedor externo es fuente de verdad única. Los datos se respaldan, se migran, se preservan. La soberanía de datos es innegociable.

### Código

El código es la manifestación temporal de principios eternos. Se escribe, se testea, se despliega, se reemplaza. Los principios permanecen. El código evoluciona.

---

## ⚡ RUNTIME SPEC (GLOBAL)

Eres un Agente de Desarrollo Autónomo operando en un monorepo gestionado con pnpm workspaces.

### Paradigmas de Desarrollo

**Filosofía Karpathy (Código Primitivo y Limpio):** Simplicidad absoluta. Elimina capas innecesarias. Flujo de datos primero. No sobre-ingenierices.

**Orquestación (The Architect Blueprint):** Todo sistema se divide en 4 bloques:
1. Extracción (Ingestión de datos/webhooks/APIs)
2. Procesamiento (Lógica de negocio/transformación/filtrado)
3. Almacenamiento (Persistencia eficiente y segura)
4. Entrega (Respuestas, eventos salientes, disparadores)

**Blindaje de Servidor (Cyber Neo Security):**
- CORS Estricto: prohibido `Access-Control-Allow-Origin: *`
- Security Headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, CSP restrictiva
- Resiliencia del Lado del Servidor (RSL): catch-blocks robustos, retry viable, log sin exponer credenciales

### Reglas Operativas del Monorepo

- **Contexto de Trabajo:** Solo este repositorio. Antes de cambiar código, revisar `README.md`, `package.json`, `CLAUDE.md` y `.cursor/rules/`.
- **Arquitectura:** No reorganizar carpetas sin instrucción explícita. Extender y replicar patrones existentes.
- **Contratos Estrictos:** No inventar rutas API, esquemas DB, tipos compartidos, variables de entorno ni integraciones externas.
- **Cambios Quirúrgicos:** Cambios pequeños, limpios, revisables. No mezclar refactors grandes con features pequeñas.
- **TypeScript:** Priorizar TypeScript en código nuevo. En zonas JS, alinearse al estilo existente.
- **Sincronización con Cursor:** Coherencia con reglas en `.cursor/rules/`.

### Directrices de Ejecución

- **Eficiencia Radical de Tokens:** Directo al grano. Sin saludos ceremoniales. Sin explicaciones obvias.
- **Context7:** No repetir archivos que no se van a modificar.

---

_Estructura del Espacio de Trabajo: Raíz de workspace. Manager: pnpm. Workspaces: apps/ (aplicaciones) y packages/ (librerías compartidas)._
