# EmbeddingProvider — DNA

> Tipo: dna/llm
> Version: 1.0.0
> Creado: 2026-06-14
> Autoridad: ADR-LLM-1
> Ubicacion: `packages/shared/src/llm/EmbeddingProvider.ts`

---

## 1. NOMBRE

**EmbeddingProvider** — Canonical Embedding Provider Contract

---

## 2. TIPO

Canonical Contract / Provider Interface (Nivel 4 — Patrones, Provider Pattern)

`EmbeddingProvider` es la interfaz que todo adapter de generacion de vectores (embeddings) debe implementar en CURDEECLAU. Esta **separado** de `LLMProvider` por decision explicita de ADR-LLM-1.

---

## 3. ESTADO INSTITUCIONAL

- [x] **Active** — Implementado en `shared/`. 3 tests pasan. Sin adapter operativo aun.
- [ ] Canonical — Pendiente de adapter operativo y consumidores reales.
- [ ] Superseded
- [ ] Deprecated

---

## 4. UBICACION

```
packages/shared/src/llm/
├── LLMProvider.ts           ← Contrato hermano (chat completion)
├── EmbeddingProvider.ts     ← Contrato de embeddings (este activo)
├── index.ts                 ← Barrel exports
```

---

## 5. PROPOSITO

Definir la interfaz provider-agnostica para generacion de vectores (embeddings) en CURDEECLAU. Permite que cualquier engine (knowledge-engine, semantic-memory) genere embeddings sin acoplarse a un proveedor especifico (OpenAI, Pinecone, etc.).

---

## 6. RESPONSABILIDAD PRINCIPAL

Proveer un contrato unico para **generacion de embeddings** (single-text y batch) que todo adapter de proveedor externo debe implementar.

---

## 7. RESPONSABILIDADES EXPLICITAMENTE EXCLUIDAS

1. **NO es un provider externo.** `EmbeddingProvider` es una interfaz interna. No se conecta a ninguna API.
2. **NO esta acoplado a `LLMProvider`.** Son interfaces independientes. Un provider puede implementar una, otra o ambas.
3. **NO implementa busqueda semantica.** Solo genera vectores. La busqueda es responsabilidad de `knowledge-engine`.
4. **NO gestiona almacenamiento de vectores.** Pinecone, pgvector, etc. son responsables del storage.
5. **NO define modelos de embedding.** El campo `model` es un string libre.
6. **NO gestiona credenciales.** Las API keys son responsabilidad de cada adapter.

---

## 8. RELACION CON LLMPROVIDER

| Aspecto | LLMProvider | EmbeddingProvider |
|---------|-------------|-------------------|
| Propósito | Chat completion | Vector generation |
| Separacion | ADR-LLM-1 — explicita | ADR-LLM-1 — explicita |
| Implementadores | OpenRouter, OpenAI, DeepSeek | Ninguno aun |
| Consumidores | Workflows, agentes, engines | knowledge-engine, semantic-memory |
| Madurez | 3 adapters + mock | Solo mock |

---

## 9. METODOS PRINCIPALES

### Interfaz

```typescript
interface EmbeddingProvider {
  readonly providerId: string;
  embedText(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  embedBatch(request: EmbeddingBatchRequest): Promise<EmbeddingBatchResponse>;
}
```

### `embedText(request) => response`

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `input` | `string` | Texto a embeber |
| `model?` | `string` | Modelo deseado. Opcional. |
| `dimensions?` | `number` | Dimension del vector. Opcional. |
| `metadata?` | `Record<string, unknown>` | Extension |

### `embedBatch(request) => response`

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `inputs` | `string[]` | Multiples textos a embeber |
| `model?` | `string` | Modelo deseado. Opcional. |
| `dimensions?` | `number` | Dimension del vector. Opcional. |
| `metadata?` | `Record<string, unknown>` | Extension |

---

## 10. TIPOS CANONICOS

| Tipo | Definicion |
|------|------------|
| `EmbeddingVector` | `{ index: number; embedding: number[]; tokensUsed?: number }` |
| `EmbeddingRequest` | `{ input: string; model?; dimensions?; metadata? }` |
| `EmbeddingBatchRequest` | `{ inputs: string[]; model?; dimensions?; metadata? }` |
| `EmbeddingResponse` | `{ provider: string; model: string; vector: EmbeddingVector }` |
| `EmbeddingBatchResponse` | `{ provider: string; model: string; vectors: EmbeddingVector[]; totalTokensUsed?: number }` |

---

## 11. ERROR CANONICO

```typescript
class EmbeddingProviderError extends Error {
  providerId: string;
  statusCode?: number;
  retryable: boolean;
}
```

---

## 12. INVARIANTES

1. **MUST:** Todo adapter de embeddings debe implementar `EmbeddingProvider`.
2. **MUST NOT:** `EmbeddingProvider` no debe acoplarse a `LLMProvider`. Son contratos independientes.
3. **MUST:** `EmbeddingProviderError` debe usarse para todos los errores de provider de embeddings.
4. **SHALL:** `providerId` debe ser unico y descriptivo.
5. **SHALL:** El vector devuelto debe incluir `index` correlativo al input original.

