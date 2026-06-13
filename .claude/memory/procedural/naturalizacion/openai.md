# OPENAI — NATURALIZATION FILE

> Tipo: procedural/naturalizacion
> Version: 1.0.0 — Candidato
> Creado: 2026-06-13

---

## 1. NOMBRE DEL ACTIVO

OpenAI — Proveedor de modelos de lenguaje, embeddings, y razonamiento.

---

## 2. TIPO DE ACTIVO

External AI Provider

---

## 3. ESTADO INSTITUCIONAL

Allied (candidate for Naturalization)

---

## 4. RELACION CON CURDEECLAU

- [ ] Nativo
- [ ] Naturalizado (candidato — se usa, pero el adapter no esta completamente aislado)
- [x] Aliado — Se utiliza. El adapter existe parcialmente.
- [ ] Referenciado
- [ ] Archivado

---

## 5. PROPOSITO

OpenAI provee capacidad de razonamiento, generacion de texto, y embeddings para CURDEECLAU. Es el motor cognitivo detras de agentes conversacionales, RAG, y extraccion de conocimiento.

**Principio que encarna:** OpenAI implementa el concepto de "modelo de lenguaje como servicio". Pekin extrae el principio de "LLM provider agnostico" — el sistema debe poder cambiar de modelo (OpenAI, DeepSeek, Claude, modelo local) sin reescribir la logica de negocio.

**Si no existiera:** Se usaria otro proveedor (DeepSeek, Anthropic, modelo open source). El principio de separacion provider-agnostico exige que el cambio sea posible sin reescribir engines.

---

## 6. CAPACIDADES PRINCIPALES

1. Chat Completion (GPT-4, GPT-4o, etc.) — Estado: En uso (via `llm/` en algorithmus-core-engine)
2. Embeddings (text-embedding-3-small/large) — Estado: En uso (knowledge-engine, semantic-memory)
3. Function Calling — Estado: Planeado / Candidato
4. Vision (GPT-4o) — Estado: Candidato
5. Text-to-Speech — Estado: Candidato
6. Whisper (Speech-to-Text) — Estado: Candidato

---

## 7. CAPACIDADES NO ASUMIDAS

- DALL-E (generacion de imagenes) — no utilizado
- GPTs / Custom GPTs — no utilizado
- Assistants API — no utilizado
- Batch API — no utilizado
- Fine-tuning API — no utilizado

---

## 8. DATOS QUE MANEJA

| Tipo de dato | Sensibilidad | Almacenado en CURDEECLAU? | Enviado a OpenAI? |
|--------------|-------------|---------------------------|--------------------|
| Mensajes de usuarios | Alto | Si | Si (para generar respuestas) |
| Embeddings de conocimiento | Medio | Si | Si (para generarlos) |
| Datos de entrenamiento | N/A | N/A | No (no se hace fine-tuning) |
| Credenciales, secrets | Critico | No | No |

---

## 9. RIESGOS

### 9.1 Riesgo de desaparicion

- Que se pierde: Acceso a modelos GPT. Capacidad de razonamiento y generacion.
- Como se reemplaza: DeepSeek, Anthropic Claude, modelo open source (Llama, Mistral). El provider es intercambiable si el adapter esta bien disenado.
- Tiempo estimado de migracion: 1-2 semanas para adapter de modelo alternativo.

### 9.2 Riesgo de cambio de pricing/API

- Estabilidad historica: Moderada. OpenAI cambia APIs con cierta frecuencia.
- Frecuencia de breaking changes: Media (anuales o semestrales)
- Costo actual: No documentado en el repo
- Sensibilidad al costo: Alta. Los costos de API escalan con el uso conversacional.

### 9.3 Riesgo de seguridad

- Datos sensibles: Mensajes de usuarios enviados a OpenAI para procesamiento
- Cumplimiento: OpenAI ofrece cumplimiento SOC 2, GDPR. Verificar que los datos no se usan para entrenamiento (opt-out).
- Historial de incidentes: Bajo-Medio. OpenAI ha tenido incidentes de exposicion de datos.

### 9.4 Riesgo de acoplamiento

