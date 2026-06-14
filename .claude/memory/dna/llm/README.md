# DNA — LLM Family

> Tipo: dna/llm
> Version: 1.0.0 — Inicial
> Creado: 2026-06-14
> Autoridad: ADR-LLM-1, ADR-LLM-2
> Fase: DNA-LLM-1

---

## 1. PROPOSITO DE LA FAMILIA LLM

La familia LLM de CURDEECLAU provee capacidad de razonamiento, generacion de texto y embeddings a traves de contratos canonicos provider-agnosticos. Cualquier engine, app, workflow o agente consume modelos de lenguaje exclusivamente a traves de `LLMProvider` (chat completion) y `EmbeddingProvider` (vectores). Ningun consumidor debe importar un SDK de proveedor directamente.

---

## 2. RELACION CON ADR-LLM-1

ADR-LLM-1 establecio que CURDEECLAU debe tener contratos canonicos `LLMProvider` y `EmbeddingProvider` en `shared/`. La decision separo embeddings de chat completion, difirio streaming/tool calling/structured outputs a v2, y establecio que ningun engine debe importar SDKs de proveedores directamente.

---

## 3. RELACION CON ADR-LLM-2

ADR-LLM-2 definio la estrategia **OpenRouter-first, not OpenRouter-only**:

- OpenRouterAdapter como primer adapter (gateway multi-modelo).
- OpenAIAdapter como fallback directo.
- DeepSeekAdapter como fallback economico.
- AnthropicAdapter como fallback premium (pendiente LLM-5).
- LLMRouter como capa interna de seleccion (pendiente LLM-RTR-1).

---

## 4. RELACION CON LLMPROVIDER

`LLMProvider` es el contrato canonico definido en `packages/shared/src/llm/LLMProvider.ts`. Todos los adapters lo implementan. `LLMProvider` es autoridad institucional; los adapters son implementaciones. Ningun adapter reemplaza el contrato.

---

## 5. DIFERENCIA ENTRE CONCEPTOS

| Concepto | Definicion | Ejemplo en CURDEECLAU |
|----------|------------|------------------------|
| **Contrato canonico** | Interfaz abstracta definida por Pekin en `shared/`. Define QUE se puede hacer, no COMO. | `LLMProvider`, `EmbeddingProvider` |
| **Provider externo** | Servicio de terceros que ofrece capacidad LLM. No es autoridad. | OpenAI, DeepSeek, Anthropic |
| **Adapter** | Implementacion concreta del contrato canonico para un provider especifico. Traduce llamadas internas a API externa. | `OpenAIAdapter`, `DeepSeekAdapter` |
| **Gateway** | Provider externo que unifica acceso a multiples modelos via una sola API. No es autoridad. | OpenRouter |
| **Fallback** | Adapter alternativo usado cuando el primario falla. No es un tipo especial de componente — es un rol operativo. | OpenAIAdapter como fallback de OpenRouterAdapter |
| **Router futuro** | Componente INTERNO de CURDEECLAU que selecciona que adapter usar por costo, calidad, latencia, disponibilidad. No existe aun. | `LLMRouter` (LLM-RTR-1) |

---

## 6. ARQUITECTURA ACTUAL

```
apps / agents / workflows / engines
        |
        v
   LLMRouter (futuro, NO IMPLEMENTADO)
   - Seleccion por costo, calidad, latencia
   - Fallback automatico
   - Rate limiting, circuit breaker
        |
        v
   LLMProvider (shared/, IMPLEMENTADO)
   - Contrato canonico
   - generate(request) => response
        |
        +-- OpenRouterAdapter (IMPLEMENTADO, LLM-2)
        |   - Gateway multi-modelo
        |   - Acceso a OpenAI, DeepSeek, Claude, Gemini, etc.
        |   - providerId: 'openrouter'
        |
        +-- OpenAIAdapter (IMPLEMENTADO, LLM-3)
        |   - Fallback directo
        |   - Menor latencia (sin salto extra)
        |   - providerId: 'openai'
        |
        +-- DeepSeekAdapter (IMPLEMENTADO, LLM-4)
        |   - Fallback economico
        |   - providerId: 'deepseek'
        |
        +-- AnthropicAdapter (IMPLEMENTADO, LLM-5)
            - Fallback premium
```

