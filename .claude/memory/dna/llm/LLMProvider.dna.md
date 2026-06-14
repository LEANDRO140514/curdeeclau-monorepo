# LLMProvider — DNA

> Tipo: dna/llm
> Version: 1.0.0
> Creado: 2026-06-14
> Autoridad: ADR-LLM-1, ADR-LLM-2
> Ubicacion: `packages/shared/src/llm/LLMProvider.ts`

---

## 1. NOMBRE

**LLMProvider** — Canonical LLM Provider Contract

---

## 2. TIPO

Canonical Contract / Provider Interface (Nivel 4 — Patrones, Provider Pattern)

`LLMProvider` es la interfaz que todo adapter de modelo de lenguaje debe implementar en CURDEECLAU. Es el equivalente LLM de `CRMProvider` y `CalendarProvider`.

---

## 3. ESTADO INSTITUCIONAL

- [x] **Active** — Implementado en `shared/`. 3 adapters lo implementan. 9 tests pasan.
- [ ] Canonical — Pendiente de ratificacion formal como institucion.
- [ ] Superseded
- [ ] Deprecated

---

## 4. UBICACION

```
packages/shared/src/llm/
├── LLMProvider.ts        ← Contrato canonico (este activo)
├── EmbeddingProvider.ts  ← Contrato separado (ver ficha correspondiente)
├── index.ts              ← Barrel exports
```

---

## 5. PROPOSITO

Definir la interfaz provider-agnostica para interacciones con modelos de lenguaje en CURDEECLAU. Garantiza que cualquier engine, app, workflow o agente pueda consumir capacidad LLM sin acoplarse a un proveedor especifico.

`LLMProvider` es la respuesta institucional al riesgo R-1 (Sin LLMProvider / OpenAI acoplado), clasificado P0 en RISK-1.

---

## 6. RESPONSABILIDAD PRINCIPAL

Proveer un contrato unico para **chat completion sincrono** (v1) que todo adapter de proveedor externo debe implementar.

---

## 7. RESPONSABILIDADES EXPLICITAMENTE EXCLUIDAS

1. **NO es un provider externo.** `LLMProvider` es una interfaz interna. No se conecta a ninguna API.
2. **NO decide routing.** La seleccion de que adapter usar es responsabilidad de `LLMRouter` (futuro).
3. **NO conoce vendors.** No referencia OpenAI, DeepSeek, Anthropic ni ningun proveedor.
4. **NO implementa streaming.** Diferido a v2 del contrato.
5. **NO implementa tool calling / function calling.** Diferido a v2.
6. **NO implementa structured outputs.** Diferido a v2.
7. **NO gestiona credenciales.** Las API keys son responsabilidad de cada adapter.
8. **NO define modelos.** El campo `model` es un string libre. Cada adapter decide que modelos soporta.

---

## 8. CONTRATOS RELACIONADOS

| Contrato | Relacion | Ubicacion |
|----------|----------|-----------|
| `EmbeddingProvider` | Contrato hermano. Separado por ADR-LLM-1. Un provider puede implementar uno, otro o ambos. | `shared/src/llm/EmbeddingProvider.ts` |
| `LLMRouter` (futuro) | Consumidor principal. Seleccionara que adapter usar. | No implementado aun |

---

## 9. METODOS PRINCIPALES

### Interfaz

```typescript
interface LLMProvider {
  readonly providerId: string;
  generate(request: LLMRequest): Promise<LLMResponse>;
}
```

### Metodo unico: `generate(request) => response`

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `request.messages` | `LLMMessage[]` | Secuencia de mensajes (system, user, assistant) |
| `request.model?` | `string` | Modelo deseado. Opcional — el adapter usa su default. |
| `request.temperature?` | `number` | 0..2. Opcional. |
| `request.maxTokens?` | `number` | Max tokens de completion. Opcional. |
| `request.metadata?` | `LLMMetadata` | Extension (tenantId, traceId, etc.) |

