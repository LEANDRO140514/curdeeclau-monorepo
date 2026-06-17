# memory-harness

> Tipo: skill (battle)
> Versión: 0.1.0 — Minimal Ready
> Estado: ACTIVE_MINIMAL_READY
> Categoría: Memory / Governance
> Creado: 2026-06-16 — GOV-1

## Propósito

Garantizar que el conocimiento generado en cada sesión se registre correctamente en el Archivo de Pekín. Implementa las fases **Document + Learn** del ciclo LOOP Engineering.

## Cuándo usar

- Después de tomar una decisión de arquitectura o diseño.
- Después de completar una fase (GOV, ORG, UV, etc.).
- Cuando se descubre un patrón, hallazgo o riesgo nuevo.
- Al cerrar una sesión de trabajo productiva.
- No usar para documentar trivialidades o notas efímeras.

## Entradas esperadas

- Tipo de conocimiento (decisión, hallazgo, patrón, riesgo, fase).
- Contexto (qué se hizo, por qué, qué se aprendió).
- Ubicación objetivo en el Archivo.

## Procedimiento

1. Clasificar el conocimiento:
   - **Decisión** → `operational/` (si no ratificada) o `institutional/adr/` (si ratificada).
   - **Hallazgo** → `operational/reports/`.
   - **Patrón** → `pattern/` (si 3+ ocurrencias).
   - **Fase** → `estado-actual.md`.
   - **Aprendizaje** → `MEMORY.md` (resumen) + `institutional/` (si es institucional).
2. Escribir en la ubicación correcta.
3. Actualizar `MEMORY.md` si es un hito significativo.
4. Verificar que el documento cumple el formato del Archivo (tipo, versión, fecha).

## Checklist

- [ ] El conocimiento está en la ubicación correcta.
- [ ] El documento tiene tipo, versión, fecha.
- [ ] No se escribió en `institutional/` sin autorización.
- [ ] No se duplicó conocimiento existente.
- [ ] Se referenció la fuente (fase, commit, issue).

## Límites

- No escribir en `institutional/` sin autorización del Senado.
- No borrar conocimiento existente (marcar SUPERSEDIDO).
- No documentar sin evidencia.
- No duplicar lo que ya está en git (commits, logs).

## Reglas de seguridad

- No incluir secretos en documentos del Archivo.
- No incluir datos de clientes sin anonimizar.
- No incluir credenciales, tokens, o URLs de producción.

## Relación con LOOP Engineering

Implementa las fases **Document + Learn**: registrar decisiones y extraer principios para que Pekín aprenda de cada ciclo.
