# HANDOFF RUNBOOK

> Tipo: procedural/runbook
> Version: 1.0.0
> Proposito: Procedimiento para preparar un handoff limpio entre sesiones de trabajo institucional.

---

## 1. PROPOSITO

Este runbook define como preparar un handoff para que la siguiente sesion —con el mismo o diferente agente— pueda continuar sin perder contexto, sin repetir trabajo y sin violar restricciones.

Un handoff es el equivalente institucional de "pasar la estafeta".

---

## 2. CUANDO USARLO

Usar este runbook cuando:
- Una sesion de trabajo institucional termina y quedan pendientes.
- Se transfiere el control a otro agente o a una sesion futura.
- Se alcanza un punto de pausa natural (fase cerrada, siguiente fase pendiente).
- El usuario solicita explicitamente un resumen de estado.

---

## 3. ESTRUCTURA DEL HANDOFF

### 3.1 Estado actual

Resumen de una linea de donde esta la civilizacion:

```
Fases cerradas: ORG-1, GOV-1, NAT-1, DNA-1, MAP-1, RUN-1 (parcial)
Fase activa: RUN-1 (en progreso)
Ultimo commit: 8e32b3b feat(pekin): add institutional system map
Working tree: Limpio / Sucio (detallar)
```

### 3.2 Commits recientes

Ultimos 5-10 commits con hash y mensaje:

```
8e32b3b feat(pekin): add institutional system map
4b69577 feat(pekin): add reusable dna templates
...
```

### 3.3 Restricciones activas

Copiar literalmente de `estado-actual.md` > `RESTRICCIONES ACTIVAS`:

- No mover codigo...
- No cambiar remote...
- (etc.)

### 3.4 Working tree

Estado exacto:

```
git status --short
(limpio o listado de archivos)
```

### 3.5 Linea siguiente

Que deberia ocurrir en la proxima sesion:

- Fase recomendada
- Mandato esperado
- Archivos que se espera modificar

### 3.6 Riesgos

Riesgos que el siguiente agente debe conocer:

- Riesgos del mapa de sistemas (top 3-5)
- Riesgos de la fase actual
- Restricciones que no deben violarse

### 3.7 Prompt recomendado

Si el handoff es para un usuario humano, sugerir el prompt para iniciar la siguiente fase:

```
CURDEECLAU / PEKIN — RUN-1 EXECUTION ORDER

Estado:
...
```

---

## 4. FORMATO DEL HANDOFF

El handoff se entrega en la conversacion, no necesariamente como archivo. Debe ser en Markdown simple, sin emojis, portable.

---

## 5. VERIFICACION PRE-HANDOFF

Antes de entregar el handoff, verificar:

- [ ] `git status --short` fue ejecutado y reportado.
- [ ] `git log --oneline -5` fue ejecutado y reportado.
- [ ] Las restricciones activas fueron copiadas de `estado-actual.md`.
- [ ] La siguiente linea recomendada es concreta (no "hacer algo").
- [ ] Los riesgos son especificos (no "hay que tener cuidado").
- [ ] El working tree esta limpio o los residuales estan justificados.

---

## 6. ANTI-PATTERNS

- Handoff sin git status (el siguiente agente no sabe si el tree esta limpio).
- Handoff sin restricciones (el siguiente agente puede violar gobernanza).
- Handoff con "seguir trabajando" como siguiente paso (demasiado vago).
- Handoff sin commits recientes (el siguiente agente no sabe donde esta parado).
- Omitir riesgos (el siguiente agente tropieza con lo mismo).

---

*Fin del Handoff Runbook v1.0.0*
