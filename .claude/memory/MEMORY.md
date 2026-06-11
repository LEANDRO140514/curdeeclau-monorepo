# MEMORIA DE PEKÍN — Índice Central

> Tipo: reference (índice raíz)
> Versión: 1.0.0 — Fundacional
> Creado: 2026-06-06
> Actualizado: 2026-06-07
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

### Poblamiento pendiente (Registro Civil)
- [ ] `institutional/dna/vertical-algorithmus.md`
- [ ] `institutional/dna/vertical-dental.md`
- [ ] `institutional/dna/vertical-uv1.md`
- [ ] `institutional/dna/producto-quiniela.md`
- [ ] `institutional/dna/producto-admissionflow.md`
- [ ] `reference/legoland-catalogo.md`
- [ ] `pattern/` (7 patrones descubiertos)

### Poblamiento pendiente (Distritos)
- [ ] `procedural/naturalizacion/` (GHL, Telegram, Supabase, OpenAI, Pinecone)
- [ ] `procedural/runbooks/`
- [ ] `reference/mapa-sistemas.md`
- [ ] `reference/catalogo-eventos.md`

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
