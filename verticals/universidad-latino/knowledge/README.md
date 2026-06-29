# Conocimiento — Universidad Latino

> Tipo: vertical/knowledge
> Versión: 2.1.0 — Patrón de admisión de conocimiento
> Actualizado: 2026-06-25

---

## Modelo de conocimiento

Cada vertical debe tener exactamente **1 CSV + 4 MD**:

| Archivo | Tipo | Contenido |
|---------|------|-----------|
| `catalogo-carreras.csv` | Tabla estructurada | Carreras, costos, duración, modalidades, RVOE, CTAs, becas |
| `comportamiento-agente.md` | Personalidad | Tono, reglas, objetivo, precisión de carreras, transferencia |
| `oferta-academica.md` | Texto enriquecido | Descripciones detalladas por carrera con CTAs |
| `faq-conversacional.md` | FAQs conversacionales | Indecisión, mensajes vagos, objeciones, escalamiento |
| `faq-informativa.md` | FAQs optimizadas | Admisión, documentos, costos, becas, modalidades |

### Jerarquía de uso

1. **Consulta estructurada** (carrera, costo, modalidad) → `catalogo-carreras.csv`
2. **Descripción rica** (detalle de carrera) → `oferta-academica.md`
3. **Pregunta ambigua** (indecisión, objeciones) → `faq-conversacional.md`
4. **Pregunta de proceso** (inscripción, becas, pagos) → `faq-informativa.md`
5. **Tono y estilo** (cómo responder) → `comportamiento-agente.md`

---

## Patrón de admisión de conocimiento (UV-KB-2)

### Principio

El humano mantiene la información en **CSV** (fácil de versionar, diff amigable, editar en Excel/Sheets).
El sistema la **parsea, transforma e inyecta** en el prompt del LLM de forma eficiente.

```
Humano edita                  Sistema parsea               LLM consume
─────────────                ───────────────              ─────────────
catalogo-carreras.csv  ─→   parseCatalogCSV()    ─→   {{CATALOGO_CARRERAS}}
                            (CSV → markdown table)       (placeholder en system prompt)
```

### Flujo de carga

1. `knowledgeLoader.ts` (módulo canónico en `src/core/admissions/`) lee los 5 archivos
2. `catalogo-carreras.csv` se parsea con `parseCSV()` → `catalogToMarkdown()` → tabla markdown
3. Las FAQs (`faq-informativa.md` + `faq-conversacional.md`) se concatenan
4. `comportamiento-agente.md` se usa como base del system prompt
5. El system prompt incluye 5 placeholders que el engine reemplaza en runtime:

| Placeholder | Fuente | Contenido |
|-------------|--------|-----------|
| `{{CATALOGO_CARRERAS}}` | CSV parseado | Tabla markdown con carreras, costos, duración, modalidades, becas |
| `{{KNOWLEDGE}}` | FAQs concatenadas | FAQs informativas + conversacionales |
| `{{OFERTA_ACADEMICA}}` | oferta-academica.md | Descripciones ricas por carrera |
| `{{COLLECTED_DATA}}` | Runtime | Datos recolectados del prospecto en la conversación |
| `{{NEXT_FIELD}}` | Runtime | Siguiente campo a solicitar |

### Columnas del CSV inyectadas al LLM

De las 16 columnas del CSV, se seleccionan 8 para el prompt (las de mayor utilidad para responder preguntas):

`Carrera | Área académica | Duración | Modalidad | Costo mensual | Costo inscripción | Campus | Becas de Excelencia`

Esto mantiene el prompt eficiente y enfocado en lo que el LLM realmente necesita.

### Generalización

Este patrón está diseñado para replicarse en otros verticales:
- Misma estructura: 1 CSV + 4 MD
- Mismo loader: `knowledgeLoader.ts` adaptable por vertical
- Mismos placeholders: `{{CATALOGO_CARRERAS}}`, `{{KNOWLEDGE}}`, `{{OFERTA_ACADEMICA}}`
- El CSV es la fuente canónica; los MDs enriquecen con texto descriptivo

---

## Fuentes

Los archivos fuente del cliente están en `sources/`.

---

*Fin del README v2.1.0*
