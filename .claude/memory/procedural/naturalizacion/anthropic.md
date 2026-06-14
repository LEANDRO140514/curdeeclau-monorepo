# ANTHROPIC — NATURALIZATION FILE

> Tipo: procedural/naturalizacion
> Version: 1.0.0 — Candidato
> Creado: 2026-06-14
> Autoridad: ADR-LLM-2

---

## 1. NOMBRE DEL ACTIVO

Anthropic — Proveedor de modelos de lenguaje de alta calidad con enfasis en seguridad, razonamiento y alineacion. Ofrece Claude (Opus, Sonnet, Haiku) con API Messages propia (no OpenAI-compatible).

---

## 2. TIPO DE ACTIVO

External AI Provider

---

## 3. ESTADO INSTITUCIONAL

Allied / Naturalized Candidate

---

## 4. RELACION CON CURDEECLAU

- [ ] Nativo
- [ ] Naturalizado (candidato — el adapter existe, pendiente operacion real)
- [x] Aliado — Adapter implementado. Sin verificacion con API real.
- [ ] Referenciado
- [ ] Archivado

---

## 5. PROPOSITO

Anthropic provee capacidad de razonamiento y generacion de texto de maxima calidad, con enfasis en seguridad y alineacion. Para CURDEECLAU, Anthropic es el fallback premium que garantiza la maxima capacidad de razonamiento disponible cuando las tareas lo requieren.

**Principio que encarna:** Anthropic implementa el concepto de "modelo de lenguaje como servicio premium". Pekin extrae el principio de "LLM provider-agnostic de maxima calidad" — el sistema debe poder elegir el modelo mas capaz disponible sin cambiar la logica de negocio.

**Si no existiera:** Se usaria OpenAI como alternativa de alta calidad. Se perderia la opcion de modelos con enfasis en seguridad, alineacion y razonamiento profundo.

---

## 6. CAPACIDADES PRINCIPALES

1. Chat Completion (Claude Sonnet 4.6) — Estado: Candidato (LLM-5)
2. Chat Completion (Claude Opus 4.8) — Estado: Candidato
3. Chat Completion (Claude Haiku 4.5) — Estado: Candidato
4. API Messages (no OpenAI-compatible) — Estado: Utilizado
5. Function Calling / Tool Use — Estado: No implementado
6. Streaming — Estado: No implementado

---

## 7. CAPACIDADES NO ASUMIDAS

- Anthropic no es LLMProvider de CURDEECLAU. Es un adapter detras del contrato.
- Anthropic no es LLMRouter. El router sera componente interno futuro.
- Anthropic no es autoridad institucional. Es una herramienta externa.
- Streaming, tool calling, structured outputs: diferidos a v2.
- Anthropic embeddings (si los ofrece) no reemplazan EmbeddingProvider.

---

## 8. DATOS QUE MANEJA

| Tipo de dato | Sensibilidad | Almacenado en CURDEECLAU? | Almacenado en Anthropic? |
|--------------|-------------|---------------------------|--------------------------|
| Prompts y mensajes | Alto | Si | Si (en transito) |
| Respuestas de modelos | Medio | Si | Si (en transito) |
| Metadatos de uso (tokens, costo) | Bajo | Si | Si |
| API key | Critico | No (variable de entorno) | No (autenticacion) |

---

## 9. RIESGOS

### 9.1 Riesgo de desaparicion

- Que se pierde: Acceso a modelos premium. Se usaria OpenAI directo u OpenRouter.
- Como se reemplaza: OpenAIAdapter directo (LLM-3), OpenRouterAdapter (LLM-2, puede enrutar a Anthropic via gateway).
- Tiempo estimado de migracion: Inmediato (los otros adapters ya existen).

### 9.2 Riesgo de cambio de pricing/API

- Estabilidad historica: Alta. Anthropic tiene track record solido desde Claude 1.
- Frecuencia de breaking changes: Baja (API Messages estable desde 2023).
- Costo actual: Premium. Mayor que OpenAI y significativamente mayor que DeepSeek.
- Sensibilidad al costo: Alta. Usar solo para tareas que requieran maxima calidad.

### 9.3 Riesgo de seguridad

- Datos sensibles: Prompts y mensajes pasan por servidores de Anthropic.
- Cumplimiento: Anthropic no entrena con datos de API. Politica de privacidad solida.
- Historial de incidentes: Bajo. Anthropic tiene enfoque en seguridad.

### 9.4 Riesgo de acoplamiento

- Nivel: Bajo (implementado detras de LLMProvider)
- Justificacion: AnthropicAdapter implementa LLMProvider. Cambiar de Anthropic a otro provider es cambiar la implementacion del adapter, no el contrato.
- La API Messages de Anthropic no es OpenAI-compatible, lo que hace que el adapter sea ligeramente mas complejo que los otros. Pero el contrato LLMProvider aisla completamente esta diferencia.

---

## 10. DEPENDENCIAS

**Modulos CURDEECLAU que dependeran de Anthropic:**
- AnthropicAdapter (LLM-5) — adapter que implementa LLMProvider

**Modulos CURDEECLAU que NO deben depender de Anthropic directamente:**
- Ningun engine, app, agente o workflow debe importar SDK de Anthropic.