---

## 13. PROVIDERS / ADAPTERS IMPLEMENTADOS

| Adapter | providerId | Estado |
|---------|------------|--------|
| *(ninguno)* | — | Sin adapter operativo |

**Potenciales adapters futuros:**

| Provider | Tipo | Estado |
|----------|------|--------|
| OpenAI (text-embedding-3-small/large) | External AI Provider | Sin adapter |
| Pinecone (inference) | External Vector DB | Sin adapter |
| DeepSeek (si ofrece embeddings) | External AI Provider | No confirmado |

---

## 14. CONSUMERS POTENCIALES

| Consumer | Estado actual | Notas |
|----------|---------------|-------|
| `knowledge-engine` | Usa OpenAI SDK directo (`embedding.ts` skeleton) | Debe migrar a `EmbeddingProvider` |
| `semantic-memory` | Usa OpenAI SDK directo para extraccion | Debe migrar a `LLMProvider` + `EmbeddingProvider` |

---

## 15. RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Sin adapter operativo | Alta | Medio | Nadie consume embeddings via contrato hoy. LLM-EMB-1 pendiente. |
| Acoplamiento OpenAI en knowledge-engine | Alta | Medio | knowledge-engine referencia `text-embedding-3-small` directamente. |
| Dimension mismatch entre providers | Media | Bajo | El contrato permite `dimensions` opcional. El adapter elige default. |
| Sin consumidores urgentes | Alta | Bajo | No hay presion para implementar adapter ya. |

---

## 16. EVIDENCIA

- [x] **Contrato implementado:** `packages/shared/src/llm/EmbeddingProvider.ts` (101 lineas)
- [x] **Tipos canonicos:** `EmbeddingVector`, `EmbeddingRequest`, `EmbeddingBatchRequest`, `EmbeddingResponse`, `EmbeddingBatchResponse`
- [x] **Error canonico:** `EmbeddingProviderError` con `providerId`, `statusCode`, `retryable`
- [x] **Barrel exports:** `packages/shared/src/llm/index.ts`
- [x] **Mock provider:** `MockEmbeddingProvider` en tests (satisface la interfaz)
- [x] **Cero dependencias externas:** Sin imports de SDKs
- [ ] **Adapter operativo:** No existe

---

## 17. TESTS

| Archivo | Cantidad | Framework | Tipo |
|---------|----------|-----------|------|
| `packages/shared/src/tests/llm.test.ts` | 3 (de 9 totales) | Vitest | Contrato + mock |

Tests de EmbeddingProvider cubren:

1. Mock `embedText` satisface la interfaz
2. Mock `embedBatch` satisface la interfaz con vectores indexados
3. `EmbeddingProviderError` con metadata de provider

---

## 18. RELACION CON PINECONE / PGVECTOR / MEMORIA SEMANTICA

| Sistema | Relacion con EmbeddingProvider | Estado |
|---------|-------------------------------|--------|
| **Pinecone** | Vector store. Naturalizado como Referenced (NAT-1). Almacena vectores generados por `EmbeddingProvider`. | Integrado en `knowledge-engine` |
| **Supabase pgvector** | Vector store alternativo. Naturalizado como Naturalized Candidate (NAT-1). | Sin adapter de embeddings |
| **semantic-memory** | Memoria cross-sesion. Usa OpenAI directo para extraccion y embeddings. | Debe migrar a `LLMProvider` + `EmbeddingProvider` |

**Regla:** `EmbeddingProvider` genera vectores. Pinecone/pgvector los almacenan. Son responsabilidades distintas.

---

## 19. RELACION CON PEKIN

| Principio | Como lo implementa |
|-----------|-------------------|
| **I — Soberania** | El contrato es interno. Si OpenAI desaparece, otro provider de embeddings ocupa su lugar. |
| **IV — Separacion Principio-Herramienta** | El principio es "texto a vector". La herramienta es OpenAI Embeddings, Pinecone, etc. |
| **IX — Regenerabilidad** | Este DNA + ADR-LLM-1 contienen suficiente contexto para regenerar el contrato. |

**Nivel en jerarquia:** Nivel 4 — Patrones (Provider Pattern aplicado a Embeddings)

---

## 20. COMO REGENERARLO

Si `EmbeddingProvider.ts` se pierde:

1. Leer este DNA.
2. Leer ADR-LLM-1 (contiene el contrato conceptual completo).
3. Recrear `EmbeddingProvider.ts` con: interfaz `EmbeddingProvider`, tipos `EmbeddingVector`/`EmbeddingRequest`/`EmbeddingBatchRequest`/`EmbeddingResponse`/`EmbeddingBatchResponse`, error `EmbeddingProviderError`.
4. Verificar que `llm.test.ts` pasa 3/3 tests de embeddings.

---

## 21. PROXIMO PASO AUTORIZADO

**LLM-EMB-1 — EmbeddingProvider adapter operativo.** Implementar al menos un adapter real (OpenAI `text-embedding-3-small`) detras de `EmbeddingProvider`. Sin urgencia — no hay consumidores bloqueados.

---

*Fin del EmbeddingProvider DNA v1.0.0*
