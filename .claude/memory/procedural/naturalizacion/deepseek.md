# DEEPSEEK — NATURALIZATION FILE

> Tipo: procedural/naturalizacion
> Version: 1.0.0 — Candidato
> Creado: 2026-06-14
> Autoridad: ADR-LLM-2

---

## 1. NOMBRE DEL ACTIVO

DeepSeek — Proveedor de modelos de lenguaje con enfasis en costo eficiente. Ofrece DeepSeek Chat (V3) y DeepSeek Reasoner (R1) con API OpenAI-compatible.

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

DeepSeek provee capacidad de razonamiento y generacion de texto a un costo significativamente menor que OpenAI, con calidad competitiva en benchmarks. Para CURDEECLAU, DeepSeek es el fallback economico que permite escalar sin depender exclusivamente de OpenAI o OpenRouter.

**Principio que encarna:** DeepSeek implementa el concepto de "modelo de lenguaje como servicio". Pekin extrae el principio de "LLM provider-agnostic de bajo costo" — el sistema debe poder elegir el modelo mas economico disponible sin cambiar la logica de negocio.

**Si no existiera:** Se usaria OpenAI o un modelo open source como Llama. Se perderia la opcion de menor costo manteniendo calidad competitiva.

---

## 6. CAPACIDADES PRINCIPALES

1. Chat Completion (deepseek-chat / V3) — Estado: Candidato (LLM-4)
2. Chat Completion (deepseek-reasoner / R1) — Estado: Candidato
3. API OpenAI-compatible — Estado: Utilizado (facilita el adapter)
4. Function Calling — Estado: No implementado
5. Streaming — Estado: No implementado

---

## 7. CAPACIDADES NO ASUMIDAS

- DeepSeek no es LLMProvider de CURDEECLAU. Es un adapter detras del contrato.
- DeepSeek no es LLMRouter. El router sera componente interno futuro.
- DeepSeek no es autoridad institucional. Es una herramienta externa.
- Streaming, tool calling, structured outputs: diferidos a v2.
- DeepSeek embeddings (si los ofrece) no reemplazan EmbeddingProvider.

---

## 8. DATOS QUE MANEJA

| Tipo de dato | Sensibilidad | Almacenado en CURDEECLAU? | Almacenado en DeepSeek? |
|--------------|-------------|---------------------------|--------------------------|
| Prompts y mensajes | Alto | Si | Si (en transito) |
| Respuestas de modelos | Medio | Si | Si (en transito) |
| Metadatos de uso (tokens, costo) | Bajo | Si | Si |
| API key | Critico | No (variable de entorno) | No (autenticacion) |

---

## 9. RIESGOS

### 9.1 Riesgo de desaparicion

- Que se pierde: Acceso a modelos economicos. Se usaria OpenAI u OpenRouter.
- Como se reemplaza: OpenAIAdapter directo (LLM-3), OpenRouterAdapter (LLM-2).
- Tiempo estimado de migracion: Inmediato (los otros adapters ya existen).

### 9.2 Riesgo de cambio de pricing/API

- Estabilidad historica: Moderada. DeepSeek es relativamente nuevo.
- Frecuencia de breaking changes: Baja (API compatible con OpenAI)
- Costo actual: Significativamente menor que OpenAI.
- Sensibilidad al costo: Baja (DeepSeek ya es la opcion economica).

### 9.3 Riesgo de seguridad

- Datos sensibles: Prompts y mensajes pasan por servidores de DeepSeek.
- Cumplimiento: Verificar politica de privacidad de DeepSeek. Datos procesados en China.
- Historial de incidentes: No evaluado.

### 9.4 Riesgo de acoplamiento

- Nivel: Bajo (implementado detras de LLMProvider)
- Justificacion: DeepSeekAdapter implementa LLMProvider. Cambiar de DeepSeek a otro provider es cambiar la implementacion del adapter, no el contrato.

---

## 10. DEPENDENCIAS

**Modulos CURDEECLAU que dependeran de DeepSeek:**
- DeepSeekAdapter (LLM-4) — adapter que implementa LLMProvider

