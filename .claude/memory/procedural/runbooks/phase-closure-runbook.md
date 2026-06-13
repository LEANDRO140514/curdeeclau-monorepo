# PHASE CLOSURE RUNBOOK

> Tipo: procedural/runbook
> Version: 1.0.0
> Proposito: Procedimiento estandar para cerrar una fase institucional en CURDEECLAU.

---

## 1. PROPOSITO

Este runbook define el procedimiento para cerrar cualquier fase institucional (ORG, GOV, NAT, DNA, MAP, RUN, PWA, UV, etc.) de forma consistente, trazable y gobernada.

---

## 2. CUANDO USARLO

Usar este runbook cuando:
- Una fase institucional ha completado su alcance autorizado.
- Todos los archivos objetivo han sido creados o modificados.
- Se ha verificado que no hay cambios no autorizados.
- Se esta listo para commit y cierre.

---

## 3. PRERREQUISITOS

Antes de ejecutar este runbook, verificar:

- [ ] La fase tiene un mandato explicito (mensaje del usuario con alcance definido).
- [ ] El alcance autorizado esta completamente ejecutado.
- [ ] No se excedio el alcance (no se movio codigo sin autorizacion, no se tocaron engines/providers/apps sin permiso).
- [ ] Las restricciones del mandato fueron respetadas.
- [ ] `estado-actual.md` fue leido antes de comenzar.

---

## 4. PROCEDIMIENTO

### Paso 1: Verificar alcance completado

- Revisar el mandato original.
- Confirmar que cada tarea fue ejecutada.
- Confirmar que ninguna tarea no autorizada fue ejecutada.

### Paso 2: Listar archivos modificados

Ejecutar:
```
git status --short
```

Confirmar que la lista de archivos coincide con lo esperado:
- Solo archivos dentro del alcance autorizado.
- Sin archivos de codigo si la fase era documental.
- Sin archivos en `institutional/` si no estaba autorizado.

### Paso 3: Confirmar restricciones

Verificar cada restriccion del mandato:
- [ ] Codigo modificado? (debe ser cero si la fase es documental)
- [ ] Packages movidos? (debe ser cero si no autorizado)
- [ ] Remotes cambiados? (debe ser cero)
- [ ] Push ejecutado? (debe ser no)
- [ ] Working tree ambiguo? (debe estar limpio o con residuales justificados)

### Paso 4: Actualizar MEMORY.md

Agregar entrada en la seccion correspondiente:
```markdown
### Poblamiento completado (FASE-XX, YYYY-MM-DD)
- [x] Archivo o tarea completada
```

Si la fase completa un item pendiente, marcarlo `[x]` y moverlo a la seccion de completados.

### Paso 5: Actualizar estado-actual.md

Agregar seccion de cierre:
```markdown
## FASE-XX — DESCRIPCION: CLOSED

| Campo | Valor |
|-------|-------|
| Fecha | YYYY-MM-DD |
| (campos especificos de la fase) |
| Commit | Pendiente de commit |
```

Actualizar:
- Inventario del Archivo (si se crearon nuevos archivos).
- Pendientes destacados (remover lo completado, agregar nuevos si surgieron).
- Siguiente linea recomendada.

### Paso 6: Generar commit

Usar `git add` solo para los archivos del alcance.

Mensaje de commit sugerido segun tipo de fase:
- Nueva capacidad: `feat(pekin): descripcion breve`
- Limpieza/archivo: `chore(pekin): descripcion breve`

Ejecutar:
```
git add <archivos exactos>
git commit -m "tipo(pekin): descripcion"
```

### Paso 7: Reportar hash

Despues del commit, ejecutar:
```
git log --oneline -1
```

Incluir el hash completo en el reporte de cierre.

### Paso 8: Recomendar siguiente fase

Basado en los hallazgos y el estado actual, recomendar:
- Siguiente fase concreta (ej: NAT-1, DNA-1, MAP-1, RUN-1).
- O "Pendiente de decision del Senado" si no hay mandato claro.

### Paso 9: Verificar estado final

Ejecutar:
```
git status --short
git log --oneline -5
```

Entregar reporte final con:
1. Archivos creados/modificados
2. Resumen de lo ejecutado
3. Confirmacion de restricciones respetadas
4. Commit hash
5. Estado final del working tree
6. Siguiente recomendacion

---

## 5. CRITERIOS DE CIERRE

La fase se considera CLOSED cuando:

- [ ] Alcance completado.
- [ ] Archivos modificados listados.
- [ ] Restricciones confirmadas.
- [ ] MEMORY.md actualizado.
- [ ] estado-actual.md actualizado.
- [ ] Commit creado.
- [ ] Commit hash reportado.
- [ ] Siguiente fase recomendada.
- [ ] Working tree limpio o residual justificado.

---

## 6. ANTI-PATTERNS

- Cerrar una fase sin commit ("Pendiente de commit" permanente).
- Cerrar una fase con working tree sucio sin justificar.
- Actualizar estado-actual.md sin actualizar MEMORY.md (o viceversa).
- Commit con archivos fuera del alcance autorizado.
- Push sin autorizacion explicita.
- Recomendar siguiente fase sin evidencia.

---

*Fin del Phase Closure Runbook v1.0.0*
