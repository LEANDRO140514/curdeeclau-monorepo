# GOVERNANCE LEVEL 2 — PEKIN

> Tipo: institutional/governance
> Version: 1.0.0 — Fundacional
> Creado: 2026-06-13
> Autoridad: Constitucion de Pekin, Article IX (Jerarquia de Autoridad), Nivel 2
> Deriva de: ADR-000, ORG-1A, ORG-1B, ORG-1C
> No sustituye: Constitucion, Principios, Instituciones, ADR-000

---

## 1. PROPOSITO

Este documento es la **capa operativa de gobierno** de CURDEECLAU.

No es la Constitucion. No es un Principio. No es una Institucion. No es un ADR.

Es el conjunto de reglas, clasificaciones, estados, procedimientos y prohibiciones que traducen los principios constitucionales en operacion diaria.

La Constitucion dice **que** es CURDEECLAU y **por que** existe.
Los Principios dicen **como** debe pensar y actuar.
Las Instituciones dicen **quien** hace que.
Este documento dice **como se gobierna** el dia a dia de la civilizacion.

Todo agente, humano o artificial, debe conocer este documento despues de leer la Constitucion, los Principios y MEMORY.md.

---

## 2. JERARQUIA INSTITUCIONAL

La autoridad en CURDEECLAU se organiza en capas, de mayor a menor rango:

| Nivel | Capa | Archivo(s) | Mutabilidad | Autoridad para modificar |
|-------|------|-----------|-------------|--------------------------|
| 1 | Acuerdo Fundacional | Implicito en la existencia de CURDEECLAU | Inmutable | Fundador |
| 2 | Constitucion | `constitucion.md` | Casi inmutable | Asamblea con mayoria calificada |
| 3 | Principios | `principios.md` | Casi inmutable | Asamblea con mayoria calificada |
| 4 | Instituciones | `instituciones.md` | Modificable con ADR | Asamblea |
| 5 | ADRs | `institutional/adr/ADR-XXX.md` | Ratificados, no modificables | Asamblea |
| 6 | Governance Level 2 | `institutional/governance.md` (este documento) | Modificable con ADR | Senado + Asamblea |
| 7 | MEMORY.md | `.claude/memory/MEMORY.md` | Actualizable por agentes | Senado |
| 8 | estado-actual.md | `operational/estado-actual.md` | Actualizable en cada fase | Agentes autorizados |
| 9 | Reports | `operational/reports/` | Efimeros, preservables | Agentes |
| 10 | docs/archive/ | `docs/archive/` | Solo recibe; no modifica | Agentes autorizados |

Regla de precedencia:

- Un nivel superior siempre prevalece sobre uno inferior.
- Ningun documento de nivel inferior puede contradecir a uno de nivel superior.
- Si existe conflicto, el nivel superior tiene razon. El nivel inferior debe corregirse.
- El Acuerdo Fundacional es la unica fuente que no puede ser modificada por ningun cuerpo.

---

## 3. AUTORIDADES

### 3.1 Pekin

- **Rol:** Capital institucional. Fuente de verdad constitucional.
- **Reside en:** `.claude/memory/institutional/`
- **Autoridad:** Define que es CURDEECLAU. Sus documentos son vinculantes para toda la civilizacion.
- **No hace:** No escribe codigo. No gestiona productos. No opera infraestructura.

### 3.2 El Archivo

- **Rol:** Memoria institucional. Custodio del conocimiento.
- **Reside en:** `.claude/memory/`
- **Autoridad:** Todo agente debe leerlo antes de actuar. Todo conocimiento relevante debe escribirse en el.
- **No hace:** No toma decisiones. No ejecuta codigo. No gobierna flujos.

### 3.3 El Senado

- **Rol:** Toma de decisiones operativas y tacticas.
- **Autoridad:** Interpreta la realidad operativa, decide acciones correctivas, escala a la Asamblea cuando es necesario.
- **No hace:** No modifica principios ni constitucion. Eso es la Asamblea.

### 3.4 La Asamblea

- **Rol:** Maxima autoridad constitucional.
- **Autoridad:** Modifica la Constitucion, Principios e Instituciones. Ratifica ADRs.
- **No hace:** No opera codigo. No gestiona productos dia a dia.

### 3.5 Legoland (La Armeria)

- **Rol:** Cataloga componentes reutilizables. No gobierna toda la ciudad.
- **Autoridad:** Clasifica, certifica y detecta duplicacion en `packages/`.
- **No hace:** No gobierna apps, verticals, docs ni institutional.

### 3.6 Agentes

