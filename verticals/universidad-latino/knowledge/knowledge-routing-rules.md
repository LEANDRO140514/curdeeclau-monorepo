# Knowledge Routing Rules — Universidad Latino

> Tipo: vertical/knowledge
> Version: 1.0.0
> Creado: 2026-06-14
> Fase: UV-KB-1

---

## Arquitectura de conocimiento (3 capas)

```
CAPA 1: TABLA (oferta-academica.md)
  Info especifica por carrera: costos, duracion, RVOE, campo laboral
  USO: Preguntas directas sobre UNA carrera especifica

CAPA 2: FAQs INFORMATIVAS (faq.md + requisitos-admision.md + costos-becas.md + contacto-campus.md)
  Procesos, politicas, requisitos, metodos de pago
  USO: Preguntas sobre "como" y "que necesito"

CAPA 3: FAQs CONVERSACIONALES (faq-conversacional.md)
  Manejo de ambiguedad, objeciones, indecision, escalamiento, frustracion
  USO: Conversaciones no estructuradas, mensajes vagos, cierres
```

---

## Reglas de enrutamiento

### Regla 1 — Pregunta especifica de carrera → Tabla / Oferta Academica

**Ejemplos:**
- "Cuanto cuesta Derecho?" → `oferta-academica.md`
- "Que RVOE tiene Psicologia?" → `oferta-academica.md`
- "Cuanto dura Ingenieria en Sistemas?" → `oferta-academica.md`
- "Donde se imparte Enfermeria?" → `oferta-academica.md`

**Fuente:** `oferta-academica.md`, `costos-becas.md`

### Regla 2 — Pregunta de proceso o politica → FAQs Informativas

**Ejemplos:**
- "Como me inscribo?" → `faq.md` / `requisitos-admision.md`
- "Que documentos necesito?" → `requisitos-admision.md`
- "Como funcionan las clases en linea?" → `faq.md`
- "Puedo pagar en mensualidades?" → `costos-becas.md`
- "Donde estan ubicados?" → `contacto-campus.md`

**Fuente:** `faq.md`, `requisitos-admision.md`, `costos-becas.md`, `contacto-campus.md`

### Regla 3 — Mensaje vago, objecion, indecision o frustracion → FAQs Conversacionales

**Ejemplos:**
- "Info" → Categoria 2 (Mensajes vagos)
- "No se que estudiar" → Categoria 1 (Indecision vocacional)
- "Esta muy caro" → Categoria 4 (Objeciones)
- "Quiero hablar con alguien" → Categoria 6 (Escalamiento)

**Fuente:** `faq-conversacional.md`

### Regla 4 — Informacion faltante o duda → NO inventar, escalar a asesor

Si la respuesta no esta en ninguna de las 3 capas de conocimiento:
- Responder con honestidad: "Un asesor de admisiones te proporcionara esa informacion con gusto."
- NUNCA inventar costos, fechas, becas, requisitos o RVOE.
- Si el prospecto insiste, ofrecer transferir a un asesor humano.

### Regla 5 — Costos, fechas o promociones sensibles → Cautela

- Siempre mencionar que los costos y promociones pueden variar.
- Recomendar confirmar con un asesor para informacion actualizada.
- Usar la frase: "Te recomiendo confirmar los detalles con un asesor de admisiones."

---

## Prioridad de fuentes

Si hay conflicto entre fuentes:

1. **CSV optimizado** tiene prioridad sobre texto enriquecido (es la base estructurada final).
2. **FAQs PDF** tiene prioridad sobre conocimiento previo de UV-0.
3. Si hay contradiccion entre fuentes reales → NO resolver. Marcar como "Pendiente de validacion humana".
4. Los costos del CSV y texto enriquecido son la fuente autorizada para datos tabulares.

---

## Pendiente de validacion humana

Las siguientes areas requieren confirmacion del cliente antes de usar en produccion:

1. **Vigencia de costos:** Los montos de mensualidad e inscripcion corresponden al ciclo 2026. Verificar si siguen vigentes.
2. **Beca deportiva:** Estado "en proceso de implementacion". Confirmar disponibilidad actual.
3. **Beca por convenio:** Sin listado de empresas/organizaciones con convenio.
4. **Bolsa de trabajo OCC:** No operativa por falta de personal. Confirmar estado actual.
5. **Carreras:** El cliente menciona 12 licenciaturas. Verificar si hay carreras nuevas no incluidas en las fuentes.
6. **Maestrias:** Se mencionan 2 maestrias (Nutricion y Educacion) pero sin detalles en las fuentes.
7. **Fechas de inicio:** 1 de septiembre de 2026. Verificar para ciclos posteriores.
8. **Test vocacional EVA:** Mencionado en FAQs conversacionales. Confirmar disponibilidad y formato.
9. **Cambridge English:** Monto $7,600. Verificar vigencia del descuento.
10. **Campos clinicos:** Montos $2,300-$3,000. Verificar vigencia.

---

*Fin de Knowledge Routing Rules v1.0.0*
