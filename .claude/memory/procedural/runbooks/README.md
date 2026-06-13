# PEKIN RUNBOOKS

> Tipo: procedural/runbooks
> Version: 1.0.0
> Creado: 2026-06-13
> Autoridad: Governance Level 2, Secciones 7, 8, 9 y 13

---

## 1. QUE ES UN RUNBOOK

Un runbook es un procedimiento operativo repetible. Describe paso a paso como ejecutar una operacion institucional sin improvisar, sin romper gobernanza y sin tocar codigo innecesariamente.

Un runbook no es:
- Un ADR (decision arquitectonica ratificada)
- Un reporte operativo (evidencia de una ejecucion)
- Governance (reglas generales)
- Un DNA template (declaracion de identidad de un componente)
- Una ficha de naturalizacion (evaluacion de proveedor externo)

Un runbook es el "como se hace" para operaciones concretas.

---

## 2. CUANDO USAR UN RUNBOOK

Usar un runbook cuando:
- Se va a cerrar una fase institucional (ORG, GOV, NAT, DNA, MAP, RUN, etc.)
- Se va a archivar un documento o grupo de documentos
- Se va a crear o preservar un reporte operativo
- El working tree tiene cambios y se necesita decidir que hacer
- Se necesita determinar si un cambio requiere ADR
- Se necesita preparar un handoff entre sesiones
- Se va a ejecutar una fase puramente documental (sin codigo)

---

## 3. QUIEN PUEDE EJECUTAR UN RUNBOOK

| Rol | Puede ejecutar? | Condiciones |
|-----|-----------------|-------------|
| Agente autorizado | Si | Debe leer estado-actual.md antes. |
| Senado | Si | Puede ordenar ejecucion. |
| Asamblea | Si | Puede requerir runbook como paso previo. |
| Fundador | Si | Autoridad maxima. |

---

## 4. DIFERENCIA ENTRE TIPOS DE DOCUMENTOS

| Tipo de documento | Proposito | Ubicacion | Ejemplo |
|-------------------|-----------|-----------|---------|
| **Runbook** | Procedimiento repetible | `procedural/runbooks/` | `phase-closure-runbook.md` |
| **ADR** | Decision arquitectonica ratificada | `institutional/adr/` | `ADR-000-pekin-supersedes-rt15-governance.md` |
| **Reporte operativo** | Evidencia de una ejecucion | `operational/reports/` | `adr-triage-report.md` |
| **Governance** | Reglas generales de gobierno | `institutional/governance.md` | Governance Level 2 |
| **DNA Template** | Declaracion de identidad | `procedural/dna/` | `ENGINE_DNA_TEMPLATE.md` |
| **Naturalization File** | Evaluacion de proveedor externo | `procedural/naturalizacion/` | `openai.md` |

---

## 5. REGLAS GENERALES PARA EJECUCION

Antes de ejecutar cualquier runbook:

1. Leer `estado-actual.md` para conocer restricciones vigentes.
2. Confirmar working tree limpio con `git status --short`.
3. Verificar que la operacion esta autorizada por el mandato activo.
4. Identificar que runbook(s) aplican.

Durante la ejecucion:

5. No hacer push sin autorizacion explicita.
6. No modificar codigo salvo mandato explicito.
7. No modificar `institutional/` sin autorizacion del Senado o Asamblea.
8. Preservar conocimiento antes de archivar (nada se borra, se supersede o archiva).

Despues de la ejecucion:

9. Cerrar con evidencia (archivos modificados, commits, estado final).
10. Actualizar `estado-actual.md` si la fase lo requiere.
11. Recomendar siguiente paso controlado.
12. Dejar working tree limpio o con residuales justificados.

---

## 6. INVENTARIO DE RUNBOOKS

| Runbook | Archivo | Proposito |
|---------|---------|-----------|
| Phase Closure | `phase-closure-runbook.md` | Como cerrar una fase institucional |
| Document Archival | `document-archival-runbook.md` | Como archivar documentos supersedidos |
| Operational Report | `operational-report-runbook.md` | Como manejar reportes operativos |
| Working Tree | `working-tree-runbook.md` | Que hacer si el working tree no esta limpio |
| ADR Decision | `adr-decision-runbook.md` | Cuando se requiere un ADR |
| Handoff | `handoff-runbook.md` | Como preparar handoff entre sesiones |
| No-Code Phase | `no-code-change-phase-runbook.md` | Como ejecutar fases puramente documentales |

---

*Fin del Runbooks README v1.0.0*
