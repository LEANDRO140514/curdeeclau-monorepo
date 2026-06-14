# AnthropicAdapter — DNA

> Tipo: dna/llm
> Version: 1.0.0
> Creado: 2026-06-14
> Autoridad: ADR-LLM-2
> Ubicacion: `packages/algorithmus/algorithmus-core-engine/src/infra/providers/anthropic/AnthropicAdapter.ts`

---

## 1. NOMBRE

**AnthropicAdapter** — Anthropic Direct LLM Provider Adapter

---

## 2. TIPO

LLM Adapter / Direct External AI Provider Adapter

Implementa el contrato canonico `LLMProvider`. Es el fallback premium directo a Anthropic, ofreciendo modelos de maxima calidad con enfasis en seguridad y razonamiento.

---

## 3. CANAL / PLATAFORMA EXTERNA RELACIONADA

**Anthropic** — External AI Provider (https://api.anthropic.com)

Anthropic es un proveedor de modelos de lenguaje de alta calidad con enfasis en seguridad, alineacion y razonamiento profundo. Ofrece Claude (Opus 4.8, Sonnet 4.6, Haiku 4.5) con API Messages propia (no OpenAI-compatible). Para CURDEECLAU, Anthropic es la opcion premium para tareas que requieren maxima capacidad de razonamiento.

---

## 4. ESTADO INSTITUCIONAL

- [x] **Active** — Implementado (LLM-5). 18 tests pasan con fake HTTP. Sin llamadas reales.
- [ ] Canonical
- [ ] Superseded
- [ ] Deprecated
- [x] **Allied** — Anthropic esta naturalizado como Allied / Naturalized Candidate.
- [ ] Naturalized — Pendiente de operacion real con API key.

---

## 5. PROPOSITO

Proveer acceso directo a Claude (Opus 4.8, Sonnet 4.6, Haiku 4.5) a traves del contrato `LLMProvider`. AnthropicAdapter es el fallback premium que permite usar modelos de maxima calidad y seguridad cuando las tareas lo requieren.

---

## 6. RESPONSABILIDAD PRINCIPAL

Implementar `LLMProvider.generate()` traduciendo llamadas internas a la API Messages de Anthropic (formato propio, no OpenAI-compatible), mapeando respuestas a tipos canonicos `LLMResponse`, y gestionando errores via `LLMProviderError`.

---

## 7. RESPONSABILIDADES EXPLICITAMENTE EXCLUIDAS

1. **NO es autoridad institucional.** Es un adapter. La autoridad es `LLMProvider`.
2. **NO reemplaza OpenRouterAdapter, OpenAIAdapter ni DeepSeekAdapter.** Es un adapter complementario — fallback premium.
3. **NO es el adapter recomendado para tareas de rutina.** Anthropic es optimo para razonamiento complejo; DeepSeek para costo; OpenAI para balance.
4. **NO implementa streaming.** Diferido a v2.
5. **NO implementa tool calling / function calling.** Diferido a v2.
6. **NO implementa structured outputs.** Diferido a v2.
7. **NO gestiona API keys.** Recibe `apiKey` via config. No lee variables de entorno.
8. **NO implementa embeddings.** `EmbeddingProvider` es contrato separado.
9. **NO usa SDK de Anthropic.** Usa fetch nativo contra la API Messages.

---

## 8. PROVIDER EXTERNO RELACIONADO

| Atributo | Valor |
|----------|-------|
| Nombre | Anthropic |
| Tipo | External AI Provider |
| URL | https://api.anthropic.com/v1 |
| Naturalizacion | `procedural/naturalizacion/anthropic.md` — Allied / Naturalized Candidate |
| Autoridad institucional | Ninguna. Es un proveedor externo. |

---

## 9. CONTRATO IMPLEMENTADO

`LLMProvider` de `@curdeeclau/shared`

```typescript
class AnthropicAdapter implements LLMProvider {
  readonly providerId = 'anthropic';
  async generate(request: LLMRequest): Promise<LLMResponse>;
}
```

---

## 10. CONFIGURACION

```typescript
type AnthropicAdapterConfig = {
  apiKey: string;              // REQUERIDO. API key de Anthropic.
  baseUrl?: string;            // Default: 'https://api.anthropic.com/v1'
  defaultModel?: string;       // Default: 'claude-sonnet-4-6'
  timeoutMs?: number;          // Default: 60_000 (mayor que OpenAI/DeepSeek por modelos premium)
  defaultMaxTokens?: number;   // Default: 1024 (REQUERIDO por Anthropic API)
  anthropicVersion?: string;   // Default: '2023-06-01'
  logger?: Logger;             // Default: pino logger
};
```

### Modelos soportados (via `model` en `LLMRequest`)

| Modelo | Descripcion |
|--------|-------------|
| `claude-sonnet-4-6` (default) | Claude Sonnet 4.6 — balance velocidad/calidad |
| `claude-opus-4-8` | Claude Opus 4.8 — maxima capacidad de razonamiento |
| `claude-haiku-4-5` | Claude Haiku 4.5 — rapido y economico |

### HTTP Client inyectable

```typescript
type HttpFetch = (
  url: string,
  options: { method: string; headers: Record<string, string>; body?: string; signal?: AbortSignal },
) => Promise<{ status: number; json(): Promise<unknown> }>;
```

Mismo patron que `OpenRouterAdapter`, `OpenAIAdapter` y `DeepSeekAdapter`.

---

## 11. INPUTS

| Input | Origen | Sensibilidad | Formato |
|-------|--------|-------------|---------|
| `LLMRequest.messages` | Consumidor (engine, agente) | Alto — puede contener datos de usuario | `LLMMessage[]` |
| `LLMRequest.model?` | Consumidor | Bajo | `string` (ej: `'claude-opus-4-8'`, `'claude-sonnet-4-6'`) |
| `apiKey` | Variable de entorno externa | Critico | `string` |
| HTTP response de Anthropic | Anthropic Messages API | Medio — respuestas de modelos | JSON (Anthropic format) |

---

## 12. OUTPUTS

| Output | Destino | Sensibilidad | Evento asociado |
|--------|---------|-------------|-----------------|
| `LLMResponse.text` | Consumidor | Medio | Ninguno (v1) |
| `LLMResponse.usage` | Consumidor / Observabilidad futura | Bajo | Ninguno (v1) |
| `LLMResponse.providerMetadata` | Consumidor (opcional) | Bajo | Contiene `anthropic_id`, `anthropic_type`, `anthropic_stop_reason` |

---

## 13. INVARIANTES

1. **MUST:** Toda llamada directa a Anthropic debe pasar por `AnthropicAdapter`.
2. **MUST NOT:** Ningun engine, app o agente debe importar SDK de Anthropic directamente.
3. **MUST:** Mensajes con rol `system` deben extraerse y enviarse como top-level param `system`. Solo roles `user` y `assistant` van en `messages[]`.
4. **MUST:** `max_tokens` debe enviarse siempre (Anthropic API lo requiere). Default: 1024.
5. **MUST:** Errores HTTP >= 400 deben convertirse en `LLMProviderError`.
6. **MUST:** Errores 429, 502, 503, 529 deben marcarse `retryable: true`.
7. **MUST:** `LLMResponse.provider` debe ser `'anthropic'`.
8. **SHALL:** `providerMetadata` debe incluir `anthropic_id`, `anthropic_type` y `anthropic_stop_reason`.
9. **SHALL:** `usage.input_tokens` mapea a `promptTokens`, `usage.output_tokens` a `completionTokens`.
10. **SHALL:** Multiples `system` messages se concatenan con `\n\n`.
11. **SHALL:** Multiples text blocks en `content[]` se concatenan.
12. **SHALL:** AbortError (timeout) debe convertirse en `LLMProviderError` con `retryable: true`.

---

## 14. MAPEO DE API (Anthropic Messages ↔ LLMProvider)

### Request mapping

```
LLMRequest.messages (system, user, assistant)
    │
    ├── system messages → body.system (string, concatenados con \n\n)
    └── user + assistant messages → body.messages[] ({role, content})
    
LLMRequest.model → body.model
LLMRequest.temperature → body.temperature
LLMRequest.maxTokens → body.max_tokens (REQUERIDO, default 1024)
```

### Response mapping

```
Anthropic Response
    │
    ├── content[].text (concatenados) → LLMResponse.text
    ├── model → LLMResponse.model
    ├── stop_reason → LLMResponse.finishReason
    ├── usage.input_tokens → LLMUsage.promptTokens
    ├── usage.output_tokens → LLMUsage.completionTokens
    ├── id → providerMetadata.anthropic_id
    ├── type → providerMetadata.anthropic_type
    └── stop_reason → providerMetadata.anthropic_stop_reason
```

---

## 15. RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Anthropic desaparece o cambia API | Baja | Alto | OpenRouterAdapter y OpenAIAdapter como fallback. OpenRouter puede seguir enrutando a Anthropic via gateway. |
| API Messages cambia formato | Baja | Medio | El adapter aisla el formato. Solo requiere cambios en el adapter, no en consumidores. |
| Costo elevado | Alta | Medio | Usar solo para tareas premium. DeepSeekAdapter para tareas economicas. LLMRouter futuro automatizara seleccion. |
| Timeout en modelos premium (>60s) | Media | Bajo | Timeout default de 60s (vs 30s de otros adapters). Configurable via `timeoutMs`. |

---

## 16. EVIDENCIA DE TESTS

| Tipo | Cantidad | Estado |
|------|----------|--------|
| Tests unitarios (fake HTTP client) | 18 | Todos pasan |
| Tests con API real | 0 | Sin credenciales |
| Tests de integracion | 0 | Sin entorno configurado |

### Cobertura de tests (`AnthropicAdapter.spec.ts`)

| Test | Que valida |
|------|------------|
| Satisface `LLMProvider` | `providerId === 'anthropic'`, `typeof generate === 'function'` |
| `generate()` mapea texto | `response.text` desde `content[0].text` |
| Model del request | `claude-opus-4-8` se usa si se pasa en `request.model` |
| Default model | `claude-sonnet-4-6` si no se especifica |
| Usage tokens | `input_tokens` → `promptTokens`, `output_tokens` → `completionTokens` |
| Messages multi-rol | user + assistant (sin system en messages[]) |
| System como top-level | system messages se extraen y concatenan |
| Temperature | Se pasa sin errores |
| maxTokens | Se usa del request si se proporciona |
| `stop_reason: max_tokens` | Mapeo correcto a `finishReason` |
| `stop_reason: end_turn` | Mapeo correcto a `finishReason` |
| Multi-block content | Text blocks concatenados correctamente |
| HTTP error → `LLMProviderError` | Status >= 400 lanza error tipado |
| Rate limit (429) retryable | `retryable: true` |
| Overload (529) retryable | Anthropic-specific overload status |
| Server error (503) retryable | `retryable: true` |
| Sin API key real | Test fake no requiere credenciales |
| `providerMetadata` | Contiene `anthropic_id`, `anthropic_type`, `anthropic_stop_reason` |

**Nota:** AnthropicAdapter tiene 18 tests. Los tests adicionales vs OpenAIAdapter (11) cubren: system como top-level param, `stop_reason: end_turn`, multi-block content concatenation, status 529 (Anthropic overload), y providerMetadata con 3 campos (vs 2 en OpenAI/DeepSeek).

---

## 17. SEGURIDAD Y CREDENCIALES

| Tipo | Almacenamiento | Rotacion |
|------|---------------|----------|
| Anthropic API Key | Variable de entorno (externo al adapter) | Sin politica definida aun (LLM-SEC-1 pendiente) |

**Reglas:**

1. API key nunca en codigo. Se inyecta via `AnthropicAdapterConfig`.
2. No loguear API key. El logger del adapter no registra headers de autenticacion.
3. **Header de autenticacion:** `x-api-key` (NO `Authorization: Bearer`). No intercambiar con otros providers.
4. **Version header:** `anthropic-version: 2023-06-01` requerido por Anthropic.
5. Anthropic no entrena con datos de API por defecto.
6. Rate limiting via `retryable` en `LLMProviderError`. Status 529 es overload especifico de Anthropic.

---

## 18. FALLBACK / CONTINGENCIA

Si Anthropic falla:

- **Comportamiento esperado:** El adapter lanza `LLMProviderError` con `retryable` segun el status HTTP. El consumidor (o LLMRouter futuro) decide reintentar o cambiar a otro adapter.
- **Fallback inmediato:** OpenAIAdapter (LLM-3, similar calidad, mayor costo potencial) u OpenRouterAdapter (LLM-2, puede seguir usando Anthropic via gateway si el problema es solo la API directa).
- **Tiempo maximo de recuperacion:** Inmediato si se cambia a otro adapter.
- **Procedimiento:** Cambiar via config o LLMRouter a OpenAIAdapter u OpenRouterAdapter.

---

## 19. RELACION CON NATURALIZACION

- **Ficha de naturalizacion:** `procedural/naturalizacion/anthropic.md`
- **Estado de naturalizacion:** Allied / Naturalized Candidate
- **Estado del adapter:** Implementado con fake HTTP. Sin verificacion con API real.
- **Pendiente para naturalizacion completa:** Operacion real con API key. Migracion de consumidores.

---

## 20. RELACION CON ADR-LLM-2

ADR-LLM-2 clasifico AnthropicAdapter como **fallback premium (LLM-5)** en la arquitectura multi-provider:

```
LLMProvider
  +-- OpenRouterAdapter (primario, gateway)
  +-- OpenAIAdapter (fallback directo)
  +-- DeepSeekAdapter (fallback economico)
  +-- AnthropicAdapter (fallback premium) ← este adapter
```

ADR-LLM-2 establecio que Anthropic es relevante "para tareas que requieran maxima calidad de razonamiento".

---

## 21. COMO REGENERARLO

Si `AnthropicAdapter.ts` se pierde:

1. Leer este DNA.
2. Leer `LLMProvider.dna.md` (contrato que implementa).
3. Leer `naturalizacion/anthropic.md` (ficha del provider externo).
4. Leer ADR-LLM-2 (estrategia multi-provider).
5. Recrear `AnthropicAdapter` con:
   - `providerId = 'anthropic'`
   - `generate(request)` → mapea `LLMRequest` a HTTP POST a `https://api.anthropic.com/v1/messages`
   - System messages extraidos como top-level param `system`
   - Solo roles `user` y `assistant` en `messages[]`
   - Headers: `x-api-key`, `anthropic-version: 2023-06-01`, `Content-Type: application/json`
   - `max_tokens` REQUERIDO (default 1024)
   - Mapea respuesta Anthropic a `LLMResponse` con `providerMetadata.anthropic_id`, `.anthropic_type`, `.anthropic_stop_reason`
   - Errores envueltos en `LLMProviderError` (incluyendo 529 overload)
   - `HttpFetch` inyectable para tests
6. Ejecutar `AnthropicAdapter.spec.ts` — debe pasar 18/18 con fake HTTP.

---

## 22. PROXIMO PASO AUTORIZADO

**LLM-RTR-1 — LLMRouter v1.** Con los 4 adapters (OpenRouter, OpenAI, DeepSeek, Anthropic), la familia LLM esta completa. El siguiente paso es el router que selecciona dinamicamente entre ellos.

---

*Fin del AnthropicAdapter DNA v1.0.0*
