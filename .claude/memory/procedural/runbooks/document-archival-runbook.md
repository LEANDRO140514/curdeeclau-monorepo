# DOCUMENT ARCHIVAL RUNBOOK

> Tipo: procedural/runbook
> Version: 1.0.0
> Proposito: Procedimiento para archivar documentos supersedidos o legacy en CURDEECLAU.

---

## 1. PROPOSITO

Este runbook define como archivar documentos cuyo conocimiento ya fue absorbido por el Archivo de Pekin o que han sido declarados SUPERSEDIDOS. El archival preserva el conocimiento sin mantener autoridad activa.

---

## 2. CUANDO USARLO

Usar este runbook cuando:
- Un documento fue declarado SUPERSEDIDO por un ADR o decision del Senado.
- Un documento legacy fue completamente absorbido por `.claude/memory/`.
- Una fase como Phase E, ORG-1B, o similar autoriza el archival.
- Un documento en `docs/` ya no tiene funcion activa y su conocimiento esta en otra parte.

NO usar cuando:
- El documento es la unica fuente de cierto conocimiento (primero absorber, luego archivar).
- El documento esta en `institutional/` (eso requiere ADR, no solo archival).
- El documento es codigo activo (eso requiere decommission, no archival).

---

## 3. PROCEDIMIENTO

### Paso 1: Confirmar supersedencia

Verificar que el documento:
- Tiene header de SUPERSEDIDO o DEPRECADO, o
- Esta listado en un ADR como supersedido, o
- Su contenido fue verificado como absorbido en `.claude/memory/`.

Si no se cumple ninguna de estas condiciones: NO archivar. Reportar y pedir autorizacion.

### Paso 2: Verificar conocimiento preservado

Confirmar que el conocimiento del documento existe en otra ubicacion activa:
- `institutional/` (para gobernanza)
- `pattern/` (para patrones)
- `reference/` (para catalogos y mapas)
- `operational/` (para estado y auditorias)
- `procedural/` (para procedimientos)

Ejecutar busqueda de contenido clave del documento en `.claude/memory/` para confirmar absorcion.

### Paso 3: Determinar destino

| Tipo de documento | Destino sugerido | Nombre sugerido |
|-------------------|-----------------|-----------------|
| Governance supersedido | `docs/archive/` | `original-name.superseded.md` |
| Estado obsoleto | `docs/archive/` | `ORIGINAL-NAME.superseded.md` |
| Documento legacy absorbido | `docs/archive/` | Mantener nombre o agregar prefijo |
| Documento tecnico historico | `docs/archive/` | Mantener nombre |

### Paso 4: Mover con git mv

Usar `git mv` para preservar historial:
```
git mv docs/ruta/origen.md docs/archive/destino.md
```

Nunca usar `mv` del sistema operativo sin git. Se pierde trazabilidad.

### Paso 5: Verificar referencias

Buscar referencias al documento movido en:
- MEMORY.md
- estado-actual.md
- Otros documentos en `.claude/memory/`
- CLAUDE.md
- README.md

Si hay referencias, actualizarlas para apuntar a la nueva ubicacion o al documento absorbente.

### Paso 6: Actualizar docs/archive/README.md

Agregar entrada en el inventario de archive:
```markdown
| documento.md | ruta/original/ | YYYY-MM-DD |
```

### Paso 7: Actualizar memoria

- MEMORY.md: marcar archival como completado si es parte de una fase.
- estado-actual.md: registrar el archival en la seccion correspondiente.

### Paso 8: Commit atomico

Incluir en el commit:
- El archivo movido (git mv)
- Las referencias actualizadas
- MEMORY.md y estado-actual.md si fueron modificados

NO incluir en el mismo commit:
- Cambios de codigo
- Otros movimientos no relacionados
- Nuevos documentos no autorizados

---

## 4. VERIFICACION POST-ARCHIVAL

- [ ] El archivo ya no existe en su ubicacion original.
- [ ] El archivo existe en `docs/archive/`.
- [ ] `git log --follow docs/archive/documento.md` muestra historial.
- [ ] Las referencias en `.claude/memory/` fueron actualizadas.
- [ ] El conocimiento absorbido sigue accesible en `.claude/memory/`.

---

## 5. ANTI-PATTERNS

- Archivar antes de absorber (se pierde conocimiento).
- Mover con `mv` en lugar de `git mv` (se pierde trazabilidad).
- Archivar documentos activos sin declarar supersedencia.
- Archivar sin actualizar referencias (links rotos).
- Borrar en lugar de archivar (viola Principio II — Primacia de la Memoria).

---

*Fin del Document Archival Runbook v1.0.0*
