# OpenAIAdapter — DNA

> Tipo: dna/llm
> Version: 1.0.0
> Creado: 2026-06-14
> Autoridad: ADR-LLM-2
> Ubicacion: `packages/algorithmus/algorithmus-core-engine/src/infra/providers/openai/OpenAIAdapter.ts`

---

## 1. NOMBRE

**OpenAIAdapter** — OpenAI Direct LLM Provider Adapter

---

## 2. TIPO

LLM Adapter / Direct External AI Provider Adapter

Implementa el contrato canonico `LLMProvider`. Es el fallback directo a OpenAI, sin pasar por OpenRouter. Menor latencia, mayor control, dependencia directa de un solo proveedor.

---

## 3. CANAL / PLATAFORMA EXTERNA RELACIONADA

**OpenAI** — External AI Provider (https://api.openai.com)

OpenAI es el proveedor de modelos de lenguaje mas utilizado en CURDEECLAU. Actualmente se consume directamente en `algorithmus-core-engine` (LLMGateway, moderacion), `knowledge-engine` (embeddings), y `semantic-memory` (extraccion de hechos).

---

## 4. ESTADO INSTITUCIONAL

- [x] **Active** — Implementado (LLM-3). 11 tests pasan con fake HTTP. Sin llamadas reales.
- [ ] Canonical
- [ ] Superseded
- [ ] Deprecated
- [x] **Allied** — OpenAI esta naturalizado como Allied / Naturalized Candidate.
- [ ] Naturalized — Pendiente de operacion real con API key y migracion de consumidores.

---

## 5. PROPOSITO

Proveer acceso directo a OpenAI GPT-4o y otros modelos OpenAI a traves del contrato `LLMProvider`. OpenAIAdapter es el fallback directo cuando OpenRouter no esta disponible, cuando la latencia extra del gateway no se justifica, o cuando se requiere control directo sobre el proveedor.

---

## 6. RESPONSABILIDAD PRINCIPAL

Implementar `LLMProvider.generate()` traduciendo llamadas internas a la API directa de OpenAI, mapeando respuestas a tipos canonicos `LLMResponse`, y gestionando errores via `LLMProviderError`.

---

## 7. RESPONSABILIDADES EXPLICITAMENTE EXCLUIDAS

1. **NO es autoridad institucional.** Es un adapter. La autoridad es `LLMProvider`.
2. **NO reemplaza OpenRouterAdapter.** Es un adapter complementario — fallback directo.
3. **NO es el adapter recomendado por defecto.** ADR-LLM-2 establece OpenRouter-first.
4. **NO implementa streaming.** Diferido a v2.
5. **NO implementa tool calling.** Diferido a v2.
6. **NO implementa structured outputs.** Diferido a v2.
7. **NO gestiona API keys.** Recibe `apiKey` via config. No lee variables de entorno.
8. **NO implementa embeddings.** Embeddings estan en `EmbeddingProvider`, contrato separado.
9. **NO implementa moderacion.** El adapter `OpenAIModerationClient` existente es independiente.
10. **NO debe usarse para bypass del contrato.** Seguir consumiendo via `LLMProvider`, no via `OpenAIAdapter` directamente.

---

## 8. PROVIDER EXTERNO RELACIONADO

| Atributo | Valor |
|----------|-------|
| Nombre | OpenAI |
| Tipo | External AI Provider |
| URL | https://api.openai.com/v1 |
| Naturalizacion | `procedural/naturalizacion/openai.md` — Allied / Naturalized Candidate |
| Autoridad institucional | Ninguna. Es un proveedor externo. |

---

## 9. CONTRATO IMPLEMENTADO

`LLMProvider` de `@curdeeclau/shared`

```typescript
class OpenAIAdapter implements LLMProvider {
  readonly providerId = 'openai';
  async generate(request: LLMRequest): Promise<LLMResponse>;
}
```

---

## 10. CONFIGURACION

```typescript
type OpenAIAdapterConfig = {
  apiKey: string;          // REQUERIDO. API key de OpenAI.
  baseUrl?: string;        // Default: 'https://api.openai.com/v1'
  defaultModel?: string;   // Default: 'gpt-4o'
  timeoutMs?: number;      // Default: 30_000
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

Mismo patron que `OpenRouterAdapter` y `DeepSeekAdapter`. `HttpFetch` inyectable para tests sin API real.

---

## 11. INPUTS

| Input | Origen | Sensibilidad | Formato |
|-------|--------|-------------|---------|
| `LLMRequest.messages` | Consumidor (engine, agente) | Alto — puede contener datos de usuario | `LLMMessage[]` |
| `LLMRequest.model?` | Consumidor | Bajo | `string` (ej: `'gpt-4o'`, `'gpt-4-turbo'`) |
| `apiKey` | Variable de entorno externa | Critico | `string` |
| HTTP response de OpenAI | OpenAI API | Medio — respuestas de modelos | JSON |

---

## 12. OUTPUTS

| Output | Destino | Sensibilidad | Evento asociado |
|--------|---------|-------------|-----------------|
| `LLMResponse.text` | Consumidor | Medio | Ninguno (v1) |
| `LLMResponse.usage` | Consumidor / Observabilidad futura | Bajo | Ninguno (v1) |
| `LLMResponse.providerMetadata` | Consumidor (opcional) | Bajo | Contiene `openai_id`, `openai_created` |

---

## 13. INVARIANTES

1. **MUST:** Toda llamada directa a OpenAI debe pasar por `OpenAIAdapter`.
2. **MUST NOT:** Ningun engine, app o agente debe importar SDK de OpenAI directamente.
3. **MUST:** Errores HTTP >= 400 deben convertirse en `LLMProviderError`.
4. **MUST:** Errores 429, 502, 503 deben marcarse `retryable: true`.
5. **MUST:** `LLMResponse.provider` debe ser `'openai'`.
6. **SHALL:** `providerMetadata` debe incluir `openai_id` y `openai_created`.
7. **SHALL:** AbortError (timeout) debe convertirse en `LLMProviderError` con `retryable: true`.

---

## 14. RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| OpenAI desaparece o cambia API | Media | Alto | OpenRouterAdapter como gateway. DeepSeekAdapter como economico. AnthropicAdapter futuro. |
| Vendor lock-in si se usa como primario | Media | Alto | ADR-LLM-2 establece OpenRouter-first. OpenAIAdapter es fallback. |
| Costos elevados vs DeepSeek | Alta | Medio | DeepSeekAdapter como opcion economica. LLMRouter futuro seleccionara por costo. |
| Latencia menor que OpenRouter | — | Beneficio | Salto directo sin gateway intermedio. |
| Consumidores migran a OpenAIAdapter en vez de LLMProvider | Media | Alto | El adapter implementa `LLMProvider`. Los consumidores deben programar contra la interfaz, no contra el adapter. |

---

## 15. EVIDENCIA DE TESTS

| Tipo | Cantidad | Estado |
|------|----------|--------|
| Tests unitarios (fake HTTP client) | 11 | Todos pasan |
| Tests con API real | 0 | Sin credenciales |
| Tests de integracion | 0 | Sin entorno configurado |

### Cobertura de tests (`OpenAIAdapter.spec.ts`)

| Test | Que valida |
|------|------------|
| Satisface `LLMProvider` | `providerId === 'openai'`, `typeof generate === 'function'` |
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
| OpenAI API Key | Variable de entorno (externo al adapter) | Sin politica definida aun (LLM-SEC-1 pendiente) |

**Reglas:**

1. API key nunca en codigo. Se inyecta via `OpenAIAdapterConfig`.
2. No loguear API key. El logger del adapter no registra headers de autenticacion.
3. Verificar que OpenAI no usa datos de CURDEECLAU para entrenamiento (opt-out).
4. Rate limiting via `retryable` en `LLMProviderError`.

---

## 17. FALLBACK / CONTINGENCIA

Si OpenAI falla:

- **Comportamiento esperado:** El adapter lanza `LLMProviderError` con `retryable` segun el status HTTP. El consumidor (o LLMRouter futuro) decide reintentar o cambiar a otro adapter.
- **Fallback inmediato:** OpenRouterAdapter (LLM-2, puede seguir usando OpenAI via gateway) o DeepSeekAdapter (LLM-4).
- **Tiempo maximo de recuperacion:** Inmediato si se cambia a otro adapter.
- **Procedimiento:** Si OpenAI directo falla, cambiar via config o LLMRouter a OpenRouterAdapter (OpenAI via gateway) o DeepSeekAdapter.

---

## 18. RELACION CON NATURALIZACION

- **Ficha de naturalizacion:** `procedural/naturalizacion/openai.md`
- **Estado de naturalizacion:** Allied / Naturalized Candidate
- **Estado del adapter:** Implementado con fake HTTP. Sin verificacion con API real.
- **Pendiente para naturalizacion completa:** Operacion real con API key. Migracion de consumidores existentes (LLM-MIG-1).

---

## 19. RELACION CON ADR-LLM-2

ADR-LLM-2 clasifico OpenAIAdapter como **fallback directo (LLM-3)** en la arquitectura multi-provider:

```
LLMProvider
  +-- OpenRouterAdapter (primario, gateway)
  +-- OpenAIAdapter (fallback directo) ← este adapter
  +-- DeepSeekAdapter (fallback economico)
  +-- AnthropicAdapter (fallback premium, futuro)
```

ADR-LLM-2 establecio que OpenAIAdapter no debe ser el primer adapter (OpenRouter-first), pero debe existir como fallback.

---

## 20. COMO REGENERARLO

Si `OpenAIAdapter.ts` se pierde:

1. Leer este DNA.
2. Leer `LLMProvider.dna.md` (contrato que implementa).
3. Leer `naturalizacion/openai.md` (ficha del provider externo).
4. Leer ADR-LLM-2 (estrategia multi-provider).
5. Recrear `OpenAIAdapter` con:
   - `providerId = 'openai'`
   - `generate(request)` → mapea `LLMRequest` a OpenAI-compatible HTTP POST a `https://api.openai.com/v1/chat/completions`
   - Mapea respuesta a `LLMResponse` con `providerMetadata.openai_id` y `.openai_created`
   - Errores envueltos en `LLMProviderError`
   - `HttpFetch` inyectable para tests
6. Ejecutar `OpenAIAdapter.spec.ts` — debe pasar 11/11 con fake HTTP.

---

## 21. PROXIMO PASO AUTORIZADO

**LLM-5 — AnthropicAdapter premium.** O **LLM-MIG-1** para migrar consumidores existentes detras de `LLMProvider`. OpenAIAdapter en si mismo no requiere cambios inmediatos.

---

*Fin del OpenAIAdapter DNA v1.0.0*
