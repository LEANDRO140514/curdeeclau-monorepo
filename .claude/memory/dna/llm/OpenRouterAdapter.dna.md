# OpenRouterAdapter — DNA

> Tipo: dna/llm
> Version: 1.0.0
> Creado: 2026-06-14
> Autoridad: ADR-LLM-2
> Ubicacion: `packages/algorithmus/algorithmus-core-engine/src/infra/providers/openrouter/OpenRouterAdapter.ts`

---

## 1. NOMBRE

**OpenRouterAdapter** — OpenRouter LLM Provider Adapter

---

## 2. TIPO

LLM Adapter / External AI Gateway Adapter

Implementa el contrato canonico `LLMProvider`. Es el primer adapter construido y el gateway multi-modelo principal de CURDEECLAU.

---

## 3. CANAL / PLATAFORMA EXTERNA RELACIONADA

**OpenRouter** — External AI Gateway (https://openrouter.ai)

OpenRouter unifica acceso a OpenAI, DeepSeek, Anthropic/Claude, Google/Gemini, Meta/Llama y otros proveedores via una sola API OpenAI-compatible.

---

## 4. ESTADO INSTITUCIONAL

- [x] **Active** — Implementado (LLM-2). 11 tests pasan con fake HTTP. Sin llamadas reales.
- [ ] Canonical
- [ ] Superseded
- [ ] Deprecated
- [x] **Allied** — OpenRouter esta naturalizado como Allied / Naturalized Candidate.
- [ ] Naturalized — Pendiente de operacion real con API key.

---

## 5. PROPOSITO

Proveer acceso multi-modelo unificado a traves del contrato `LLMProvider`. OpenRouterAdapter permite que CURDEECLAU acceda a OpenAI, DeepSeek, Claude, Gemini y otros modelos usando una sola API y un solo adapter, sin implementar un adapter por cada proveedor.

---

## 6. RESPONSABILIDAD PRINCIPAL

Implementar `LLMProvider.generate()` traduciendo llamadas internas a la API de OpenRouter, mapeando respuestas a tipos canonicos `LLMResponse`, y gestionando errores via `LLMProviderError`.

---

## 7. RESPONSABILIDADES EXPLICITAMENTE EXCLUIDAS

1. **NO es autoridad institucional.** Es un adapter. La autoridad es `LLMProvider`.
2. **NO reemplaza LLMRouter.** LLMRouter sera logica interna de CURDEECLAU. OpenRouterAdapter es un adapter externo.
3. **NO es el unico adapter.** OpenAIAdapter y DeepSeekAdapter existen como fallbacks directos.
4. **NO implementa streaming.** Diferido a v2.
5. **NO implementa tool calling.** Diferido a v2.
6. **NO implementa structured outputs.** Diferido a v2.
7. **NO gestiona API keys.** Recibe `apiKey` via config. No lee variables de entorno.
8. **NO selecciona modelos.** El consumidor elige el modelo (o usa el default). El adapter no rutea.

---

## 8. PROVIDER EXTERNO RELACIONADO

| Atributo | Valor |
|----------|-------|
| Nombre | OpenRouter |
| Tipo | External AI Gateway |
| URL | https://openrouter.ai/api/v1 |
| Naturalizacion | `procedural/naturalizacion/openrouter.md` — Allied / Naturalized Candidate |
| Autoridad institucional | Ninguna. Es un proveedor externo. |

---

## 9. CONTRATO IMPLEMENTADO

`LLMProvider` de `@curdeeclau/shared`

```typescript
class OpenRouterAdapter implements LLMProvider {
  readonly providerId = 'openrouter';
  async generate(request: LLMRequest): Promise<LLMResponse>;
}
```

---

## 10. CONFIGURACION

```typescript
type OpenRouterAdapterConfig = {
  apiKey: string;          // REQUERIDO. API key de OpenRouter.
  baseUrl?: string;        // Default: 'https://openrouter.ai/api/v1'
  defaultModel?: string;   // Default: 'openai/gpt-4o'
  timeoutMs?: number;      // Default: 30_000
  appReferer?: string;     // HTTP-Referer header para OpenRouter
  appTitle?: string;       // X-Title header para OpenRouter
  logger?: Logger;         // Default: pino logger
};
```

### HTTP Client inyectable

```typescript
type HttpFetch = (
  url: string,
  options: { method: string; headers: Record<string, string>; body?: string; signal?: AbortSignal },
) => Promise<{ status: number; json(): Promise<unknown> }>;
```

El adapter acepta un `HttpFetch` opcional en el constructor. En produccion usa `fetch` nativo. En tests usa un fake HTTP client.

---

## 11. INPUTS

| Input | Origen | Sensibilidad | Formato |
|-------|--------|-------------|---------|
| `LLMRequest.messages` | Consumidor (engine, agente) | Alto — puede contener datos de usuario | `LLMMessage[]` |
| `LLMRequest.model?` | Consumidor | Bajo | `string` (ej: `'openai/gpt-4o'`, `'deepseek/deepseek-chat'`) |
| `apiKey` | Variable de entorno externa | Critico | `string` |
| HTTP response de OpenRouter | OpenRouter API | Medio — respuestas de modelos | JSON |

---

## 12. OUTPUTS

| Output | Destino | Sensibilidad | Evento asociado |
|--------|---------|-------------|-----------------|
| `LLMResponse.text` | Consumidor | Medio | Ninguno (v1) |
| `LLMResponse.usage` | Consumidor / Observabilidad futura | Bajo | Ninguno (v1) |
| `LLMResponse.providerMetadata` | Consumidor (opcional) | Bajo | Contiene `openrouter_id`, `openrouter_created` |

---

## 13. INVARIANTES

1. **MUST:** Toda llamada a OpenRouter debe pasar por `OpenRouterAdapter`.
2. **MUST NOT:** Ningun engine, app o agente debe importar SDK de OpenRouter directamente.
3. **MUST:** Errores HTTP >= 400 deben convertirse en `LLMProviderError`.
4. **MUST:** Errores 429, 502, 503 deben marcarse `retryable: true`.
5. **MUST:** `LLMResponse.provider` debe ser `'openrouter'`.
6. **SHALL:** `providerMetadata` debe incluir `openrouter_id` y `openrouter_created`.
7. **SHALL:** AbortError (timeout) debe convertirse en `LLMProviderError` con `retryable: true`.

---

## 14. RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| OpenRouter desaparece | Baja | Alto | OpenAIAdapter y DeepSeekAdapter como fallback directo. |
| OpenRouter cambia API | Media | Medio | API es OpenAI-compatible. Si cambia, afecta a todos los consumers de OpenAI SDK. Mitigacion: adapter abstrae el mapping. |
| OpenRouter añade latencia extra | Alta | Bajo | Salto adicional vs llamada directa. OpenAIAdapter disponible como fallback de menor latencia. |
| OpenRouter registra prompts | Media | Alto | Verificar politica de privacidad. No usar para datos extremadamente sensibles. |
| Costos superiores a llamada directa | Alta | Medio | OpenRouter añade margen. DeepSeekAdapter directo como opcion economica. |

---

## 15. EVIDENCIA DE TESTS

| Tipo | Cantidad | Estado |
|------|----------|--------|
| Tests unitarios (fake HTTP client) | 11 | Todos pasan |
| Tests con API real | 0 | Sin credenciales |
| Tests de integracion | 0 | Sin entorno configurado |

### Cobertura de tests (`OpenRouterAdapter.spec.ts`)

| Test | Que valida |
|------|------------|
| Satisface `LLMProvider` | `providerId === 'openrouter'`, `typeof generate === 'function'` |
| `generate()` mapea texto | `response.text` coincide con contenido del mock |
| Model del request | Si `request.model` se proporciona, se usa en vez del default |
| Default model | Si no hay `request.model`, usa `defaultModel` del config |
| Usage tokens | `prompt_tokens` → `promptTokens`, etc. |
| Messages multi-rol | system + user + assistant |
| Temperature y maxTokens | Se pasan sin errores |
| `finish_reason` | Mapeo correcto |
| HTTP error → `LLMProviderError` | Status >= 400 lanza error tipado |
| Rate limit retryable | 429 → `retryable: true` |
| Sin API key real | Test fake no requiere credenciales |

---

## 16. SEGURIDAD Y CREDENCIALES

| Tipo | Almacenamiento | Rotacion |
|------|---------------|----------|
| OpenRouter API Key | Variable de entorno (externo al adapter) | Sin politica definida aun (LLM-SEC-1 pendiente) |

**Reglas:**

1. API key nunca en codigo. Se inyecta via `OpenRouterAdapterConfig`.
2. No loguear API key. El logger del adapter no registra headers de autenticacion.
3. Rate limiting implementado via `retryable` en `LLMProviderError` (el consumidor decide si reintentar).

---

## 17. FALLBACK / CONTINGENCIA

Si OpenRouter falla:

- **Comportamiento esperado:** El adapter lanza `LLMProviderError` con `retryable` segun el status HTTP. El consumidor (o LLMRouter futuro) decide reintentar o cambiar a otro adapter.
- **Fallback inmediato:** OpenAIAdapter (LLM-3) o DeepSeekAdapter (LLM-4). Ambos implementan `LLMProvider`.
- **Tiempo maximo de recuperacion:** Ilimitado si se usa fallback directo.
- **Procedimiento:** Cambiar el adapter inyectado en el consumidor de `OpenRouterAdapter` a `OpenAIAdapter`. Misma interfaz, distinto provider.

---

## 18. RELACION CON NATURALIZACION

- **Ficha de naturalizacion:** `procedural/naturalizacion/openrouter.md`
- **Estado de naturalizacion:** Allied / Naturalized Candidate
- **Estado del adapter:** Implementado con fake HTTP. Sin verificacion con API real.
- **Pendiente para naturalizacion completa:** Operacion real con API key. Migracion de consumidores.

---

## 19. RELACION CON ADR-LLM-2

ADR-LLM-2 establecio la estrategia **OpenRouter-first, not OpenRouter-only**. OpenRouterAdapter fue el primer adapter construido (LLM-2) siguiendo esa estrategia. ADR-LLM-2 tambien establecio que:

- OpenRouter no es autoridad institucional.
- OpenRouterAdapter no reemplaza LLMRouter.
- OpenAIAdapter y DeepSeekAdapter son fallbacks necesarios.
- OpenRouterAdapter implementa `LLMProvider` de shared.

---

## 20. COMO REGENERARLO

Si `OpenRouterAdapter.ts` se pierde:

1. Leer este DNA.
2. Leer `LLMProvider.dna.md` (contrato que implementa).
3. Leer `naturalizacion/openrouter.md` (ficha del provider externo).
4. Leer ADR-LLM-2 (estrategia multi-provider).
5. Recrear `OpenRouterAdapter` con:
   - `providerId = 'openrouter'`
   - `generate(request)` → mapea `LLMRequest` a OpenAI-compatible HTTP POST a `https://openrouter.ai/api/v1/chat/completions`
   - Mapea respuesta a `LLMResponse` con `providerMetadata.openrouter_id` y `.openrouter_created`
   - Errores envueltos en `LLMProviderError`
   - `HttpFetch` inyectable para tests
6. Ejecutar `OpenRouterAdapter.spec.ts` — debe pasar 11/11 con fake HTTP.

---

## 21. PROXIMO PASO AUTORIZADO

**LLM-5 — AnthropicAdapter premium.** O **LLM-RTR-1 — LLMRouter v1** para habilitar la seleccion automatica entre OpenRouterAdapter, OpenAIAdapter y DeepSeekAdapter.

OpenRouterAdapter en si mismo no requiere cambios inmediatos. Esta completo para v1 (chat completion sincrono, sin streaming/tool calling).

---

*Fin del OpenRouterAdapter DNA v1.0.0*
