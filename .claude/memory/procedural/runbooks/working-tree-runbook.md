# WORKING TREE RUNBOOK

> Tipo: procedural/runbook
> Version: 1.0.0
> Proposito: Procedimiento para manejar un working tree de git que no esta limpio.

---

## 1. PROPOSITO

Este runbook define como diagnosticar y resolver un working tree con cambios no commiteados antes de iniciar o cerrar una fase institucional.

Un working tree sucio es la principal fuente de commits mezclados, perdida de trazabilidad y violacion de restricciones.

---

## 2. CUANDO USARLO

Usar este runbook cuando:
- `git status --short` no esta vacio al inicio de una fase.
- `git status --short` no esta vacio al cierre de una fase (antes del commit).
- Se detectan archivos modificados que no pertenecen al alcance autorizado.
- Hay untracked files que no se sabe si preservar o ignorar.

---

## 3. PROCEDIMIENTO

### Paso 1: Ejecutar diagnostico

```
git status --short
```

Clasificar cada archivo:

| Codigo | Significado | Accion |
|--------|-------------|--------|
| `M` (staged o unstaged) | Modificado | Revisar si el cambio esta autorizado |
| `A` (staged) | Nuevo, listo para commit | Verificar que pertenece al alcance |
| `??` (untracked) | Nuevo, no trackeado | Clasificar (ver Paso 2) |
| `R` (staged) | Renamed | Verificar que es un movimiento autorizado |
| `D` (staged) | Deleted | Verificar que la eliminacion esta autorizada |

### Paso 2: Clasificar cambios

Para cada archivo, decidir:

| Tipo de archivo | Pertenece al alcance? | Accion |
|-----------------|----------------------|--------|
| Documentacion institucional (.claude/memory/) | Si | Incluir en commit |
| Documentacion institucional (.claude/memory/) | No | Revertir o dejar untracked |
| Codigo (packages/, apps/) | Si | Incluir en commit |
| Codigo (packages/, apps/) | No | Revertir |
| Reportes operativos | Si | Incluir en commit |
| Reportes operativos | No | Dejar untracked o eliminar |
| Archivos de configuracion (.env, settings) | — | NUNCA commitear si contienen secretos |
| Archivos de build (dist/, .next/) | — | NUNCA commitear. Verificar .gitignore. |

### Paso 3: Separar codigo de documentacion

Regla fundamental: **nunca mezclar cambios de codigo con cambios documentales en el mismo commit.**

Si el working tree tiene ambos:
1. Hacer commit de documentacion primero.
2. Hacer commit de codigo despues (o viceversa).
3. Cada commit con su propio mensaje descriptivo.

Excepcion: si el mandato autoriza explicitamente un commit atomico mixto (codigo + docs).

### Paso 4: Decidir accion por archivo

| Situacion | Accion |
|-----------|--------|
| Archivo modificado, cambio autorizado | `git add` + incluir en commit |
| Archivo modificado, cambio NO autorizado | `git checkout -- archivo` (revertir) |
| Archivo nuevo, debe trackearse | `git add` |
| Archivo nuevo, no debe trackearse | Dejar untracked o agregar a .gitignore |
| Archivo nuevo, temporal | Eliminar con `rm` |
| Archivo renombrado, autorizado | Ya esta en stage (git mv) |
| Archivo eliminado, autorizado | `git rm` si no se hizo ya |

### Paso 5: No avanzar con working tree ambiguo

Condiciones para avanzar:
- [ ] Todos los archivos modificados estan clasificados.
- [ ] Los archivos dentro del alcance estan staged.
- [ ] Los archivos fuera del alcance estan revertidos.
- [ ] Los untracked estan justificados o eliminados.
- [ ] No hay archivos de codigo mezclados con documentacion en el mismo stage.

Si alguna condicion no se cumple: DETENERSE. Reportar la ambiguedad. No commitear.

---

## 4. CASOS COMUNES

### Caso A: Working tree limpio al inicio

- Proceder con la fase. Nada que resolver.

### Caso B: Solo untracked reports/

- Si los reportes son de la sesion actual y deben preservarse: incluir en commit.
- Si son residuales de sesiones anteriores: decidir si trackear o dejar.

### Caso C: Cambios en codigo no autorizados

- REVERTIR inmediatamente.
- Reportar al usuario que se encontraron cambios no autorizados.
- No continuar la fase hasta resolver.

### Caso D: Cambios en institutional/ no autorizados

- REVERTIR inmediatamente.
- Escalar al Senado. Un agente no puede modificar institutional/ sin autorizacion.

---

## 5. ANTI-PATTERNS

- Commit con mensaje generico que mezcla codigo y documentacion.
- Ignorar untracked files "porque no molestan".
- Asumir que un archivo modificado es seguro sin revisar su contenido.
- Avanzar de fase con working tree sucio sin justificar.
- `git add .` (agrega todo sin discriminar).

---

*Fin del Working Tree Runbook v1.0.0*