**Modulos CURDEECLAU que NO deben depender de DeepSeek directamente:**
- Ningun engine, app, agente o workflow debe importar SDK de DeepSeek.

**Dependencias externas:**
- DeepSeek API (https://api.deepseek.com/v1)
- API OpenAI-compatible (no requiere SDK especifico de DeepSeek)

---

## 11. PATTERNS RELACIONADOS

- [x] Provider Pattern — DeepSeekAdapter implementa LLMProvider
- [ ] Event Pattern
- [ ] Engine Pattern
- [ ] Ownership Pattern

---

## 12. MODULOS RELACIONADOS

| Modulo | Tipo de relacion | Estado |
|--------|-----------------|--------|
| `packages/shared/src/llm/LLMProvider.ts` | Contrato que el adapter implementa | Existe (LLM-1) |
| `algorithmus-core-engine` (DeepSeekAdapter) | Adapter implementado | Existe (LLM-4) |
| `algorithmus-core-engine` (OpenRouterAdapter) | Adapter alternativo (gateway) | Existe (LLM-2) |
| `algorithmus-core-engine` (OpenAIAdapter) | Adapter alternativo (fallback directo) | Existe (LLM-3) |

---

## 13. PRODUCTOS / VERTICALES QUE PODRIAN USARLO

| Producto/Vertical | Estado de uso |
|-------------------|---------------|
| Dental AI (Sarah) | Candidato (via LLMProvider) |
| AdmissionFlow | Candidato |
| UV-1 (Universidad Latino) | Candidato |

---

## 14. REGLAS DE USO

1. DeepSeek debe consumirse EXCLUSIVAMENTE via DeepSeekAdapter detras de LLMProvider.
2. Ningun engine, app, agente o workflow debe importar SDK de DeepSeek directamente.
3. DeepSeek no es autoridad institucional. Es un provider externo.
4. DeepSeek no reemplaza LLMProvider ni LLMRouter.
5. La seleccion de modelo via DeepSeek es responsabilidad del adapter, no del consumidor.
6. DeepSeek es fallback economico. Para tareas que requieran mayor capacidad de razonamiento, considerar OpenAIAdapter directo o OpenRouterAdapter.

---

## 15. REGLAS DE SEGURIDAD

1. DeepSeek API key en variable de entorno, nunca en codigo.
2. No loguear prompts ni respuestas completas en produccion.
3. No enviar datos personales sensibles sin evaluacion de cumplimiento.
4. Rate limiting en el adapter para prevenir costos descontrolados.
5. Considerar residencia de datos: DeepSeek procesa en China.

---

## 16. EVIDENCIA ACTUAL

- [x] Ficha de naturalizacion: Completa
- [x] Adapter en `packages/`: DeepSeekAdapter en algorithmus-core-engine
- [x] Implementacion mock para tests: Fake HTTP client
- [x] Tests sin conexion al proveedor: 13 pasan
- [x] Principio extraido documentado: Si (LLM provider-agnostic de bajo costo)
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

Proceder con naturalizacion como **Naturalized Candidate**. El adapter existe (`DeepSeekAdapter` en `algorithmus-core-engine/src/infra/providers/deepseek/`), implementa `LLMProvider`, y tiene 13 tests con fake HTTP client.

**Lo que existe:**
- Adapter funcional con HTTP client inyectable.
- Tests que validan mapeo de mensajes, usage, errores, modelo y providerMetadata.
- Sin llamadas reales a API. Sin credenciales.

**Lo que falta para naturalizacion completa:**
- Operacion real con API key de DeepSeek.
- Migracion de consumidores existentes.
- Verificacion en entorno con llamadas reales.

DeepSeek sigue siendo **Allied / Naturalized Candidate**. No es autoridad institucional.

---

## 19. PROXIMO PASO AUTORIZADO

**LLM-5 — AnthropicAdapter premium** (ultimo fallback directo). O **LLM-MIG-1** para migrar consumidores existentes detras de `LLMProvider`.

---

*Fin de la ficha DeepSeek v1.0.0*
