# OPENROUTER — NATURALIZATION FILE

> Tipo: procedural/naturalizacion
> Version: 1.0.0 — Candidato
> Creado: 2026-06-13
> Autoridad: ADR-LLM-2

---

## 1. NOMBRE DEL ACTIVO

OpenRouter — Gateway multi-modelo unificado para acceso a OpenAI, DeepSeek, Anthropic/Claude, Google/Gemini, Meta/Llama y otros proveedores de modelos de lenguaje.

---

## 2. TIPO DE ACTIVO

External AI Gateway / Model Gateway

---

## 3. ESTADO INSTITUCIONAL

Allied (candidate for Naturalization)

---

## 4. RELACION CON CURDEECLAU

- [ ] Nativo
- [ ] Naturalizado (candidato — el adapter no existe aun, se implementara en LLM-2)
- [x] Allied — Referenciado en 15 archivos del repositorio. Sin adapter formal.
- [ ] Referenciado
- [ ] Archivado

---

## 5. PROPOSITO

OpenRouter provee acceso unificado a multiples modelos de lenguaje via una sola API compatible con OpenAI SDK. Para CURDEECLAU, OpenRouter es un gateway de conveniencia que permite:

- Acceder a OpenAI, DeepSeek, Claude, Gemini, Llama y otros desde un solo adapter.
- Comparar modelos sin implementar un adapter por cada proveedor.
- Cambiar de modelo subyacente sin cambiar de endpoint.

**Principio que encarna:** OpenRouter implementa el concepto de "model gateway". Pekin extrae el principio de "multi-provider LLM access" — el sistema debe poder elegir entre multiples modelos sin acoplarse a ninguno.

**Si no existiera:** CURDEECLAU necesitaria implementar un adapter por cada proveedor (OpenAI, DeepSeek, Claude) antes de tener multi-modelo.

---

## 6. CAPACIDADES PRINCIPALES

1. Chat completion unificado (OpenAI-compatible API) — Estado: Candidato (LLM-2)
2. Acceso a OpenAI GPT-4o, GPT-4 — Estado: Candidato
3. Acceso a DeepSeek V3 — Estado: Candidato
4. Acceso a Anthropic Claude 4, Claude Opus — Estado: Candidato
5. Acceso a Google Gemini — Estado: Candidato
6. Acceso a Meta Llama — Estado: Candidato
7. Model routing por precio/costo — Estado: Candidato
8. Fallback entre proveedores — Estado: Candidato

---

## 7. CAPACIDADES NO ASUMIDAS

- OpenRouter no es LLMProvider de CURDEECLAU. Es un adapter detras del contrato.
- OpenRouter no es LLMRouter. El router sera componente interno futuro de CURDEECLAU.
- OpenRouter no es autoridad institucional. Es una herramienta externa.
- OpenRouter embeddings (si los ofrece) no reemplazan EmbeddingProvider.

---

## 8. DATOS QUE MANEJA

| Tipo de dato | Sensibilidad | Almacenado en CURDEECLAU? | Almacenado en OpenRouter? |
|--------------|-------------|---------------------------|----------------------------|
| Prompts y mensajes | Alto | Si | Si (en transito) |
| Respuestas de modelos | Medio | Si | Si (en transito) |
| Metadatos de uso (tokens, costo) | Bajo | Si | Si |
| API key | Critico | No (variable de entorno) | No (autenticacion) |

---

## 9. RIESGOS

### 9.1 Riesgo de desaparicion

- Que se pierde: Acceso multi-modelo unificado. Hay que implementar adapters individuales.
- Como se reemplaza: OpenAIAdapter directo (LLM-3), DeepSeekAdapter directo (LLM-4).
- Tiempo estimado de migracion: 1-2 semanas por adapter.

### 9.2 Riesgo de cambio de pricing/API

- Estabilidad historica: Moderada. OpenRouter es relativamente nuevo. Compatible con OpenAI SDK.
- Frecuencia de breaking changes: Baja (API compatible con OpenAI)
- Costo actual: No documentado en el repo
- Sensibilidad al costo: Media. Agrega un margen sobre los precios directos de cada proveedor.

### 9.3 Riesgo de seguridad

