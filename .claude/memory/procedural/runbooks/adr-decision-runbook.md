# ADR DECISION RUNBOOK

> Tipo: procedural/runbook
> Version: 1.0.0
> Proposito: Criterios para determinar cuando un cambio requiere un Architecture Decision Record (ADR).

---

## 1. PROPOSITO

Este runbook define cuando una decision debe registrarse como ADR en `institutional/adr/`. No todas las decisiones requieren ADR. Pero algunas decisiones sin ADR son peligrosas.

---

## 2. QUE ES UN ADR

Un ADR (Architecture Decision Record) es un documento que registra una decision arquitectonica significativa, con:
- Contexto (por que se tomo la decision)
- Alternativas consideradas (que otras opciones habia)
- Decision (que se decidio)
- Consecuencias (que implica, positivo y negativo)

Los ADRs residen en `.claude/memory/institutional/adr/` y son ratificados por la Asamblea.

---

## 3. CUANDO SE REQUIERE ADR

### Cambios que SIEMPRE requieren ADR

| Tipo de cambio | Ejemplo |
|----------------|---------|
| Movimiento de codigo entre directorios | Mover `telegram-provider` de `engines/` a `providers/` |
| Cambio de topologia del monorepo | Crear nueva capa `foundation/`, `runtime/` |
| Nueva autoridad constitucional o de gobernanza | Crear nueva institucion, modificar jerarquia |
| Naturalizacion canonica de proveedor | Declarar Supabase como Naturalized (no solo candidato) |
| Cambio de contratos en `shared/` | Modificar la interfaz `Engine`, `DomainEvent` |
| Modificacion de patterns canonicos | Cambiar invariantes del Ownership Pattern |
| Renombrar packages | Cambiar `ghl-engine` a `ghl-provider` |
| Cambiar git remote | Cambiar `origin` a otro repositorio |
| Introducir nueva plataforma externa critica | Nuevo proveedor del que depende el runtime |
| Extraer componente del monorepo | Mover `quiniela` a su propio repositorio |
| Modificar Constitucion, Principios o Instituciones | Cualquier cambio en `institutional/` Nivel 1-4 |

### Cambios que NO requieren ADR

| Tipo de cambio | Ejemplo | Donde se registra |
|----------------|---------|-------------------|
| Crear nuevo documento operacional | Nuevo reporte en `reports/` | estado-actual.md |
| Actualizar estado-actual.md | Cierre de fase | El propio commit |
| Crear runbook | Nuevo archivo en `procedural/runbooks/` | MEMORY.md |
| Crear ficha de naturalizacion | Nueva ficha en `naturalizacion/` | README de naturalizacion |
| Crear DNA template | Nuevo template en `dna/` | MEMORY.md |
| Archivar documentos supersedidos | Mover a `docs/archive/` | Fase autorizada (Phase E, ORG-1B) |
| Corregir typo en documentacion | Fix en `estado-actual.md` | Commit documental simple |
| Crear mapa de referencia | Nuevo archivo en `reference/` | MEMORY.md |

---

## 4. ARBOL DE DECISION

```
Se va a hacer un cambio.
        |
        v
Modifica codigo en packages/ o apps/?
        |               |
        SI              NO
        |               |
        v               v
Modifica estructura     Es cambio documental?
  (renombra, mueve,     |               |
   crea capa)?          SI              NO
  |         |           |               |
  SI        NO          v               v
  |         |       Sigue el        No es un cambio
  v         v       runbook         de CURDEECLAU.
REQUIERE   Requiere correspondiente
ADR        evaluacion:              (phase-closure,
           |                        document-archival,
           v                        operational-report,
           Modifica contratos       etc.)
           en shared/?
           |         |
           SI        NO
           |         |
           v         v
       REQUIERE   Cambio interno
       ADR        de engine/app?
                  |         |
                  SI        NO
                  |         |
                  v         v
              Requiere   No requiere
              spec +     ADR (pero
              tests      documentar
                         en commit)
```

---

## 5. FORMATO DE ADR

Usar el formato establecido por ADR-000:

```markdown
# ADR-XXX — Titulo descriptivo

> Tipo: institutional/adr
> Version: 1.0.0
> Ratificado: YYYY-MM-DD
> Autoridad: Asamblea de Pekin

---

## Estado
## Contexto
## Decision
## Consecuencias
## Alternativas consideradas
## Documentos afectados
```

Los ADRs se numeran secuencialmente (ADR-001, ADR-002, etc.).

---

## 6. ANTI-PATTERNS

- Crear ADR para cambios triviales (burocratiza la operacion).
- NO crear ADR para mover codigo entre capas (riesgo de drift estructural).
- Registrar una decision tecnica como ADR sin consultar el Archivo primero.
- Usar ADR como sustituto de spec tecnica (el ADR decide; la spec especifica).

---

*Fin del ADR Decision Runbook v1.0.0*