---

## 7. ESTADO ACTUAL

| Componente | Estado | Ubicacion | Tests |
|------------|--------|-----------|-------|
| **LLMProvider** | Implementado | `packages/shared/src/llm/LLMProvider.ts` | 9 (shared) |
| **EmbeddingProvider** | Implementado como contrato, sin adapter operativo | `packages/shared/src/llm/EmbeddingProvider.ts` | 3 (shared) |
| **OpenRouterAdapter** | Implementado, sin llamadas reales | `algorithmus-core-engine/src/infra/providers/openrouter/` | 11 (fake HTTP) |
| **OpenAIAdapter** | Implementado, sin llamadas reales | `algorithmus-core-engine/src/infra/providers/openai/` | 11 (fake HTTP) |
| **DeepSeekAdapter** | Implementado, sin llamadas reales | `algorithmus-core-engine/src/infra/providers/deepseek/` | 13 (fake HTTP) |
| **AnthropicAdapter** | Implementado, sin llamadas reales | `algorithmus-core-engine/src/infra/providers/anthropic/` | 18 (fake HTTP) |

---

## 8. QUE NO EXISTE TODAVIA

- **LLM-RTR-1** — LLM-RTR-1 pendiente.
- **LLM-MIG-1** — Migracion de consumidores existentes a `LLMProvider`.
- **Operacion real con API keys** — Todos los tests usan fake HTTP. Sin verificacion contra APIs reales.
- **Streaming** — Diferido a v2 del contrato.
- **Tool calling / Function calling** — Diferido a v2 del contrato.
- **Structured outputs** — Diferido a v2 del contrato.
- **EmbeddingProvider adapter operativo** — Sin implementacion concreta (OpenAI, Pinecone, etc.).
- **Observabilidad de costos** — Sin tracking de tokens/gasto por tenant o producto.
- **Manejo de secretos** — Sin politica formal de almacenamiento y rotacion de API keys.

---

## 9. PROXIMOS PASOS AUTORIZADOS

| Fase | Entregable | Prioridad |
|------|-----------|-----------|
| **LLM-5** | AnthropicAdapter premium | **COMPLETADO** — familia de fallbacks directos completa |
| **LLM-RTR-1** | LLMRouter v1 (seleccion interna por costo/calidad/disponibilidad) | Alta — habilita multi-provider real |
| **LLM-MIG-1** | Migrar consumidores existentes a `LLMProvider` | Media — reduce acoplamiento directo a OpenAI |
| **LLM-OBS-1** | Observabilidad de costos y uso | Media — requerido para operacion real |
| **LLM-SEC-1** | Manejo de secretos y politicas de API keys | Media — requerido para operacion real |
| **LLM-EMB-1** | EmbeddingProvider adapter operativo | Baja — sin consumidores urgentes |

---

## 10. INVENTARIO DE FICHAS DNA

| Ficha | Archivo | Tipo |
|-------|---------|------|
| LLMProvider | `LLMProvider.dna.md` | Canonical Contract |
| EmbeddingProvider | `EmbeddingProvider.dna.md` | Canonical Contract |
| OpenRouterAdapter | `OpenRouterAdapter.dna.md` | LLM Adapter / External AI Gateway Adapter |
| OpenAIAdapter | `OpenAIAdapter.dna.md` | LLM Adapter / Direct External AI Provider Adapter |
| DeepSeekAdapter | `DeepSeekAdapter.dna.md` | LLM Adapter / Direct External AI Provider Adapter |
| AnthropicAdapter | `AnthropicAdapter.dna.md` | LLM Adapter / Direct External AI Provider Adapter |

---

*Fin del DNA LLM Family README v1.0.0*