- **Rol:** Ejecutan trabajo tecnico y documental dentro de harnesses.
- **Autoridad:** Pueden modificar `operational/`, `procedural/`, `docs/`, codigo en `packages/` y `apps/` segun su harness.
- **No pueden:** Modificar `institutional/`. Hacer push sin autorizacion. Abrir nuevas fases sin mandato.

### 3.7 Humanos (Fundador y colaboradores autorizados)

- **Rol:** Direccion estrategica. Decisiones que afectan identidad.
- **Autoridad:** Pueden convocar a la Asamblea. Pueden vetar decisiones tecnicas que violen principios.
- **No hacen:** No reemplazan a los agentes en tareas operativas.

### 3.8 Productos / Ciudadanos

- **Rol:** Aplicaciones, verticales y servicios que operan dentro de CURDEECLAU.
- **Ejemplos:** Dental AI, Quiniela, Universidad Latino, PORKYRIOS, Afropikal, AdmissionFlow.
- **Autoridad:** Gobiernan su dominio especifico. No gobiernan la civilizacion.
- **No pueden:** Declarar su propia constitucion. Crear gobernanza paralela.

### 3.9 Aliados externos

- **Rol:** Herramientas, plataformas y servicios externos que CURDEECLAU utiliza.
- **Ejemplos:** Supabase, OpenAI, Pinecone, GHL, Telegram, Vercel.
- **Autoridad:** Ninguna dentro de CURDEECLAU. Son proveedores, no gobernantes.
- **Regulacion:** Deben ser naturalizados por La Aduana. Deben tener adapter. Deben tener ficha de naturalizacion.

---

## 4. TIPOS DE ACTIVOS

Todo componente en CURDEECLAU pertenece exactamente a un tipo. El tipo determina donde vive, quien lo gobierna y como evoluciona.

| Tipo | Definicion | Ubicacion | Ejemplos |
|------|-----------|-----------|----------|
| **Pattern** | Abstraccion con 3+ ocurrencias en codigo | `pattern/` en Archivo, implementado en `packages/` | Provider, Engine, Event, Ownership |
| **Harness** | Contrato agente-civilizacion | `.claude/`, implementado en runtime | CLAUDE.md, .cursor/rules/, settings.json |
| **Workflow** | Flujo gobernado entre engines | `workflows/blueprints/` | reservar-cita, enviar-asesor, lead-classifier |
| **Engine** | Logica de dominio pura, provider-agnostica | `packages/engines/` | calendar-engine, crm-engine, handoff-engine |
| **Provider** | Adapter de servicio externo | `packages/engines/` (actual), futuro `providers/` | ghl-engine, telegram-provider |
| **App** | Producto desplegable | `apps/` | dental-ai-receptionist, quiniela-2026_deepclaude |
| **Vertical** | Configuracion de dominio + conocimiento | `verticals/` | dental/ (Sarah) |
| **Agent** | Definicion de personalidad y comportamiento | `verticals/*/prompts/`, futuros `agents/` | Sarah (receptionist dental) |
| **Skill** | Comando o capacidad del harness Claude Code | `.claude/commands/` | arquitecto, cyberneo, simplificador |
| **Plugin** | Extension del runtime | No existe aun | Aspiracional |
| **MCP** | Servidor Model Context Protocol | No existe aun | Aspiracional |
| **Integration** | Conexion entre sistemas CURDEECLAU | Implementado en codigo, documentado en `procedural/` | WhatsApp webhook, GHL sync |
| **External Project** | Proyecto fuera del monorepo | Fuera de CURDEECLAU | Forge-Pro, landing pages |
| **Archive** | Documento o codigo preservado historicamente | `docs/archive/` | STATE.superseded.md, governance-README.superseded.md |

---

## 5. ESTADOS INSTITUCIONALES

Todo activo en CURDEECLAU tiene exactamente un estado. El estado determina que protecciones y restricciones aplican.

| Estado | Definicion | Transicion permitida | Ejemplo |
|--------|-----------|---------------------|---------|
| **Proposed** | Propuesto, no implementado ni ratificado | -> Active, Archived, o Deleted | Nueva propuesta de engine |
| **Active** | En uso, gobernado, mantenido | -> Canonical, Superseded, Deprecated | calendar-engine |
| **Canonical** | Active + validado en 3+ verticales + 0 errores en produccion | -> Superseded (solo por reemplazo canonico) | Ownership Pattern |
| **Superseded** | Reemplazado por autoridad superior. Conocimiento preservado. | -> Archived (despues de periodo de absorcion) | RT-1.5 governance docs |
| **Archived** | Movido a `docs/archive/`. Sin autoridad activa. | Ninguna (preservacion permanente) | STATE.superseded.md |
| **Naturalized** | Herramienta externa integrada con adapter + ficha. | -> Deprecated si el proveedor desaparece | GHL (via ghl-engine) |
| **Allied** | Herramienta externa usada pero no naturalizada. | -> Naturalized (requiere proceso de naturalizacion) | Vercel (para deploy) |
| **Deprecated** | En desuso. No recibe mantenimiento. | -> Archived (despues de periodo de gracia) | API legacy |
| **Forbidden** | Prohibido. No debe usarse ni referenciarse como autoridad. | Ninguna | RT-1.5 como autoridad constitucional |

