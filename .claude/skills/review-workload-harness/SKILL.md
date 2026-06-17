# review-workload-harness

> Tipo: skill (battle)
> Versión: 0.1.0 — Minimal Ready
> Estado: ACTIVE_MINIMAL_READY
> Categoría: Harness / Verification
> Creado: 2026-06-16 — GOV-1

## Propósito

Revisar cambios de código o documentación para detectar bugs, problemas de seguridad, violaciones de principios y oportunidades de simplificación. Implementa las fases **Verify + Correct** del ciclo LOOP Engineering.

## Cuándo usar

- Antes de mergear un PR.
- Después de cambios sustanciales en engines o providers.
- Cuando se detecta comportamiento inesperado.
- Como parte del ciclo LOOP después de Verify.
- No usar para cambios triviales (typos, formato).

## Entradas esperadas

- Diff o lista de archivos modificados.
- Contexto del cambio (issue, fase, propósito).
- Principios o patrones relevantes.

## Procedimiento

1. Leer el diff completo.
2. Revisar contra dimensiones:
   a. **Correctness:** ¿El cambio hace lo que dice? ¿Hay bugs?
   b. **Security:** ¿Se exponen secretos? ¿Se validan entradas?
   c. **Principles:** ¿Cumple los 10 Principios Constitucionales?
   d. **Patterns:** ¿Sigue los patrones de Pekín (Provider, Engine, FSM)?
   e. **Simplicity:** ¿Hay sobre-ingeniería? ¿Se puede simplificar?
3. Clasificar hallazgos: CRITICAL, HIGH, MEDIUM, LOW.
4. Reportar con ubicación exacta (archivo:línea).

## Checklist

- [ ] No hay bugs evidentes.
- [ ] No hay secretos expuestos.
- [ ] Los principios se respetan.
- [ ] Los patrones se siguen.
- [ ] No hay sobre-ingeniería.
- [ ] Los imports son correctos (de shared/, no de providers directo).

## Límites

- No reescribir código sin autorización.
- No imponer preferencias estilísticas personales.
- No bloquear por hallazgos LOW sin contexto.
- No revisar código de producción sin autorización.

## Reglas de seguridad

- No exponer secretos en el reporte de revisión.
- No ejecutar código no verificado.
- No acceder a sistemas de producción para revisar.

## Relación con LOOP Engineering

Implementa las fases **Verify + Correct**: revisar críticamente y sugerir correcciones antes de que el cambio se consolide.
