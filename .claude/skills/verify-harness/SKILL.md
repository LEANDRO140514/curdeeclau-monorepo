# verify-harness

> Tipo: skill (battle)
> Versión: 0.1.0 — Minimal Ready
> Estado: ACTIVE_MINIMAL_READY
> Categoría: Harness / Verification
> Creado: 2026-06-16 — GOV-1

## Propósito

Verificar que un cambio de código o configuración funciona correctamente antes de ser aceptado. Implementa la fase **Verify** del ciclo LOOP Engineering.

## Cuándo usar

- Después de cualquier cambio funcional en `packages/`, `apps/`, `verticals/`.
- Antes de commitear cambios que afecten lógica de negocio.
- Antes de hacer push.
- Cuando se solicita `/verify` o verificación de PR.
- No usar para cambios puramente documentales.

## Entradas esperadas

- Archivos modificados (diff o lista).
- Tipo de cambio (funcional, configuración, documental).
- Contexto del cambio (qué se espera que haga).

## Procedimiento

1. Identificar tipo de cambio (funcional vs documental).
2. Si es funcional:
   a. Ejecutar typecheck (`pnpm typecheck` o `npx tsc --noEmit`).
   b. Ejecutar tests unitarios relacionados.
   c. Ejecutar tests de integración si los hay.
   d. Verificar que los tests cubren el cambio.
3. Si es documental:
   a. Verificar encoding (UTF-8).
   b. Verificar links internos.
   c. Verificar que no hay contradicciones con `institutional/`.
4. Reportar resultados: PASS / FAIL con detalles.

## Checklist

- [ ] Typecheck pasa.
- [ ] Tests relacionados pasan.
- [ ] No hay regresiones.
- [ ] El cambio hace lo que dice hacer.
- [ ] No hay efectos secundarios no documentados.

## Límites

- No modificar código para "hacer pasar tests".
- No bajar cobertura de tests.
- No silenciar errores.
- No verificar en producción sin autorización.

## Reglas de seguridad

- No exponer secretos en output de tests.
- No ejecutar tests contra producción.
- No usar datos reales de clientes en tests.

## Relación con LOOP Engineering

Implementa la fase **Verify**: comprobar que lo ejecutado cumple el plan y no rompe nada.
