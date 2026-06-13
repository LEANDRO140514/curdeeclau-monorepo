# APP DNA TEMPLATE

> Tipo: procedural/dna/template
> Version: 1.0.0
> Proposito: Plantilla para declarar el ADN de una app, producto o vertical en CURDEECLAU.

---

## 1. NOMBRE DE LA APP / PRODUCTO / VERTICAL

Nombre oficial. Debe coincidir con el directorio en `apps/` o `verticals/`.

---

## 2. ESTADO INSTITUCIONAL

- [ ] Proposed — En diseno, sin implementacion.
- [ ] Active — En desarrollo o produccion.
- [ ] Canonical — Active + validado + estable.
- [ ] Superseded — Reemplazado.
- [ ] Deprecated — Sin mantenimiento.
- [ ] Archived — Preservado historicamente.

---

## 3. TIPO

- [ ] App — Aplicacion desplegable con UI y/o backend.
- [ ] Producto — App + modelo de negocio + usuarios reales.
- [ ] Vertical — Configuracion de dominio con conocimiento, politicas, workflows.
- [ ] Demo — Prueba de concepto, no produccion.
- [ ] Legacy — Heredado, en proceso de migracion o archival.
- [ ] Archivo — Preservado historicamente, sin operacion activa.

---

## 4. PROPOSITO DE NEGOCIO

Que problema de negocio resuelve. Para quien. Por que existe.

---

## 5. USUARIO OBJETIVO

Quien usa este producto:

- Tipo de usuario: (paciente, medico, apostador, administrador, etc.)
- Canal de interaccion: (Web, Telegram, WhatsApp, API)
- Volumen esperado: (Bajo / Medio / Alto)

---

## 6. PROBLEMA QUE RESUELVE

Descripcion del problema desde la perspectiva del usuario.

---

## 7. DEPENDENCIAS DE PACKAGES / ENGINES / PROVIDERS

| Dependencia | Tipo | Version | Estado |
|-------------|------|---------|--------|
| `@curdeeclau/ejemplo` | Engine / Provider / Shared | 0.1.0 | En uso / Planeado |

---

## 8. DATOS QUE MANEJA

| Tipo de dato | Sensibilidad | Almacenamiento | Retencion |
|--------------|-------------|----------------|-----------|
| dato-ejemplo | Bajo / Medio / Alto / Critico | Supabase / Pinecone / Local | Periodo |

---

## 9. INTEGRACIONES

| Integracion | Proposito | Estado |
|-------------|-----------|--------|
| integracion-ejemplo | Que conecta | Activa / Planeada / Candidata |

---

## 10. WORKFLOWS USADOS

| Workflow | Proposito | Estado |
|----------|-----------|--------|
| workflow-ejemplo | Que flujo implementa | Activo / Planeado |

---

## 11. PATTERNS USADOS

- [ ] Provider Pattern
- [ ] Event Pattern
- [ ] Engine Pattern
- [ ] Ownership Pattern
- [ ] Config Pattern
- [ ] App/Vertical Pattern
- [ ] Otro:

---

## 12. RELACION CON PEKIN

- Principios que implementa: (ej: Principio III — Identidad antes que Existencia)
- Nivel en jerarquia: Nivel 7 — Productos y Verticales
- DNA registrado en: `institutional/dna/` (si aplica)

---

## 13. RELACION CON LEGOLAND

- Es un lego reutilizable? No (las apps son productos finales, no legos reutilizables)
- Consume legos de Legoland? Si / No. Cuales.
- Duplicacion detectada: Ninguna / Con X

---

## 14. CRITERIOS DE EXITO

Que debe ser verdad para considerar este producto exitoso:

1. Criterio 1 (ej: "X usuarios activos en 3 meses")
2. Criterio 2 (ej: "Tasa de retencion > Y%")

---

## 15. ESTADO OPERATIVO

- [ ] En desarrollo — No en produccion.
- [ ] En staging — Pruebas pre-produccion.
- [ ] En produccion — Usuarios reales.
- [ ] En mantenimiento — Sin desarrollo activo.
- [ ] Detenido — Operacion pausada.
- [ ] Retirado — Fuera de servicio.

---

## 16. RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Riesgo ejemplo | Baja / Media / Alta | Bajo / Medio / Alto | Accion |

---

## 17. PROXIMO PASO AUTORIZADO

(Describir o indicar "Ninguno — el producto esta en operacion normal.")

---

*Fin del App DNA Template v1.0.0*