Reglas de transicion:

1. Proposed -> Active requiere: implementacion + tests + documentacion + revision.
2. Active -> Canonical requiere: 3+ verticales usando + 0 bugs en produccion + tests completos.
3. Active -> Superseded requiere: ADR que declare el reemplazo + absorcion de conocimiento.
4. Active -> Deprecated requiere: periodo de gracia documentado + notificacion a consumidores.
5. Cualquier estado -> Archived requiere: verificacion de que el conocimiento fue absorbido.
6. Forbidden es terminal. Solo la Asamblea puede declarar algo Forbidden.

---

## 6. REGLAS DE NATURALIZACION

La naturalizacion es el proceso por el cual una herramienta, plataforma o servicio externo se integra formalmente en CURDEECLAU. Es ejecutada por La Aduana bajo el Principio I (Soberania de la Civilizacion) y el Principio IV (Separacion de Principio y Herramienta).

### 6.1 Que puede naturalizarse

- SDKs y APIs de proveedores externos (OpenAI, Pinecone, Supabase, GHL, Telegram, etc.)
- Plataformas de infraestructura (Vercel, Railway, DigitalOcean, etc.)
- Herramientas de desarrollo (Cursor, Claude Code, etc.)
- Frameworks y librerias externas con acoplamiento significativo
- Proyectos open source que CURDEECLAU adopta como dependencia critica

### 6.2 Documentos minimos requeridos

Toda naturalizacion requiere una **ficha de naturalizacion** en `procedural/naturalizacion/` que contenga:

1. Nombre del proveedor/ herramienta
2. Que principio resuelve (segun Principio IV)
3. Que patron implementa (segun catalogo de patrones)
4. Que adapter lo envuelve (ubicacion exacta en `packages/`)
5. Que pasaria si desaparece (plan de contingencia)
6. Nivel de acoplamiento: bajo (interfaz generica), medio (adapter especifico), alto (SDK directo — requiere justificacion)
7. Estado: Naturalized, Allied, o Deprecated

### 6.3 Evidencia requerida

- El adapter existe y compila.
- Existe al menos una implementacion InMemory para tests.
- Los tests pasan sin conexion al proveedor real.
- El provider no se importa directamente desde `src/core/` de ningun engine.
- La ficha de naturalizacion esta completa y revisada.

### 6.4 Relacion con CURDEECLAU

| Tipo de relacion | Definicion | Ejemplo |
|------------------|-----------|---------|
| **Nativo** | Construido dentro de CURDEECLAU, gobiernado por Pekin | calendar-engine, shared |
| **Naturalizado** | Externo, integrado con adapter + ficha completa | GHL (ghl-engine), Pinecone (knowledge-engine) |
| **Aliado** | Externo, utilizado pero no naturalizado formalmente | Vercel, GitHub |
| **Referenciado** | Externo, documentado como antecedente o inspiracion | Paper de arquitectura, articulo tecnico |
| **Archivado** | Antes era nativo o naturalizado, ahora preservado historicamente | quiniela-engine (remote archive) |

---

## 7. REGLAS DE MODIFICACION

No todos los cambios requieren el mismo nivel de autorizacion. Esta tabla define que se necesita para cada tipo de cambio.

| Tipo de cambio | Requiere | Autoridad |
|----------------|----------|-----------|
| Correccion de typo en doc operacional | Commit documental simple | Agente |
| Actualizacion de estado-actual.md | Reporte operativo | Agente autorizado |
| Nuevo reporte en operational/reports/ | Reporte operativo | Agente |
| Archivar documento supersedido | Fase ORG con autorizacion | Senado |
| Nueva ficha de naturalizacion | Fase NAT con autorizacion | Senado |
| Nuevo ADR | Propuesta + revision + ratificacion | Asamblea |
| Modificar Constitucion o Principios | Propuesta + analisis de impacto + ratificacion con mayoria calificada | Asamblea |
| Mover codigo (packages, engines, providers) | Auditoria + topology proposal + ADR + plan de migracion + verificacion + commit atomico | Senado + Asamblea |
| Crear nueva capa de gobernanza | ADR + ratificacion | Asamblea |
| Cambiar remote de git | Autorizacion explicita | Fundador o Senado |

