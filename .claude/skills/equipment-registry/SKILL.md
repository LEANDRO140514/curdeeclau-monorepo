# equipment-registry

> Tipo: skill (battle)
> Versión: 0.1.0 — Minimal Ready
> Estado: ACTIVE_MINIMAL_READY
> Categoría: Memory / Governance
> Creado: 2026-06-16 — GOV-1

## Propósito

Mantener actualizado el registro central de equipamiento (skills, MCPs, herramientas) de la Élite Guerrera. Implementa la fase **Document** del ciclo LOOP Engineering aplicada al inventario operativo.

## Cuándo usar

- Cuando se agrega una nueva skill.
- Cuando se activa o desactiva un MCP.
- Cuando cambia el estado de un equipo.
- Cuando se detecta equipamiento no registrado.
- Como parte del cierre de fases GOV, NAT, o MCP-related.
- No usar para cambios que no afectan el equipamiento.

## Entradas esperadas

- Tipo de cambio (nueva skill, nuevo MCP, cambio de estado).
- Datos del equipo (nombre, categoría, estado, dependencias).
- Equipment Registry actual (`institutional/EQUIPMENT_REGISTRY.md`).

## Procedimiento

1. Identificar el cambio de equipamiento.
2. Leer Equipment Registry actual.
3. Actualizar la sección correspondiente:
   - **Skills:** nombre, carpeta, archivo principal, estado, categoría.
   - **MCPs:** nombre, estado, key requerida, dependencia, prioridad.
   - **Readiness Matrix:** actualizar columna de estado y notas.
4. Verificar que el cambio no duplica entradas existentes.
5. Verificar que los estados son consistentes.

## Checklist

- [ ] Equipment Registry actualizado con el nuevo estado.
- [ ] Readiness Matrix actualizada.
- [ ] No hay duplicados.
- [ ] Estados consistentes con la realidad operativa.
- [ ] Fecha de actualización registrada.

## Límites

- No inventar equipamiento (solo registrar lo que existe).
- No eliminar entradas (marcar DEPRECATED o SUPERSEDIDO).
- No modificar estado sin evidencia.
- No registrar MCPs con keys expuestas.

## Reglas de seguridad

- No incluir valores de keys en el registro.
- No incluir URLs de producción si son sensibles.
- No incluir connection strings.

## Relación con LOOP Engineering

Implementa la fase **Document** aplicada al inventario: mantener el mapa de herramientas actualizado para que cada constructor sepa con qué cuenta.