- Nivel: Medio
- Justificacion: El codigo en `algorithmus-core-engine` referencia OpenAI directamente en partes del pipeline LLM. No hay una abstraccion completa de provider de LLM como la hay para CRM o Calendar. Esto eleva el riesgo de acoplamiento.

---

## 10. DEPENDENCIAS

**Modulos CURDEECLAU que dependen de OpenAI:**
- `algorithmus-core-engine` — LLM gateway, razonamiento conversacional
- `knowledge-engine` — generacion de embeddings
- `semantic-memory` — extraccion de hechos via LLM

**Dependencias externas:**
- OpenAI API (https://api.openai.com)
- OpenAI SDK (`openai` npm package)

---

## 11. PATTERNS RELACIONADOS

- [x] Provider Pattern — Deberia implementarlo. Actualmente parcial.
- [ ] Event Pattern (no directamente)
- [ ] Engine Pattern (no directamente)
- [ ] Ownership Pattern (no directamente)

---

## 12. MODULOS RELACIONADOS

| Modulo | Tipo de relacion | Estado |
|--------|-----------------|--------|
| `algorithmus-core-engine` | Consumidor principal (LLM Gateway) | En uso |
| `knowledge-engine` | Consumidor (embeddings) | En uso |
| `semantic-memory` | Consumidor (fact extraction) | En uso |

---

## 13. PRODUCTOS / VERTICALES QUE PODRIAN USARLO

| Producto/Vertical | Estado de uso |
|-------------------|---------------|
| Dental AI (Sarah) | En uso (razonamiento conversacional) |
| AdmissionFlow | Candidato |

---

## 14. REGLAS DE USO

1. Toda llamada a OpenAI debe pasar por el LLM Gateway, no por SDK directo desde engines.
2. Los prompts deben ser versionados y revisados (no prompts arbitrarios en codigo).
3. No enviar datos sensibles innecesarios en los prompts.
4. Registrar uso de tokens para monitoreo de costos.

---

## 15. REGLAS DE SEGURIDAD

1. OpenAI API key en variable de entorno, nunca en codigo.
2. No loguear respuestas completas que puedan contener datos de usuarios.
3. Verificar que OpenAI no usa datos de CURDEECLAU para entrenamiento (opt-out configurado).
4. Rate limiting en el lado de CURDEECLAU para prevenir costos descontrolados.

---

## 16. EVIDENCIA ACTUAL

- [x] Ficha de naturalizacion: Completa
- [x] Adapter en `packages/`: Existe parcialmente (`algorithmus-core-engine/src/core/llm/`, `src/infra/providers/openai/`)
- [ ] Implementacion InMemory/Fake: No existe (dificil para LLM, pero posible con mock)
- [ ] Tests sin conexion al proveedor: No verificados
- [x] Principio extraido documentado: Si (LLM provider agnostico)
- [ ] Plan de contingencia: Parcial (cambiar de proveedor es posible, pero requiere trabajo en el adapter)

---

## 17. ESTADO DE IMPLEMENTACION

- [ ] No iniciado
- [ ] En progreso
- [x] Funcional (requiere proveedor)
- [ ] Funcional (mock para desarrollo)
- [ ] Completo y verificado

---

## 18. DECISION

Mantener como **Aliado** por ahora. OpenAI se usa activamente, pero:

- El adapter no esta completamente aislado (no hay interfaz `LLMProvider` como si la hay `CRMProvider`)
- No hay plan de contingencia verificado con un proveedor alternativo concreto
- El acoplamiento es medio (el SDK de OpenAI se referencia en multiple puntos)

Para proceder a Naturalizado se requiere:
1. Definir interfaz `LLMProvider` en `shared/` o en el engine correspondiente
2. Envolver OpenAI detras de esa interfaz
3. Implementar un segundo provider (DeepSeek o Anthropic) como prueba de intercambiabilidad

---

## 19. PROXIMO PASO AUTORIZADO

Ninguno. La naturalizacion completa requiere trabajo de ingenieria (definir `LLMProvider` interface). Diferir hasta que el Senado priorice la extraccion del provider de LLM.

---

*Fin de la ficha OpenAI v1.0.0*
