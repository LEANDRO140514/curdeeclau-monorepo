# DeepSeekAdapter — DNA

> Tipo: dna/llm
> Version: 1.0.0
> Creado: 2026-06-14
> Autoridad: ADR-LLM-2
> Ubicacion: `packages/algorithmus/algorithmus-core-engine/src/infra/providers/deepseek/DeepSeekAdapter.ts`

---

## 1. NOMBRE

**DeepSeekAdapter** — DeepSeek Direct LLM Provider Adapter

---

## 2. TIPO

LLM Adapter / Direct External AI Provider Adapter

Implementa el contrato canonico `LLMProvider`. Es el fallback economico directo a DeepSeek, ofreciendo modelos competitivos a menor costo que OpenAI.

---

## 3. CANAL / PLATAFORMA EXTERNA RELACIONADA

**DeepSeek** — External AI Provider (https://api.deepseek.com)

DeepSeek es un proveedor de modelos de lenguaje con enfasis en costo eficiente. Ofrece DeepSeek Chat (V3) y DeepSeek Reasoner (R1) con API OpenAI-compatible. Para CURDEECLAU, DeepSeek es la opcion economica que permite escalar sin depender exclusivamente de OpenAI.

---

## 4. ESTADO INSTITUCIONAL

- [x] **Active** — Implementado (LLM-4). 13 tests pasan con fake HTTP. Sin llamadas reales.
- [ ] Canonical
- [ ] Superseded
- [ ] Deprecated
- [x] **Allied** — DeepSeek esta naturalizado como Allied / Naturalized Candidate.
- [ ] Naturalized — Pendiente de operacion real con API key.

---

## 5. PROPOSITO

Proveer acceso directo a DeepSeek Chat (V3) y DeepSeek Reasoner (R1) a traves del contrato `LLMProvider`. DeepSeekAdapter es el fallback economico que permite usar modelos de lenguaje a una fraccion del costo de OpenAI, manteniendo calidad competitiva.

---

## 6. RESPONSABILIDAD PRINCIPAL

Implementar `LLMProvider.generate()` traduciendo llamadas internas a la API directa de DeepSeek (OpenAI-compatible), mapeando respuestas a tipos canonicos `LLMResponse`, y gestionando errores via `LLMProviderError`.

---

## 7. RESPONSABILIDADES EXPLICITAMENTE EXCLUIDAS

1. **NO es autoridad institucional.** Es un adapter. La autoridad es `LLMProvider`.
2. **NO reemplaza OpenRouterAdapter ni OpenAIAdapter.** Es un adapter complementario — fallback economico.
3. **NO es el adapter recomendado para tareas de alto razonamiento.** DeepSeek es optimo para costo; OpenAI/Claude para razonamiento complejo.
4. **NO implementa streaming.** Diferido a v2.
5. **NO implementa tool calling.** Diferido a v2.
6. **NO implementa structured outputs.** Diferido a v2.
7. **NO gestiona API keys.** Recibe `apiKey` via config. No lee variables de entorno.
8. **NO implementa embeddings.** Aunque DeepSeek podria ofrecer embeddings en el futuro, `EmbeddingProvider` es contrato separado.

---

## 8. PROVIDER EXTERNO RELACIONADO

| Atributo | Valor |
|----------|-------|
| Nombre | DeepSeek |
| Tipo | External AI Provider |
| URL | https://api.deepseek.com/v1 |
| Naturalizacion | `procedural/naturalizacion/deepseek.md` — Allied / Naturalized Candidate |
| Autoridad institucional | Ninguna. Es un proveedor externo. |

---

## 9. CONTRATO IMPLEMENTADO

`LLMProvider` de `@curdeeclau/shared`

```typescript
class DeepSeekAdapter implements LLMProvider {
  readonly providerId = 'deepseek';
  async generate(request: LLMRequest): Promise<LLMResponse>;
}
```

---

## 10. CONFIGURACION

```typescript
type DeepSeekAdapterConfig = {
  apiKey: string;          // REQUERIDO. API key de DeepSeek.
  baseUrl?: string;        // Default: 'https://api.deepseek.com/v1'
  defaultModel?: string;   // Default: 'deepseek-chat'
  timeoutMs?: number;      // Default: 30_000
  logger?: Logger;         // Default: pino logger
};
```

### Modelos soportados (via `model` en `LLMRequest`)

| Modelo | Descripcion |
|--------|-------------|
| `deepseek-chat` (default) | DeepSeek V3 — chat general, menor costo |
| `deepseek-reasoner` | DeepSeek R1 — razonamiento extendido |

### HTTP Client inyectable

```typescript
type HttpFetch = (
  url: string,
  options: { method: string; headers: Record<string, string>; body?: string; signal?: AbortSignal },
) => Promise<{ status: number; json(): Promise<unknown> }>;
```

Mismo patron que `OpenRouterAdapter` y `OpenAIAdapter`.

---

## 11. INPUTS

| Input | Origen | Sensibilidad | Formato |
|-------|--------|-------------|---------|
| `LLMRequest.messages` | Consumidor (engine, agente) | Alto — puede contener datos de usuario | `LLMMessage[]` |
| `LLMRequest.model?` | Consumidor | Bajo | `string` (ej: `'deepseek-chat'`, `'deepseek-reasoner'`) |
| `apiKey` | Variable de entorno externa | Critico | `string` |
| HTTP response de DeepSeek | DeepSeek API | Medio — respuestas de modelos | JSON (OpenAI-compatible) |

---

## 12. OUTPUTS

| Output | Destino | Sensibilidad | Evento asociado |
|--------|---------|-------------|-----------------|
| `LLMResponse.text` | Consumidor | Medio | Ninguno (v1) |
| `LLMResponse.usage` | Consumidor / Observabilidad futura | Bajo | Ninguno (v1) |
| `LLMResponse.providerMetadata` | Consumidor (opcional) | Bajo | Contiene `deepseek_id`, `deepseek_created` |

---

## 13. INVARIANTES

1. **MUST:** Toda llamada directa a DeepSeek debe pasar por `DeepSeekAdapter`.
2. **MUST NOT:** Ningun engine, app o agente debe importar SDK de DeepSeek directamente.
3. **MUST:** Errores HTTP >= 400 deben convertirse en `LLMProviderError`.
4. **MUST:** Errores 429, 502, 503 deben marcarse `retryable: true`.
5. **MUST:** `LLMResponse.provider` debe ser `'deepseek'`.
6. **SHALL:** `providerMetadata` debe incluir `deepseek_id` y `deepseek_created`.
7. **SHALL:** AbortError (timeout) debe convertirse en `LLMProviderError` con `retryable: true`.

---

## 14. RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| DeepSeek desaparece o cambia API | Media | Medio | OpenRouterAdapter y OpenAIAdapter como fallback. API OpenAI-compatible facilita migracion. |
| Datos procesados en China | — | Medio | Considerar para datos sensibles. Usar OpenAIAdapter o AnthropicAdapter futuro para datos con restricciones de residencia. |
| Calidad inferior a OpenAI en tareas complejas | Media | Medio | Usar DeepSeek para tareas de costo optimizado. OpenAI/Claude para razonamiento complejo. LLMRouter futuro automatizara esta seleccion. |
| API OpenAI-compatible — bajo riesgo de acoplamiento | Baja | Beneficio | Si DeepSeek cambia, el adapter absorbe el cambio. |

---

## 15. EVIDENCIA DE TESTS

| Tipo | Cantidad | Estado |
|------|----------|--------|
| Tests unitarios (fake HTTP client) | 13 | Todos pasan |
| Tests con API real | 0 | Sin credenciales |
| Tests de integracion | 0 | Sin entorno configurado |

### Cobertura de tests (`DeepSeekAdapter.spec.ts`)

| Test | Que valida |
|------|------------|
| Satisface `LLMProvider` | `providerId === 'deepseek'`, `typeof generate === 'function'` |
| `generate()` mapea texto | `response.text` coincide con contenido del mock |
| Model del request | `deepseek-reasoner` se usa si se pasa en `request.model` |
| Default model | `deepseek-chat` si no se especifica |
| Usage tokens | `prompt_tokens` → `promptTokens`, etc. |
| Messages multi-rol | system + user + assistant |
| Temperature y maxTokens | Se pasan sin errores |
| `finish_reason` | Mapeo correcto |
| HTTP error → `LLMProviderError` | Status >= 400 lanza error tipado |
| Rate limit retryable | 429 → `retryable: true` |
| Server error retryable | 503 → `retryable: true` |
| `providerMetadata` | Contiene `deepseek_id` y `deepseek_created` |
| Sin API key real | Test fake no requiere credenciales |

**Nota:** DeepSeekAdapter tiene 13 tests (vs 11 de OpenRouter y OpenAI). Los 2 tests adicionales cubren: server error 502/503 retryable, y validacion de `providerMetadata` con prefijo `deepseek_`.

---

## 16. SEGURIDAD Y CREDENCIALES

| Tipo | Almacenamiento | Rotacion |
|------|---------------|----------|
| DeepSeek API Key | Variable de entorno (externo al adapter) | Sin politica definida aun (LLM-SEC-1 pendiente) |

**Reglas:**

1. API key nunca en codigo. Se inyecta via `DeepSeekAdapterConfig`.
2. No loguear API key. El logger del adapter no registra headers de autenticacion.
3. **Residencia de datos:** DeepSeek procesa en China. Evaluar antes de enviar datos personales sensibles.
4. Rate limiting via `retryable` en `LLMProviderError`.

---

## 17. FALLBACK / CONTINGENCIA

Si DeepSeek falla:

- **Comportamiento esperado:** El adapter lanza `LLMProviderError` con `retryable` segun el status HTTP. El consumidor (o LLMRouter futuro) decide reintentar o cambiar a otro adapter.
- **Fallback inmediato:** OpenAIAdapter (LLM-3, mayor costo, mayor calidad) u OpenRouterAdapter (LLM-2, puede seguir usando DeepSeek via gateway si el problema es solo la API directa).
- **Tiempo maximo de recuperacion:** Inmediato si se cambia a otro adapter.
- **Procedimiento:** Cambiar via config o LLMRouter a OpenAIAdapter u OpenRouterAdapter.

---

## 18. RELACION CON NATURALIZACION

- **Ficha de naturalizacion:** `procedural/naturalizacion/deepseek.md`
- **Estado de naturalizacion:** Allied / Naturalized Candidate
- **Estado del adapter:** Implementado con fake HTTP. Sin verificacion con API real.
- **Pendiente para naturalizacion completa:** Operacion real con API key. Migracion de consumidores.

---

## 19. RELACION CON ADR-LLM-2

ADR-LLM-2 clasifico DeepSeekAdapter como **fallback economico (LLM-4)** en la arquitectura multi-provider:

```
LLMProvider
  +-- OpenRouterAdapter (primario, gateway)
  +-- OpenAIAdapter (fallback directo)
  +-- DeepSeekAdapter (fallback economico) ← este adapter
  +-- AnthropicAdapter (fallback premium, futuro)
```

ADR-LLM-2 establecio que DeepSeek es relevante "para cargas altas" por su menor costo.

---

## 20. COMO REGENERARLO

Si `DeepSeekAdapter.ts` se pierde:

1. Leer este DNA.
2. Leer `LLMProvider.dna.md` (contrato que implementa).
3. Leer `naturalizacion/deepseek.md` (ficha del provider externo).
4. Leer ADR-LLM-2 (estrategia multi-provider).
5. Recrear `DeepSeekAdapter` con:
   - `providerId = 'deepseek'`
   - `generate(request)` → mapea `LLMRequest` a OpenAI-compatible HTTP POST a `https://api.deepseek.com/v1/chat/completions`
   - Mapea respuesta a `LLMResponse` con `providerMetadata.deepseek_id` y `.deepseek_created`
   - Errores envueltos en `LLMProviderError`
   - `HttpFetch` inyectable para tests
6. Ejecutar `DeepSeekAdapter.spec.ts` — debe pasar 13/13 con fake HTTP.

---

## 21. PROXIMO PASO AUTORIZADO

**LLM-5 — AnthropicAdapter premium.** Ultimo fallback directo pendiente. DeepSeekAdapter en si mismo no requiere cambios inmediatos.

---

*Fin del DeepSeekAdapter DNA v1.0.0*