---

## 8. REGLAS DE MOVIMIENTO DE CODIGO

Ningun package, engine, provider o app debe moverse de ubicacion sin el siguiente proceso:

1. **Auditoria tecnica.** Verificar dependencias, consumidores, tests, estado de build.
2. **Topology proposal.** Documentar estructura actual, estructura propuesta, justificacion, impacto.
3. **ADR.** Ratificar la decision de mover con alternatives considered y consecuencias.
4. **Plan de migracion.** Paso a paso: que se mueve, en que orden, como se verifica, como se revierte.
5. **Verificacion.** Build pasa. Tests pasan. Consumidores no rompen.
6. **Commit atomico.** Un solo commit que mueve todo junto, con mensaje descriptivo.

Este proceso aplica a:

- Cambiar un package de `packages/engines/` a `providers/`.
- Cambiar un package de `packages/` a `packages/engines/`.
- Extraer una app del monorepo a su propio repositorio.
- Fusionar dos packages en uno.
- Dividir un package en multiples.

No aplica a:

- Crear un nuevo package en su ubicacion correcta desde el inicio.
- Archivar documentos (eso es Phase E / ORG-1B).
- Mover archivos dentro de un mismo package.

---

## 9. REGLAS PARA AGENTES

Todo agente que opere en CURDEECLAU debe cumplir estas reglas. Son vinculantes. No son sugerencias.

### 9.1 Antes de actuar

1. Leer `MEMORY.md` como puerta de entrada.
2. Leer `estado-actual.md` para conocer restricciones vigentes y trabajo en curso.
3. Leer `constitucion.md` y `principios.md` si es su primera sesion.
4. Verificar que la tarea solicitada no viola ninguna restriccion activa.
5. Consultar referencias relevantes en `reference/` y patrones en `pattern/`.

### 9.2 Durante la ejecucion

1. Respetar las restricciones vigentes declaradas en `estado-actual.md`.
2. No asumir autoridad que no le fue otorgada.
3. No modificar `institutional/` sin autorizacion explicita del Senado o la Asamblea.
4. No abrir nuevas fases (ORG, GOV, NAT, DNA, RUN, MAP, PWA, UV) sin mandato.
5. No hacer push sin autorizacion explicita.
6. No borrar conocimiento. Lo que se reemplaza se marca supersedido. Lo que se mueve se archiva.

### 9.3 Despues de actuar

1. Reportar evidencia de lo ejecutado.
2. Actualizar `estado-actual.md` si la fase lo requiere.
3. Dejar el working tree limpio o con residuales justificados.
4. Recomendar el siguiente paso controlado.

### 9.4 Prohibiciones absolutas para agentes

- No declarar una nueva autoridad constitucional.
- No reabrir RT-1.5/OpenSpec como autoridad activa.
- No mover codigo por impulso o preferencia estetica.
- No crear repositorios nuevos sin decision institucional.
- No convertir una app o producto en autoridad del monorepo.
- No confundir herramientas externas con instituciones de Pekin.
- No hacer push sin autorizacion.
- No ignorar una restriccion activa declarada en `estado-actual.md`.

---

## 10. RELACION CON LEGOLAND

Legoland (La Armeria) cataloga, clasifica y certifica los componentes reutilizables de CURDEECLAU.

**Legoland gobierna:**
- `packages/` (engines, providers, shared, knowledge, memory, math)
- La clasificacion por tipo y madurez de cada lego
- La deteccion de duplicacion entre legos
- La certificacion de legos como Canonical

**Legoland NO gobierna:**
- `apps/` (son productos, no legos)
- `verticals/` (son configuraciones de dominio)
- `institutional/` (es Pekin mismo)
- `docs/` (es documentacion tecnica)
- `.claude/` (es el harness)
- `workflows/` (son blueprints, no legos)

Legoland es una institucion. No es la ciudad entera. Su autoridad se limita al catalogo de componentes reutilizables.

---

## 11. RELACION CON FORGE-PRO

Forge-Pro es una herramienta externa de construccion que vive fuera del monorepo CURDEECLAU.

- **No es una institucion de Pekin.** No reside en `.claude/memory/`.
- **No gobierna CURDEECLAU.** Es una herramienta, no una autoridad.
- **Puede ser naturalizada en el futuro** si el Senado lo decide. Requiere: ficha de naturalizacion, adapter (si aplica), y definicion clara de que principio aporta a CURDEECLAU.
- **Mientras no este naturalizada**, es un Aliado externo. Se usa, pero no se le otorga autoridad sobre la civilizacion.