### Retorno

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `text` | `string` | Texto generado |
| `model` | `string` | Modelo usado |
| `provider` | `string` | Provider identifier |
| `usage?` | `LLMUsage` | Tokens consumidos |
| `finishReason?` | `string` | Razon de finalizacion |
| `providerMetadata?` | `Record<string, unknown>` | Metadata especifica del provider |

---

## 10. TIPOS CANONICOS

| Tipo | Definicion |
|------|------------|
| `LLMRole` | `'system' \| 'user' \| 'assistant'` |
| `LLMMessage` | `{ role: LLMRole; content: string }` |
| `LLMMetadata` | `{ tenantId?: string; traceId?: string; [key: string]: unknown }` |
| `LLMRequest` | `{ messages; model?; temperature?; maxTokens?; metadata? }` |
| `LLMResponse` | `{ text; model; provider; usage?; finishReason?; providerMetadata? }` |
| `LLMUsage` | `{ promptTokens; completionTokens; totalTokens }` |

---

## 11. ERROR CANONICO

```typescript
class LLMProviderError extends Error {
  providerId: string;    // Que provider fallo
  statusCode?: number;   // HTTP status o equivalente
  retryable: boolean;    // Si un retry probablemente resuelve
}
```

---

## 12. HELPERS

```typescript
createUserMessage(content: string): LLMMessage
createSystemMessage(content: string): LLMMessage
createAssistantMessage(content: string): LLMMessage
```

---

## 13. INVARIANTES

1. **MUST:** Todo adapter de LLM debe implementar `LLMProvider`.
2. **MUST NOT:** Ningun engine, app, workflow o agente debe importar un SDK de proveedor directamente.
3. **MUST:** `LLMProviderError` debe usarse para todos los errores de provider. No se permiten errores genericos.
4. **SHALL:** `providerId` debe ser un string unico y descriptivo (`'openai'`, `'deepseek'`, `'openrouter'`).
5. **SHALL:** `LLMResponse.provider` debe coincidir con `providerId`.
6. **MUST NOT:** `LLMResponse.providerMetadata` no debe ser requerido para logica de negocio. Es metadata opcional.

---

## 14. CONSUMERS ESPERADOS

| Consumer | Estado | Notas |
|----------|--------|-------|
| `LLMRouter` (futuro) | Pendiente LLM-RTR-1 | Sera el consumidor principal |
| `LLMGateway` (algorithmus-core-engine) | Sin migrar | Usa tipos locales. Debe migrar a `LLMProvider`. |
| `semantic-memory` | Sin migrar | Usa OpenAI SDK directo. Debe migrar. |
| Agentes y workflows | Futuro | Consumiran via `LLMRouter` o `LLMProvider` directamente |

---

## 15. PROVIDERS / ADAPTERS IMPLEMENTADOS

| Adapter | providerId | Estado | Tests |
|---------|------------|--------|-------|
| `OpenRouterAdapter` | `'openrouter'` | Implementado (LLM-2) | 11 pasan |
| `OpenAIAdapter` | `'openai'` | Implementado (LLM-3) | 11 pasan |
| `DeepSeekAdapter` | `'deepseek'` | Implementado (LLM-4) | 13 pasan |
| `AnthropicAdapter` | `'anthropic'` (tentativo) | Pendiente LLM-5 | — |

---

## 16. RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Contrato insuficiente para casos de uso reales | Media | Medio | v2 extendera con streaming, tool calling, structured outputs |
| Adapters no cubren todos los providers necesarios | Baja | Medio | Arquitectura permite agregar adapters sin cambiar el contrato |
| Consumidores ignoran el contrato y usan SDKs directos | Media | Alto | LLM-MIG-1 pendiente. Enforcement via code review y harness. |
| Cambio de firma en v2 rompe adapters existentes | Baja | Medio | v2 debe ser aditivo o proveer camino de migracion |

---

## 17. EVIDENCIA

