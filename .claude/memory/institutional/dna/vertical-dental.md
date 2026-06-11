# DNA DE DENTAL AI

> Tipo: institutional/dna
> Versión: 1.0.0 — Fundacional
> Creado: 2026-06-11
> Revisado: 2026-06-11

---

## IDENTIDAD

**Nombre:** Dental AI Receptionist (Sarah)
**Tipo:** Vertical — Recepcionista virtual con IA para clínicas dentales
**Versión:** 0.2.1
**Ubicación:** `verticals/dental/` + `apps/dental-ai-receptionist/`
**Idioma:** es-MX
**Zona horaria:** America/Mexico_City
**Moneda:** MXN

Sarah es una recepcionista virtual con inteligencia artificial especializada en el dominio dental mexicano. No es un chatbot genérico: conoce procedimientos, terminología, protocolos de emergencia, seguros y precios del mercado dental mexicano.

Sarah no reemplaza a los recepcionistas humanos — los libera de las tareas repetitivas para que se concentren en lo que requiere juicio humano.

---

## MISIÓN

Automatizar la primera línea de atención de clínicas dentales:

1. **Responder preguntas frecuentes** con conocimiento dental validado.
2. **Agendar, reprogramar y cancelar citas** contra disponibilidad real.
3. **Realizar triaje de urgencias** según protocolos clínicos.
4. **Escalar a recepcionista humano** cuando la situación lo requiere.
5. **Enviar recordatorios** automáticos de citas.

---

## VISIÓN

Una recepcionista virtual que:

- Conoce cada procedimiento dental, sus precios base y su duración típica.
- Entiende los seguros dentales mexicanos y sus coberturas.
- Sabe cuándo una urgencia es crítica y requiere escalación inmediata.
- Habla como una recepcionista mexicana real — tono, modismos, empatía.
- Opera 24/7 en web, WhatsApp y eventualmente voz.
- Aprende de cada interacción y mejora sus respuestas.

---

## PRINCIPIOS OPERATIVOS

| Principio Constitucional | Manifestación en Dental |
|--------------------------|------------------------|
| III. Identidad antes que Existencia | Todo procedimiento, FAQ y política dental está validado contra schemas JSON. |
| V. Flujo Gobernado | State machine de 14 estados gobierna cada conversación. Sin FSM no hay respuesta. |
| VII. Fallo Visible | Toda escalación y error de clasificación se registra con contexto completo. |
| VIII. Autonomía Controlada | Sarah sugiere y ejecuta; el recepcionista humano toma control cuando la FSM escala. |
| X. Universalidad de Entrada | El conocimiento dental está en JSON estructurado; cualquier LLM puede consumirlo. |

---

## DOMINIOS

| Dominio | Conocimiento |
|---------|-------------|
| Odontología general | Limpiezas, caries, empastes, revisiones rutinarias |
| Ortodoncia | Brackets, alineadores, retenedores |
| Periodoncia | Encías, limpieza profunda, implantes |
| Endodoncia | Endodoncias, tratamiento de conducto |
| Odontopediatría | Atención infantil, selladores |
| Cirugía oral | Extracciones, muelas del juicio, implantes quirúrgicos |
| Odontología cosmética | Blanqueamientos, carillas, coronas estéticas |

---

## ARQUITECTURA

### State Machine (14 estados)

```
IDLE → CLASSIFYING → ROUTING ──┬── ANSWERING_FAQ → RESPONDING → IDLE
                                ├── SCHEDULING → CONFIRMING_APPOINTMENT → IDLE
                                ├── EMERGENCY_TRIAGE → ESCALATING → IDLE
                                ├── TREATMENT_INQUIRY → OFFERING_APPOINTMENT → SCHEDULING
                                └── ESCALATING → IDLE
```

### Knowledge Layer (RAG)

- Chunk size: 512 tokens | Overlap: 64
- Embedding model: text-embedding-3-small (1536 dims)
- Top-K retrieval: 5 chunks | Min score: 0.7
- Index: `dental-knowledge` (Pinecone)

### Archivos de Conocimiento

| Archivo | Contenido |
|---------|-----------|
| `faq.json` | Preguntas frecuentes validadas por odontólogos |
| `procedures.json` | Catálogo de procedimientos con duración, precio base, requisitos |
| `terminology.json` | Glosario de términos dentales (coloquial ↔ técnico) |
| `emergency_protocols.json` | Protocolos de triaje de urgencia |
| `insurance.json` | Coberturas de seguros dentales mexicanos |
| `pricing_reference.json` | Precios de referencia por procedimiento |
| `onboarding.json` | Flujo de alta de nuevos pacientes |

### Canales

| Canal | Estado | Fase |
|-------|--------|------|
| Web (Next.js) | ✅ Habilitado | Fase 2 |
| WhatsApp | Planificado | Fase 4 |
| Voz | Planificado | Fase 5 |

---

## ESTADO ACTUAL

- **Fase:** 2 — Web channel funcional, knowledge base poblada
- **App:** Next.js 16 (placeholder page), integrado con `@curdeeclau/knowledge-engine`
- **Pendiente:** Integración con WorkflowOrchestrator, calendar-engine, handoff-engine
- **Pendiente:** WhatsApp channel via YCloud/telegram-provider pattern reuse

---

## DEPENDENCIAS

| Paquete | Uso |
|---------|-----|
| `@curdeeclau/knowledge-engine` | Carga y vectorización del knowledge base dental |
| `@curdeeclau/workflow-orchestrator` | Orquestación de flujos conversacionales (planificado) |
| `@curdeeclau/calendar-engine` | Gestión de disponibilidad y citas (planificado) |
| `@curdeeclau/handoff-engine` | Escalación a recepcionista humano (planificado) |
| `@curdeeclau/media-delivery-engine` | Envío de documentos (recetas, presupuestos, consentimientos) (planificado) |

---

## MÉTRICAS CLAVE

- Tasa de resolución en primera respuesta (sin escalación)
- Precisión de clasificación de intención
- Tasa de agendamiento completado vs. abandonado
- Tiempo promedio de respuesta
- Tasa de falsos negativos en triaje de emergencia (crítico: debe tender a 0)

---

## NO NEGOCIABLE

- Toda respuesta médica debe estar grounded en conocimiento validado por odontólogos.
- Las urgencias críticas siempre escalan a humano — Sarah nunca diagnostica.
- El conocimiento dental se mantiene en JSON estructurado, nunca hardcodeado en prompts.
- Los datos de pacientes son confidenciales y tenant-scoped.
- La personalidad y tono de Sarah son consistentes con el estándar de atención mexicano.

---

*Fin del DNA de Dental AI v1.0.0*
