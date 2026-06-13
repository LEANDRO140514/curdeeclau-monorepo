# NO-CODE CHANGE PHASE RUNBOOK

> Tipo: procedural/runbook
> Version: 1.0.0
> Proposito: Procedimiento para ejecutar fases puramente documentales sin modificar codigo.

---

## 1. PROPOSITO

Este runbook define como ejecutar fases institucionales que solo modifican documentacion (`.claude/memory/`, `docs/`, `procedural/`, `reference/`) sin tocar codigo (`packages/`, `apps/`, configuraciones de build, dependencias).

La mayoria de las fases de construccion institucional (GOV, NAT, DNA, MAP, RUN) son fases documentales. Esta es su plantilla de ejecucion.

---

## 2. CUANDO USARLO

Usar este runbook cuando el mandato de la fase incluye explícitamente:

> No modificar codigo.
> No mover packages.
> No renombrar carpetas.
> No tocar engines.
> No tocar providers.
> No tocar apps.

---

## 3. ALCANCE DOCUMENTAL

Una fase documental PUEDE:

- Crear archivos en `.claude/memory/` (operational/, procedural/, reference/).
- Modificar `MEMORY.md` y `estado-actual.md`.
- Crear o modificar archivos en `docs/` (si esta autorizado).
- Mover documentos legacy a `docs/archive/` (si esta autorizado).
- Crear reportes en `operational/reports/`.

Una fase documental NO PUEDE:

- Modificar archivos en `packages/` o `apps/`.
- Modificar `package.json`, `tsconfig.json`, o configuraciones de build.
- Modificar `CLAUDE.md` o `README.md` (salvo autorizacion explicita).
- Modificar `institutional/` (salvo autorizacion del Senado o Asamblea).
- Ejecutar `pnpm install`, `pnpm build`, `pnpm test`.
- Conectar APIs o crear credenciales.

---

## 4. PROCEDIMIENTO

### Paso 1: Leer estado actual

Antes de comenzar:
- Leer `MEMORY.md`.
- Leer `estado-actual.md` (especialmente restricciones activas).
- Leer referencias obligatorias del mandato.

### Paso 2: Verificar working tree

```
git status --short
```

Debe estar limpio o solo con untracked justificados. Si hay cambios en codigo: DETENERSE. Aplicar `working-tree-runbook.md`.

### Paso 3: Ejecutar tareas documentales

- Crear solo los archivos autorizados en el mandato.
- No crear archivos adicionales "por conveniencia".
- Respetar las ubicaciones sugeridas en el mandato.
- Usar los templates existentes si aplican (DNA, naturalizacion).

### Paso 4: Verificar cero codigo modificado

Antes del commit, ejecutar:

```
git diff --stat -- packages/ apps/
```

Debe devolver output vacio. Si muestra archivos modificados: DETENERSE. Algo toco codigo sin autorizacion.

Tambien verificar:

```
git diff --stat -- package.json tsconfig.json pnpm-workspace.yaml
```

Debe devolver output vacio.

### Paso 5: Stage y commit documental

```
git add <solo archivos documentales>
git commit -m "tipo(pekin): descripcion"
```

Mensaje de commit documental:
- `feat(pekin):` para nueva capacidad institucional.
- `chore(pekin):` para limpieza o archival.

El commit NO debe incluir:
- Archivos de codigo.
- Archivos de configuracion de build.
- Archivos fuera del alcance autorizado.

### Paso 6: Verificar post-commit

```
git status --short
git log --oneline -1
git diff --stat HEAD~1 -- packages/ apps/
```

La ultima linea debe devolver output vacio (cero codigo en el diff del commit).

### Paso 7: Cerrar la fase

Aplicar `phase-closure-runbook.md`:
- Listar archivos creados/modificados.
- Confirmar restricciones respetadas.
- Reportar commit hash.
- Recomendar siguiente fase.

---

## 5. LISTA DE VERIFICACION

Antes de declarar la fase CLOSED:

- [ ] `git status --short` limpio o residual justificado.
- [ ] `git diff --stat -- packages/ apps/` vacio.
- [ ] `git diff --stat -- package.json tsconfig.json` vacio.
- [ ] Archivos creados coinciden con el alcance autorizado.
- [ ] MEMORY.md actualizado.
- [ ] estado-actual.md actualizado.
- [ ] Commit creado con mensaje descriptivo.
- [ ] Commit hash reportado.
- [ ] Siguiente fase recomendada.

---

## 6. ANTI-PATTERNS

- Crear archivos documentales fuera del alcance "porque son utiles".
- Modificar institutional/ sin autorizacion (eso es competencia del Senado/Asamblea).
- Commit que mezcla un "pequeno fix de codigo" con documentacion.
- No verificar `git diff --stat -- packages/` antes del commit.
- Asumir que "solo documentacion" significa que no hay que verificar nada.

---

*Fin del No-Code Change Phase Runbook v1.0.0*