- [x] **Contrato implementado:** `packages/shared/src/llm/LLMProvider.ts` (112 lineas)
- [x] **Tipos canonicos:** `LLMRole`, `LLMMessage`, `LLMMetadata`, `LLMRequest`, `LLMResponse`, `LLMUsage`
- [x] **Error canonico:** `LLMProviderError` con `providerId`, `statusCode`, `retryable`
- [x] **Helpers:** `createUserMessage`, `createSystemMessage`, `createAssistantMessage`
- [x] **Barrel exports:** `packages/shared/src/llm/index.ts`
- [x] **Mock provider:** `MockLLMProvider` en tests (satisface la interfaz)
- [x] **3 adapters lo implementan:** OpenRouterAdapter, OpenAIAdapter, DeepSeekAdapter
- [x] **Cero dependencias externas:** Sin imports de SDKs de proveedores

---

## 18. TESTS

| Archivo | Cantidad | Framework | Tipo |
|---------|----------|-----------|------|
| `packages/shared/src/tests/llm.test.ts` | 9 | Vitest | Contrato + mock |

Tests cubren:

1. Mock provider satisface `LLMProvider`
2. `LLMProviderError` con metadata de provider
3. `createUserMessage` — forma correcta
4. `createSystemMessage` — forma correcta
5. `createAssistantMessage` — forma correcta
6. `LLMRequest` acepta `temperature`, `maxTokens`, `model`
7. Mock `EmbeddingProvider.embedText` — forma correcta
8. Mock `EmbeddingProvider.embedBatch` — forma correcta
9. `EmbeddingProviderError` con metadata de provider

---

## 19. RELACION CON PEKIN

| Principio | Como lo implementa |
|-----------|-------------------|
| **I — Soberania** | El contrato es interno. Ningun proveedor dicta su forma. Si OpenAI desaparece, el contrato sigue. |
| **IV — Separacion Principio-Herramienta** | El principio es "modelo de lenguaje como servicio". La herramienta es OpenAI, DeepSeek, etc. El contrato extrae el principio. |
| **IX — Regenerabilidad** | Si todo el codigo se pierde, este DNA + ADR-LLM-1 contienen suficiente informacion para regenerar el contrato. |

**Nivel en jerarquia:** Nivel 4 — Patrones (Provider Pattern aplicado a LLM)

**Es una institucion de Pekin?** No aun. Es un contrato canonico definido por ADR-LLM-1. Podria promoverse a institucion si alcanza 3+ modulos consumidores y 0 desviaciones.

---

## 20. RELACION CON ADRs

| ADR | Relacion |
|-----|----------|
| **ADR-LLM-1** | Creo este contrato. Definiio separacion de embeddings, alcance v1, y metodo `generate()`. |
| **ADR-LLM-2** | Definiio la estrategia multi-provider. Establecio que todos los adapters (OpenRouter, OpenAI, DeepSeek) deben implementar este contrato. |

---

## 21. COMO REGENERARLO

Si `LLMProvider.ts` se pierde:

1. Leer este DNA.
2. Leer ADR-LLM-1 (contiene el contrato conceptual completo).
3. Leer ADR-LLM-2 (contiene la estrategia multi-provider).
4. Recrear `LLMProvider.ts` con: interfaz `LLMProvider`, tipos `LLMRequest`/`LLMResponse`/`LLMUsage`, error `LLMProviderError`, helpers.
5. Recrear `EmbeddingProvider.ts` (misma fuente).
6. Verificar que los 3 adapters existentes compilan contra el nuevo contrato.
7. Ejecutar `llm.test.ts` — debe pasar 9/9.

---

## 22. PROXIMO PASO AUTORIZADO

**LLM-5 — AnthropicAdapter premium.** Ultimo fallback directo pendiente. Debe implementar `LLMProvider`. No requiere cambios en este contrato.

Seguido de: **LLM-RTR-1 — LLMRouter v1.** Consumira `LLMProvider` para seleccionar adapter por costo, calidad y disponibilidad.

---

*Fin del LLMProvider DNA v1.0.0*