---

## 12. RELACION CON PRODUCTOS Y VERTICALES

Los productos y verticales son **ciudadanos** de CURDEECLAU, no su identidad total.

| Entidad | Es | No es |
|---------|----|-------|
| Universidad Latino | Vertical de educacion | CURDEECLAU |
| Dental AI (Sarah) | Producto del vertical dental | CURDEECLAU |
| Quiniela | Producto de apuestas deportivas | CURDEECLAU |
| PORKYRIOS | Vertical/ producto | CURDEECLAU |
| Afropikal | Vertical/ producto | CURDEECLAU |
| AdmissionFlow | Producto de admision | CURDEECLAU |
| Algorithmus | Engine runtime conversacional | CURDEECLAU |

CURDEECLAU es la civilizacion que los contiene a todos. Ningun producto puede declarar que el monorepo es "suyo". Ningun vertical puede declarar su propia constitucion independiente (Principio XI — No Dispersion).

Cada producto y vertical debe:

1. Tener su DNA registrado en `institutional/dna/`.
2. Operar dentro de los principios constitucionales.
3. Consumir legos del catalogo cuando sea posible.
4. No crear gobernanza paralela.

---

## 13. CRITERIOS DE CIERRE DE FASES

Toda fase de trabajo institucional (ORG, GOV, NAT, DNA, RUN, MAP, PWA, UV) debe cerrar con:

1. **Reporte.** Documento en `operational/reports/` o seccion en `estado-actual.md` que describa que se hizo, que se encontro, que se decidio.
2. **Archivos modificados.** Lista explicita de archivos creados, modificados o movidos.
3. **Commits.** Hash del commit atomico (o commits) que ejecuto la fase.
4. **Restricciones vigentes.** Lista actualizada de restricciones activas al cierre de la fase.
5. **Siguiente linea recomendada.** Que fase o decision deberia seguir, segun los hallazgos.
6. **Working tree status.** `git status --short` limpio o con residuales justificados.

Solo cuando estos 6 criterios se cumplen, una fase se considera CLOSED.

---

## 14. PROHIBICIONES EXPLICITAS

Las siguientes acciones estan prohibidas en CURDEECLAU bajo toda circunstancia, salvo que una autoridad superior las autorice explicitamente:

1. **Doble gobernanza.** Crear o mantener una segunda autoridad constitucional paralela a Pekin.
2. **Reabrir RT-1.5/OpenSpec como autoridad.** Su contenido tecnico puede consultarse; su claim de autoridad esta supersedido por ADR-000 y es FORBIDDEN.
3. **Mover codigo por impulso.** Todo movimiento de packages, engines o providers requiere el proceso completo definido en la Seccion 8.
4. **Crear repos nuevos sin decision.** Fragmentar el monorepo sin ADR que lo autorice debilita la civilizacion.
5. **Convertir apps en autoridad del monorepo.** Una app puede gobernar su dominio. No puede gobernar la civilizacion.
6. **Confundir herramientas externas con Pekin.** Forge-Pro, Cursor, Claude Code, Vercel, Supabase son herramientas. Pekin es la civilizacion. Las herramientas se usan; Pekin se obedece.
7. **Borrar conocimiento.** Lo que ya no sirve se marca SUPERSEDIDO o DEPRECADO. Lo que se mueve se archiva. Nada se borra.
8. **Hacer push sin autorizacion.** Los agentes no pueden hacer push a menos que el mandato lo autorice explicitamente.
9. **Ignorar restricciones activas.** Todo agente debe leer `estado-actual.md` antes de actuar. Las restricciones alli declaradas son vinculantes.
10. **Crear ADR fuera de `institutional/adr/`.** Toda decision arquitectonica ratificada debe residir en el directorio de ADRs. No en `docs/`, no en `openspec/`, no en READMEs de packages.

---

## 15. CIERRE

Este documento no es eterno. Puede ser modificado por el Senado con aprobacion de la Asamblea mediante ADR.

Pero mientras este vigente, sus reglas son vinculantes para todo agente, humano o artificial, que opere en CURDEECLAU.

Pekin gobierna.
El Archivo recuerda.
Legoland cataloga.
Los agentes ejecutan.
Los productos viven.
La civilizacion perdura.

---

*Fin del Governance Level 2 v1.0.0*
*Creado el 13 de junio de 2026*
*Autorizado por ORG-1 (A, B, C) y ADR-000*