- Datos sensibles: Prompts y mensajes pasan por servidores de OpenRouter.
- Cumplimiento: Verificar politica de privacidad de OpenRouter. No usar para datos extremadamente sensibles sin evaluacion.
- Historial de incidentes: No evaluado.

### 9.4 Riesgo de acoplamiento

- Nivel: Bajo (si se implementa correctamente detras de LLMProvider)
- Justificacion: El adapter de OpenRouter implementa LLMProvider. Cambiar de OpenRouter a OpenAI directo es cambiar la implementacion del adapter, no el contrato.

---

## 10. DEPENDENCIAS

**Modulos CURDEECLAU que dependeran de OpenRouter:**
- OpenRouterAdapter (a crear en LLM-2) — adapter que implementa LLMProvider

**Modulos CURDEECLAU que NO deben depender de OpenRouter directamente:**
- Ningun engine, app, agente o workflow debe importar SDK de OpenRouter.

**Dependencias externas:**
- OpenRouter API (https://openrouter.ai/api/v1)
- OpenAI-compatible SDK

---

## 11. PATTERNS RELACIONADOS

- [x] Provider Pattern — OpenRouterAdapter implementara LLMProvider (Provider Pattern)
- [ ] Event Pattern
- [ ] Engine Pattern
- [ ] Ownership Pattern

---

## 12. MODULOS RELACIONADOS

| Modulo | Tipo de relacion | Estado |
|--------|-----------------|--------|
| `packages/shared/src/llm/LLMProvider.ts` | Contrato que el adapter implementara | Existe (LLM-1) |
| `algorithmus-core-engine` (LLMGateway) | Consumidor potencial | En uso (referencia "openrouter" en provider type) |
| `semantic-memory` | Consumidor potencial | En uso (OpenAI directo actualmente) |

---

## 13. PRODUCTOS / VERTICALES QUE PODRIAN USARLO

| Producto/Vertical | Estado de uso |
|-------------------|---------------|
| Dental AI (Sarah) | Candidato (via LLMProvider) |
| AdmissionFlow | Candidato |
| UV-1 (Universidad Latino) | Candidato |

---

## 14. REGLAS DE USO

1. OpenRouter debe consumirse EXCLUSIVAMENTE via OpenRouterAdapter detras de LLMProvider.
2. Ningun engine, app, agente o workflow debe importar SDK de OpenRouter directamente.
3. OpenRouter no es autoridad institucional. Es un provider externo.
4. OpenRouter no reemplaza LLMProvider ni LLMRouter.
5. La seleccion de modelo via OpenRouter es responsabilidad del adapter, no del consumidor.

---

## 15. REGLAS DE SEGURIDAD

1. OpenRouter API key en variable de entorno, nunca en codigo.
2. No loguear prompts ni respuestas completas en produccion.
3. No enviar datos personales sensibles sin evaluacion de cumplimiento.
4. Rate limiting en el adapter para prevenir costos descontrolados.

---

## 16. EVIDENCIA ACTUAL

- [x] Ficha de naturalizacion: Completa
- [ ] Adapter en `packages/`: No existe aun (LLM-2)
- [ ] Implementacion mock para tests: No existe
- [ ] Tests sin conexion al proveedor: No existen
- [x] Principio extraido documentado: Si (multi-provider LLM access via gateway)
- [x] Plan de contingencia: Si (fallback a OpenAI directo LLM-3, DeepSeek directo LLM-4)

---

## 17. ESTADO DE IMPLEMENTACION

- [x] No iniciado
- [ ] En progreso
- [ ] Funcional (requiere proveedor)
- [ ] Funcional (mock para desarrollo)
- [ ] Completo y verificado

---

## 18. DECISION

Proceder con naturalizacion como **Naturalized Candidate**. El adapter se implementara en LLM-2. Mientras tanto, OpenRouter es **Allied** (referenciado, utilizado en diseno, sin adapter formal).

---

## 19. PROXIMO PASO AUTORIZADO

**LLM-2 — Implementar OpenRouterAdapter** que satisfaga `LLMProvider` de shared/.

---

*Fin de la ficha OpenRouter v1.0.0*
