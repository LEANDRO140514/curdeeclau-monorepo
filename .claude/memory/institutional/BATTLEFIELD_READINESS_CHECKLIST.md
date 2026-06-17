# BATTLEFIELD READINESS CHECKLIST

> Tipo: procedural/checklist
> Versión: 1.0.0 — GOV-1 Battlefield Readiness
> Creado: 2026-06-16
> Propósito: Checklist rápido de entrada al campo de batalla para todo constructor de la Élite Guerrera

---

## CHECKLIST DE ENTRADA

Ejecutar en orden antes de cualquier trabajo de construcción:

### Fase 1 — Gobierno

- [ ] ¿Leí `CLAUDE.md`?
- [ ] ¿Leí `STATE.md`?
- [ ] ¿Leí `MEMORY.md`?
- [ ] ¿Leí `estado-actual.md` para restricciones vigentes?
- [ ] ¿Sé qué fase está activa y qué está bloqueado?

### Fase 2 — Equipamiento

- [ ] ¿Consulté Equipment Registry?
- [ ] ¿Sé qué MCPs están activos?
- [ ] ¿Sé qué MCPs requieren key/configuración?
- [ ] ¿Sé qué skills están disponibles?
- [ ] ¿Sé qué skills de batalla puedo usar?

### Fase 3 — Entorno

- [ ] ¿Verifiqué encoding de terminal? (`chcp 65001` + `[Console]::OutputEncoding`)
- [ ] ¿Estoy dentro del filesystem permitido?
- [ ] ¿Mi tarea está en zona de escritura autorizada?

### Fase 4 — Autorización

- [ ] ¿Tengo autorización para credenciales? (Si la tarea las requiere)
- [ ] ¿Estoy tocando producción? (Si sí → DETENER y pedir autorización)
- [ ] ¿Hay ADR si el cambio afecta persistencia?

### Fase 5 — Verificación

- [ ] ¿Ejecuté verificación segura (no destructiva)?
- [ ] ¿Los tests pasan? (Si hubo cambios funcionales)
- [ ] ¿El typecheck está limpio? (Si hubo cambios de código)
- [ ] ¿No hay secretos en el diff?

### Fase 6 — Documentación

- [ ] ¿Documenté la decisión o hallazgo?
- [ ] ¿Actualicé `estado-actual.md` si la fase lo requiere?
- [ ] ¿Registré aprendizaje en memoria?

### Fase 7 — Salida

- [ ] ¿Git status está limpio o con residuales justificados?
- [ ] ¿Recomendé siguiente paso controlado?

---

## CHECKLIST PRE-PUSH

Solo si se autorizó push explícitamente:

- [ ] Tests pasan.
- [ ] Typecheck limpio.
- [ ] No secrets en diff.
- [ ] No `.env` en staging.
- [ ] Commit message sigue convención.

---

## CHECKLIST PRE-MCP

Antes de activar cualquier MCP:

- [ ] ¿El MCP está en Equipment Registry?
- [ ] ¿Leí el runbook de activación?
- [ ] ¿La verificación es segura (no producción, no destructiva)?
- [ ] ¿Las keys están en variables de entorno (no en el código)?
- [ ] ¿No voy a exponer secretos?

---

## CHECKLIST PRE-n8n

Antes de usar n8n:

- [ ] ¿n8n MCP está activo o documentado con causa exacta?
- [ ] ¿n8n official skills están instaladas/sincronizadas?
- [ ] ¿Se verificó Docker?
- [ ] ¿Se evitó producción?
- [ ] ¿Se protegieron credenciales?
- [ ] ¿El workflow fue auditado antes de ejecución?

---

## SEÑALES DE ALERTA (DETENER INMEDIATAMENTE)

Detener y escalar si:

1. La tarea requiere tocar producción.
2. La tarea requiere credenciales no configuradas.
3. La tarea requiere modificar `institutional/`.
4. La tarea requiere SQL destructivo.
5. La tarea requiere enviar emails, mensajes o cobros reales.
6. Se detectan secretos en el diff o en logs.
7. La tarea requiere mover carpetas o renombrar paquetes.
8. La tarea excede el alcance autorizado.

---

_Fin del Battlefield Readiness Checklist v1.0.0_
