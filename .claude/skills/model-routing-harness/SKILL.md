# model-routing-harness

> Tipo: skill (battle)
> Versión: 0.1.0 — Minimal Ready
> Estado: ACTIVE_MINIMAL_READY
> Categoría: Model / Routing
> Creado: 2026-06-16 — GOV-1

## Propósito

Seleccionar el modelo LLM correcto para cada tarea según estrategia, costo y capacidad requerida. Implementa la fase **Execute** del ciclo LOOP Engineering en lo que respecta a selección de capacidad.

## Cuándo usar

- Antes de ejecutar tareas que requieren LLM (generación, análisis, clasificación).
- Cuando se necesita optimizar costo vs calidad.
- Cuando una tarea requiere razonamiento profundo (→ premium).
- Cuando una tarea es simple y conviene modelo económico.
- No usar para tareas que no requieren LLM.

## Entradas esperadas

- Tipo de tarea (generación, análisis, clasificación, razonamiento).
- Complejidad estimada (baja, media, alta).
- Presupuesto de tokens disponible.
- Modelos disponibles (según LLMRouter configurado).

## Procedimiento

1. Clasificar la tarea por tipo y complejidad.
2. Seleccionar estrategia:
   - **default** → OpenRouter (balance costo/calidad).
   - **cheap** → DeepSeek (tareas simples, económicas).
   - **premium** → Anthropic (razonamiento profundo).
   - **reasoning** → Anthropic (tareas complejas).
   - **specificProvider** → Proveedor específico si la tarea lo requiere.
3. Verificar disponibilidad del modelo seleccionado.
4. Ejecutar con fallback automático en caso de error.

## Checklist

- [ ] La estrategia elegida es adecuada para la tarea.
- [ ] El modelo está disponible (no requiere key no configurada).
- [ ] El presupuesto de tokens es suficiente.
- [ ] Se configuró fallback en caso de error.

## Límites

- No hardcodear proveedores (usar LLMRouter).
- No ignorar el presupuesto de tokens.
- No usar premium para tareas triviales.
- No usar cheap para tareas que requieren precisión.

## Reglas de seguridad

- No exponer API keys en logs de routing.
- No registrar contenido de prompts con datos sensibles.
- No bypass el router para usar proveedores directos sin autorización.

## Relación con LOOP Engineering

Implementa la fase **Execute** en su dimensión de selección de capacidad: usar la herramienta correcta para cada tarea, optimizando recursos.