**Dependencias externas:**
- Anthropic API (https://api.anthropic.com/v1)
- API Messages (formato propio, no OpenAI-compatible)

---

## 11. PATTERNS RELACIONADOS

- [x] Provider Pattern — AnthropicAdapter implementa LLMProvider
- [ ] Event Pattern
- [ ] Engine Pattern
- [ ] Ownership Pattern

---

## 12. MODULOS RELACIONADOS

| Modulo | Tipo de relacion | Estado |
|--------|-----------------|--------|
| `packages/shared/src/llm/LLMProvider.ts` | Contrato que el adapter implementa | Existe (LLM-1) |
| `algorithmus-core-engine` (AnthropicAdapter) | Adapter implementado | Existe (LLM-5) |
| `algorithmus-core-engine` (OpenRouterAdapter) | Adapter alternativo (gateway, puede enrutar a Anthropic) | Existe (LLM-2) |
| `algorithmus-core-engine` (OpenAIAdapter) | Adapter alternativo (fallback directo) | Existe (LLM-3) |
| `algorithmus-core-engine` (DeepSeekAdapter) | Adapter alternativo (fallback economico) | Existe (LLM-4) |

---

## 13. PRODUCTOS / VERTICALES QUE PODRIAN USARLO

| Producto/Vertical | Estado de uso |
|-------------------|---------------|
| Dental AI (Sarah) | Candidato (via LLMProvider) |
| AdmissionFlow | Candidato |
| UV-1 (Universidad Latino) | Candidato |
| Tareas de razonamiento complejo | Recomendado |

---

## 14. REGLAS DE USO

1. Anthropic debe consumirse EXCLUSIVAMENTE via AnthropicAdapter detras de LLMProvider.
2. Ningun engine, app, agente o workflow debe importar SDK de Anthropic directamente.
3. Anthropic no es autoridad institucional. Es un provider externo.
4. Anthropic no reemplaza LLMProvider ni LLMRouter.
5. La seleccion de modelo via Anthropic es responsabilidad del adapter, no del consumidor.
6. Anthropic es fallback premium. Usar para tareas que requieran maxima calidad de razonamiento. Para tareas de rutina, considerar DeepSeekAdapter (economico) o OpenAIAdapter (balanceado).
7. La API de Anthropic requiere `max_tokens` obligatorio. El adapter proporciona un default (1024).

---

## 15. REGLAS DE SEGURIDAD

1. Anthropic API key en variable de entorno, nunca en codigo.
2. No loguear prompts ni respuestas completas en produccion.
3. Anthropic no entrena con datos de API por defecto. Verificar politicas actuales.
4. Rate limiting en el adapter para prevenir costos descontrolados.
5. El adapter usa `x-api-key` header (no `Authorization: Bearer`). No intercambiar con otros providers.
6. El adapter envia `anthropic-version: 2023-06-01` como requiere la API.

---

## 16. EVIDENCIA ACTUAL

- [x] Ficha de naturalizacion: Completa
- [x] Adapter en `packages/`: AnthropicAdapter en algorithmus-core-engine
- [x] Implementacion mock para tests: Fake HTTP client
- [x] Tests sin conexion al proveedor: 18 pasan
- [x] Principio extraido documentado: Si (LLM provider-agnostic de maxima calidad)
- [x] Plan de contingencia: Si (fallback a OpenAI directo LLM-3, OpenRouter LLM-2)

---

## 17. ESTADO DE IMPLEMENTACION

- [ ] No iniciado
- [ ] En progreso
- [ ] Funcional (requiere proveedor)
- [x] Funcional (mock para desarrollo) — Fake HTTP client
- [ ] Completo y verificado — pendiente integracion real

---

## 18. DECISION

Proceder con naturalizacion como **Naturalized Candidate**. El adapter existe (`AnthropicAdapter` en `algorithmus-core-engine/src/infra/providers/anthropic/`), implementa `LLMProvider`, y tiene 18 tests con fake HTTP client.

**Lo que existe:**
- Adapter funcional con HTTP client inyectable.
- Tests que validan mapeo de mensajes, sistema separado como top-level param, usage, errores, modelo, providerMetadata, stop_reason, multi-block content, y status 529 (Anthropic overload).
- Sin llamadas reales a API. Sin credenciales.

**Lo que falta para naturalizacion completa:**
- Operacion real con API key de Anthropic.
- Migracion de consumidores existentes.
- Verificacion en entorno con llamadas reales.

Anthropic sigue siendo **Allied / Naturalized Candidate**. No es autoridad institucional.

---

## 19. PROXIMO PASO AUTORIZADO

**LLM-RTR-1 — LLMRouter v1** para habilitar seleccion multi-provider real (OpenRouter, OpenAI, DeepSeek, Anthropic). O **LLM-MIG-1** para migrar consumidores existentes detras de `LLMProvider`.

---

## 20. DIFERENCIAS TECNICAS CON OTROS ADAPTERS

La API Messages de Anthropic no es OpenAI-compatible. Diferencias clave:

| Aspecto | OpenAI/DeepSeek/OpenRouter | Anthropic |
|---------|---------------------------|-----------|
| Endpoint | `/v1/chat/completions` | `/v1/messages` |
| Auth header | `Authorization: Bearer` | `x-api-key` |
| Version header | No requerido | `anthropic-version: 2023-06-01` |
| System prompt | Rol `system` en `messages[]` | Top-level param `system` |
| Roles en messages | `system`, `user`, `assistant` | `user`, `assistant` solamente |
| `max_tokens` | Opcional | **Requerido** |
| Response content | `choices[0].message.content` | `content[0].text` |
| Finish reason | `choices[0].finish_reason` | `stop_reason` |
| Tokens input | `usage.prompt_tokens` | `usage.input_tokens` |
| Tokens output | `usage.completion_tokens` | `usage.output_tokens` |
| Status overload | 429, 502, 503 | 429, 502, 503, **529** |

El AnthropicAdapter abstrae todas estas diferencias detras del contrato `LLMProvider`. Los consumidores no necesitan conocer el formato especifico de Anthropic.

---

*Fin de la ficha Anthropic v1.0.0*
