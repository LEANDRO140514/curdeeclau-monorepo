# mcp-readiness

> Tipo: skill (battle)
> Versión: 0.1.0 — Minimal Ready
> Estado: ACTIVE_MINIMAL_READY
> Categoría: MCP / Equipment
> Creado: 2026-06-16 — GOV-1

## Propósito

Verificar que los MCPs requeridos para una tarea están configurados, activos y listos para usar. Implementa la fase **Verify** del ciclo LOOP Engineering aplicada al equipamiento.

## Cuándo usar

- Antes de iniciar una tarea que requiere MCPs específicos.
- Al inicio de cada sesión (verificar equipamiento disponible).
- Cuando se sospecha que un MCP no está funcionando.
- Después de agregar o modificar configuración MCP.
- No usar para MCPs que no son necesarios para la tarea actual.

## Entradas esperadas

- Lista de MCPs requeridos para la tarea.
- Equipment Registry actualizado.
- Configuración MCP (`.mcp.json` o equivalente).

## Procedimiento

1. Identificar qué MCPs requiere la tarea.
2. Consultar Equipment Registry para ver estado.
3. Para cada MCP requerido:
   a. Verificar que está configurado en `.mcp.json`.
   b. Verificar que las dependencias están instaladas.
   c. Verificar que las keys necesarias están presentes (sin imprimirlas).
   d. Ejecutar verificación segura (health check, no operación real).
4. Reportar estado: READY, PENDING_CONFIG, PENDING_KEY, PENDING_INSTALL, BROKEN.
5. Si algún MCP no está listo, documentar causa exacta y pasos para activarlo.

## Checklist

- [ ] Equipment Registry consultado.
- [ ] MCPs requeridos identificados.
- [ ] Cada MCP verificado (config, dependencias, keys).
- [ ] Verificaciones seguras ejecutadas (no destructivas).
- [ ] MCPs no listos documentados con causa exacta.

## Límites

- No verificar MCPs contra producción.
- No ejecutar operaciones reales durante verificación.
- No exponer keys o secrets en el reporte.
- No modificar configuración MCP sin autorización.

## Reglas de seguridad

- Verificaciones solo en desarrollo/local.
- No enviar emails, mensajes, cobros durante verificación.
- No usar credenciales de producción en verificación.
- No exponer API keys en logs o reportes.

## Relación con LOOP Engineering

Implementa la fase **Verify** aplicada al equipamiento: asegurar que las herramientas están listas antes de entrar al campo.
