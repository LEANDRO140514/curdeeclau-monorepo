# PROVIDER DNA TEMPLATE

> Tipo: procedural/dna/template
> Version: 1.0.0
> Proposito: Plantilla para declarar el ADN de un provider (adapter de servicio externo) en CURDEECLAU.

---

## 1. NOMBRE DEL PROVIDER

Nombre oficial del provider. Debe coincidir con el package o modulo.

---

## 2. CANAL / PLATAFORMA EXTERNA RELACIONADA

Que servicio externo adapta este provider. Ej: Telegram Bot API, GHL API v2, Google Calendar API.

---

## 3. ESTADO INSTITUCIONAL

Segun Governance Level 2, Seccion 5:

- [ ] Proposed
- [ ] Active
- [ ] Canonical
- [ ] Superseded
- [ ] Naturalized
- [ ] Allied
- [ ] Deprecated

---

## 4. PROPOSITO

Que problema resuelve este provider. Por que CURDEECLAU necesita este adaptador en lugar de llamar al servicio externo directamente.

---

## 5. RESPONSABILIDAD PRINCIPAL

La funcion central. Una oracion.

---

## 6. RESPONSABILIDADES EXPLICITAMENTE EXCLUIDAS

Lo que este provider NO hace:

1. No hace X.
2. No debe usarse para Y.

---

## 7. DATOS QUE RECIBE

| Dato | Origen | Sensibilidad | Formato |
|------|--------|-------------|---------|
| dato-ejemplo | Servicio externo / Engine | Bajo / Medio / Alto / Critico | JSON / Texto / Binario |

---

## 8. DATOS QUE EMITE

| Dato | Destino | Sensibilidad | Evento asociado |
|------|---------|-------------|-----------------|
| dato-ejemplo | Engine / Orchestrator | Bajo / Medio / Alto | DomainEvent asociado |

---

## 9. EVENTOS RELACIONADOS

| Evento | Direccion | Proposito |
|--------|-----------|-----------|
| evento-ejemplo | Emite / Consume | Que signal representa |

---

## 10. ADAPTER O CLIENT USADO

| Componente | Ubicacion | Tipo |
|------------|-----------|------|
| adapter-ejemplo | `packages/providers/xyz/src/adapter.ts` | Wrapper / SDK directo / HTTP Client |

---

## 11. RIESGOS DE DEPENDENCIA EXTERNA

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Proveedor desaparece | Baja / Media / Alta | Bajo / Medio / Alto | Plan de contingencia |
| Cambio de API | Baja / Media / Alta | Bajo / Medio / Alto | Abstraccion detras de interfaz |
| Cambio de pricing | Baja / Media / Alta | Bajo / Medio / Alto | Alternativa documentada |

---

## 12. SEGURIDAD Y CREDENCIALES

| Tipo de credencial | Almacenamiento | Rotacion |
|--------------------|---------------|----------|
| API Key / Token / OAuth | Variable de entorno / Secrets manager | Periodicidad |

Reglas adicionales:

1. No exponer credenciales en logs.
2. No commitear credenciales.
3. Regla especifica del provider.

---

## 13. FALLBACK / CONTINGENCIA

Si el proveedor externo falla:

- Comportamiento esperado del adapter: (retry, circuito abierto, fallback a InMemory, etc.)
- Tiempo maximo de recuperacion aceptable:
- Procedimiento de recuperacion documentado en: (runbook o seccion)

---

## 14. TESTS O EVIDENCIA

| Tipo | Cantidad | Estado |
|------|----------|--------|
| Tests unitarios (con mock del servicio externo) | N | Pasan / Fallan / No existen |
| Tests con InMemory provider | N | Pasan / Fallan / No existen |
| Tests de integracion (contra servicio real) | N | Pasan / Fallan / No existen |

---

## 15. RELACION CON NATURALIZATION FRAMEWORK

- Ficha de naturalizacion: Existe / Pendiente / No aplica
- Ubicacion: `procedural/naturalizacion/proveedor.md`
- Estado de naturalizacion: Naturalized / Allied / Referenced

---

## 16. RELACION CON LEGOLAND

- Tipo en Legoland: Provider
- Nivel de reutilizacion: Alto / Medio / Bajo
- Certificacion: Certificado / Pendiente

---

## 17. COMO REEMPLAZARLO

Instrucciones para cambiar este provider por otro servicio equivalente:

1. Identificar servicio alternativo.
2. Implementar adapter que cumpla la misma interfaz.
3. Verificar que los tests pasan con el nuevo adapter.
4. Actualizar esta ficha DNA.
5. Archivar o superseder el adapter anterior.

---

## 18. PROXIMO PASO AUTORIZADO

(Describir o indicar "Ninguno — el provider esta en operacion normal.")

---

*Fin del Provider DNA Template v1.0.0*
