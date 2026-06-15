# Knowledge Base — Universidad Latino

> Tipo: vertical/knowledge
> Version: 2.0.0 — Datos reales del cliente
> Creado: 2026-06-14
> Fase: UV-KB-1

---

## Indice de archivos

| Archivo | Contenido | Fuente | Estado |
|---------|-----------|--------|--------|
| `oferta-academica.md` | 12 carreras con costos, RVOE, duracion, campo laboral | CSV + Texto enriquecido | CONFIRMADO |
| `faq.md` | ~45 FAQs informativas en 11 categorias | FAQs PDF | CONFIRMADO |
| `faq-conversacional.md` | 16 FAQs conversacionales en 8 categorias | FAQs_Conversacionales_GHL PDF | CONFIRMADO |
| `costos-becas.md` | Colegiaturas, formas de pago, becas 30-40-50% | FAQs PDF + CSV | CONFIRMADO* |
| `requisitos-admision.md` | Documentos, proceso, fechas, admision en linea | FAQs PDF | CONFIRMADO |
| `contacto-campus.md` | Direccion, telefonos, email, web, horarios, instalaciones | FAQs PDF | CONFIRMADO |
| `knowledge-routing-rules.md` | Reglas de enrutamiento de conocimiento para el asistente | UV-KB-1 | ACTIVO |
| `sources/README.md` | Referencia a archivos fuente originales | UV-KB-1 | REFERENCIA |

---

## Como debe usarlos el asistente

Ver `knowledge-routing-rules.md` para las reglas completas. En resumen:

1. **Pregunta especifica de carrera →** `oferta-academica.md`
2. **Pregunta de proceso/politica →** `faq.md`, `requisitos-admision.md`, `costos-becas.md`
3. **Mensaje vago/objecion →** `faq-conversacional.md`
4. **Sin respuesta en ninguna capa →** NO inventar. Escalar a asesor.

---

## Informacion confirmada

- 12 carreras con costos, duracion, modalidades, RVOE
- Proceso de admision (5 pasos, sin examen)
- Documentacion requerida
- Becas academicas (30%, 40%, 50% segun promedio)
- Formas de pago
- Modalidades (presencial, en linea Ma-Ju 20-22hrs, sabatina Sab 8-13hrs)
- Direccion, contacto, horarios de atencion
- Mision, vision, valores
- Servicios incluidos en colegiatura

---

## Informacion que requiere validacion humana

Ver `knowledge-routing-rules.md` seccion "Pendiente de validacion humana" para la lista completa (10 items). Los mas criticos:

1. Vigencia de costos (ciclo 2026)
2. Beca deportiva (estado real)
3. Bolsa de trabajo OCC (operativa?)
4. Maestrias (sin detalles en fuentes)
5. Test vocacional EVA (disponible?)

---

## Fecha de actualizacion

2026-06-14 — UV-KB-1. Primera integracion de conocimiento real del cliente.

---

*Fin del Knowledge Base README v2.0.0*
