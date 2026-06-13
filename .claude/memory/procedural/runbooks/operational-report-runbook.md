# OPERATIONAL REPORT RUNBOOK

> Tipo: procedural/runbook
> Version: 1.0.0
> Proposito: Procedimiento para crear, preservar y cerrar reportes operativos.

---

## 1. PROPOSITO

Este runbook define como manejar reportes operativos: documentos que registran la evidencia de una ejecucion institucional (auditoria, diagnostico, sintesis, analisis). Los reportes son efimeros por naturaleza pero pueden preservarse si tienen valor institucional.

---

## 2. CUANDO CREAR UN REPORTE

Crear un reporte operativo cuando:
- Se ejecuta una auditoria (triage de ADRs, inspeccion de documentos, analisis de patrones).
- Se sintetizan hallazgos de multiples fuentes (como ORG-1A con 5 agentes).
- Se documenta un diagnostico que luego fundamenta una decision.
- Una fase produce hallazgos que deben quedar registrados antes del cierre.
- El Senado o la Asamblea requiere evidencia documentada.

NO crear reporte para:
- Cada accion trivial (un git status no requiere reporte).
- Contenido que debe ir en estado-actual.md (el estado es continuo, el reporte es puntual).
- Decisiones que deben ser ADRs (un reporte no reemplaza un ADR).

---

## 3. DONDE GUARDARLO

| Tipo de reporte | Ubicacion |
|-----------------|-----------|
| Reporte de fase institucional | `operational/reports/` |
| Reporte de auditoria | `operational/reports/` o `operational/auditorias/` |
| Reporte temporal (una sesion) | No guardar en archivo; entregar en la conversacion |
| Reporte que fundamenta ADR | `operational/reports/` + referencia en el ADR |

---

## 4. ESTRUCTURA DE UN REPORTE

```markdown
# TITULO DEL REPORTE

> Tipo: operational/report
> Fecha: YYYY-MM-DD
> Ejecutor: Agente / Fase
> Alcance: Solo lectura / Documental / etc.

---

## 1. Contexto

## 2. Hallazgos

## 3. Riesgos

## 4. Recomendacion

## 5. Confirmaciones

---

*Fin del reporte*
```

---

## 5. CUANDO TRACKEARLO

Trackear (git add + commit) un reporte cuando:
- Documenta una fase institucional completada (ORG, GOV, NAT, DNA, MAP, RUN).
- Contiene hallazgos que fundamentan decisiones futuras.
- Es referenciado por estado-actual.md o MEMORY.md.
- El mandato de la fase lo requiere.

Dejar untracked o no guardar cuando:
- Es un diagnostico rapido que ya fue comunicado en la conversacion.
- Su contenido es puramente efimero (estado de una sesion).
- Sera reemplazado por un documento mas completo en breve.

---

## 6. COMO CITARLO EN ESTADO-ACTUAL

En la seccion de la fase correspondiente:

```markdown
## FASE-XX — DESCRIPCION: CLOSED

| Campo | Valor |
|-------|-------|
| Reporte | `operational/reports/nombre-reporte.md` |
```

---

## 7. COMO CERRARLO

Un reporte se considera cerrado cuando:
- [ ] El contenido esta completo (no tiene TODOs ni placeholders).
- [ ] Si es relevante, esta trackeado en git.
- [ ] Si es parte de una fase, esta referenciado en estado-actual.md.
- [ ] La fase que lo genero esta CLOSED.

---

## 8. CICLO DE VIDA

```
Diagnostico ejecutado
        |
        v
Reporte creado (en archivo o en conversacion)
        |
        v
Es institucionalmente relevante?
        |               |
        SI              NO
        |               |
        v               v
Trackear en git      Entregar en conversacion
        |               (no guardar en archivo)
        v
Referenciar en estado-actual.md
        |
        v
Cerrar con la fase
```

---

*Fin del Operational Report Runbook v1.0.0*
