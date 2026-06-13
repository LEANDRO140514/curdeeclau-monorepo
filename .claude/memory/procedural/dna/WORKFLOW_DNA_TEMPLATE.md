# WORKFLOW DNA TEMPLATE

> Tipo: procedural/dna/template
> Version: 1.0.0
> Proposito: Plantilla para declarar el ADN de un workflow en CURDEECLAU.

---

## 1. NOMBRE DEL WORKFLOW

Nombre oficial. Debe describir la accion que ejecuta.

---

## 2. ESTADO INSTITUCIONAL

- [ ] Proposed
- [ ] Active
- [ ] Canonical
- [ ] Superseded
- [ ] Deprecated

---

## 3. PROPOSITO

Que problema resuelve este workflow. En que contexto se dispara.

---

## 4. TRIGGER

Que inicia este workflow:

- [ ] Evento del sistema (DomainEvent)
- [ ] Mensaje de usuario
- [ ] Accion programada (cron / scheduler)
- [ ] Llamada API externa (webhook)
- [ ] Otro:

Trigger especifico: (nombre del evento, comando, o condicion)

---

## 5. ENTRADAS

| Entrada | Tipo | Origen | Requerida? |
|---------|------|--------|------------|
| entrada-ejemplo | string / object / event | Engine / Usuario / API | Si / No |

---

## 6. SALIDAS

| Salida | Tipo | Destino | Evento emitido |
|--------|------|---------|----------------|
| salida-ejemplo | string / object / event | Engine / Usuario / API | DomainEvent |

---

## 7. PASOS

Orden secuencial de ejecucion:

| Paso | Engine/Provider | Accion | Condicion de avance | Error handling |
|------|-----------------|--------|---------------------|----------------|
| 1 | motor-ejemplo | Accion | Condicion | Que hacer si falla |
| 2 | motor-ejemplo | Accion | Condicion | Que hacer si falla |

---

## 8. ENGINES USADOS

| Engine | Proposito en este workflow | Metodo invocado |
|--------|---------------------------|-----------------|
| engine-ejemplo | Que hace | execute() / otro |

---

## 9. PROVIDERS USADOS

| Provider | Proposito en este workflow |
|----------|---------------------------|
| provider-ejemplo | Que servicio externo se usa |

---

## 10. EVENTOS EMITIDOS / CONSUMIDOS

### Emitidos durante el workflow

| Evento | Paso | Payload |
|--------|------|---------|
| evento-ejemplo | N | Datos |

### Consumidos para iniciar o continuar

| Evento | Origen | Accion |
|--------|--------|--------|
| evento-ejemplo | Engine X | Inicia el workflow / Avanza al paso N |

---

## 11. ESTADOS

| Estado | Descripcion | Transiciones permitidas |
|--------|-------------|------------------------|
| estado-inicial | Descripcion | -> estado-siguiente |
| estado-intermedio | Descripcion | -> estado-final, -> estado-error |
| estado-final | Descripcion | (terminal) |
| estado-error | Descripcion | -> estado-inicial (retry), -> estado-final (abort) |

---

## 12. ERRORES ESPERADOS

| Error | Causa probable | Accion |
|-------|---------------|--------|
| Error ejemplo | Provider no disponible | Retry 3x, luego fallback |

---

## 13. FALLBACKS

Que hace el workflow si no puede completarse normalmente:

1. Escenario A: (ej: "Provider no disponible") -> Accion
2. Escenario B: (ej: "Timeout en paso N") -> Accion

---

## 14. EVIDENCIA DE EJECUCION

- [ ] Blueprint documentado (JSON o codigo)
- [ ] Tests de ejecucion
- [ ] Traza de ejecucion en produccion
- [ ] Registro de fallbacks ejecutados

---

## 15. RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Riesgo ejemplo | Baja / Media / Alta | Bajo / Medio / Alto | Accion |

---

## 16. PROXIMO PASO AUTORIZADO

(Describir o indicar "Ninguno — el workflow esta en operacion normal.")

---

*Fin del Workflow DNA Template v1.0.0*
