# ADR-LLM-1 — LLMProvider Canonical Interface

> Tipo: institutional/adr
> Version: 1.0.0
> Ratificado: 2026-06-13
> Autoridad: Asamblea de Pekin
> Riesgo relacionado: R-1 (RISK-1 Technical Triage)
> Naturalizacion relacionada: OpenAI (NAT-1, Allied candidate)

---

## 1. ESTADO

**ACEPTADO / RATIFICADO**

---

## 2. CONTEXTO

### R-1 detectado en RISK-1 como P0

El reporte RISK-1 identifico que CURDEECLAU no tiene una interfaz canonica `LLMProvider` equivalente a `CRMProvider` o `CalendarProvider`. OpenAI se usa directamente sin abstraccion formal que garantice intercambiabilidad.

### Evidencia de inspeccion de codigo

**LLMGateway (`algorithmus-core-engine/src/core/llm/LLMGateway.ts`):**
- Define tipos `LLMInput`, `LLMResponse`, `LLMTask` localmente.
- `LLMResponse.provider` ya es provider-agnostico: `"ollama" | "openrouter" | "gemini"`.
- Pero los tipos estan aislados en algorithmus-core-engine. No son contratos canonicos.
- Tiene timeout, retry, y logging. Bien disenado para lo que hace.

**EmbeddingService (`knowledge-engine/src/embedding.ts`):**
- Esqueleto. Referencia `text-embedding-3-small` (OpenAI) por defecto.
- El metodo `embedChunks()` lanza `Error('no implementado — Fase 3+')`.
- Sin implementacion real. Sin embargo, el concepto ya existe.

**Semantic Memory (`semantic-memory/src/extractor.ts`):**
- Usa OpenAI para extraccion de hechos via LLM.
- Dependencia directa del SDK de OpenAI.

**OpenAI moderation (`algorithmus-core-engine/src/infra/providers/openai/`):**
- Dos archivos: `OpenAIModerationClient.ts`, `OpenAIModerationSafetyPort.ts`.
- Cliente concreto + port interface. Bien estructurado pero especifico de OpenAI.

### Conclusion de inspeccion

- El concepto LLM provider-agnostico YA EXISTE en el codigo (`LLMGateway`). Pero esta aislado en un engine.
- No hay contrato canonico en `shared/` que otros engines/providers/apps puedan consumir.
- Los embeddings estan en etapa de diseno (skeleton).
- OpenAI es el unico proveedor con implementacion real. Moderacion y extraccion dependen de el.

---

## 3. PROBLEMA

Sin un `LLMProvider` canonico:

1. **Vendor lock-in.** Cambiar de OpenAI a DeepSeek o Claude requiere reescribir en cada punto de uso.
2. **Acoplamiento directo a SDKs.** `semantic-memory` importa el SDK de OpenAI. `algorithmus-core-engine` tiene cliente de moderacion especifico.
3. **Tests dificiles.** Sin interfaz, no hay mock provider. Cada test que usa LLM necesita un proveedor real o un stub ad-hoc.
4. **Naturalizacion incompleta.** OpenAI no puede ser Naturalized (NAT-1) sin una interfaz que lo envuelva.
5. **Workflows no portables.** Un workflow que usa LLM no puede cambiar de modelo sin reescribirse.
6. **Imposible model routing.** Sin contrato, no hay capa donde insertar un router de modelos (elegir el modelo mas barato, el mas rapido, etc.).

---

## 4. DECISION

La Asamblea de Pekin declara:

1. **Debe existir un contrato canonico `LLMProvider` en `packages/shared/`.** Es el equivalente LLM de `CRMProvider` y `CalendarProvider`.

2. **El contrato define metodos minimos: `chat(messages, options) => LLMResponse`.** No prescribe modelo, provider ni estrategia.

3. **Embeddings se definen en una interfaz separada `EmbeddingProvider` en `shared/`.** No se acoplan a `LLMProvider`. Un provider puede implementar uno, otro o ambos.

4. **Streaming, tool calling y structured outputs se difieren a versiones futuras del contrato (v2+).** La v1 cubre chat completion sincrono + embeddings.

5. **OpenAI, DeepSeek, Anthropic u otros deben implementarse como adapters de `LLMProvider`.** Ningun engine, app, workflow o agent debe importar un SDK de proveedor directamente.

6. **El `LLMGateway` existente en algorithmus-core-engine puede evolucionar para consumir `LLMProvider` de shared**, convirtiendose en un orchestrator/ router sobre el contrato, no en el dueno del contrato.

7. **Model routing es responsabilidad de una capa superior (LLMRouter futuro), no del contrato base.** El contrato define la interfaz; el router selecciona que implementacion usar.

---

## 5. ALCANCE DE LA DECISION

### Incluye

- `LLMProvider` — interfaz base para chat completion (v1)
- `EmbeddingProvider` — interfaz separada para embeddings (v1)
- `LLMRequest`, `LLMResponse`, `LLMMessage` — tipos canonicos
- `LLMProviderError` — errores estandarizados
- `LLMUsage` — metadata de tokens y costos
- Ubicacion: `packages/shared/src/llm/`

### No incluye

- Implementacion de adapters (eso es LLM-1 o fases posteriores)
- Streaming (diferido a v2)
- Tool calling / function calling (diferido a v2)
- Structured outputs (diferido a v2)
- Model routing (diferido a capa superior futura)
- Prompt registry (diferido)
- Credenciales o configuracion de proveedores

---

## 6. CONTRATO CONCEPTUAL SUGERIDO

### LLMProvider (v1)

```typescript
interface LLMProvider {
  readonly providerName: string;
  chat(request: LLMRequest): Promise<LLMResponse>;
}

interface LLMRequest {
  messages: LLMMessage[];
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    tenantId?: string;
    traceId?: string;
  };
}

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LLMResponse {
  id: string;
  content: string;
  model: string;
  provider: string;
  usage?: LLMUsage;
  finishReason?: string;
  metadata?: Record<string, unknown>;
}

interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

class LLMProviderError extends Error {
  provider: string;
  statusCode?: number;
  retryable: boolean;
}
```

### EmbeddingProvider (v1, separado)

```typescript
interface EmbeddingProvider {
  readonly providerName: string;
  embed(inputs: string[], options?: EmbeddingOptions): Promise<EmbeddingResult[]>;
}

interface EmbeddingResult {
  index: number;
  embedding: number[];
  tokensUsed?: number;
}
```

### Respuesta a preguntas del Senado

| Pregunta | Decision |
|----------|----------|
| Embeddings = LLMProvider o separado? | **Separado.** `EmbeddingProvider` es su propia interfaz. Un provider puede implementar uno, otro o ambos. |
| Structured output en v1? | **No.** Diferido a v2. |
| Streaming en v1? | **No.** Diferido a v2. |
| Tool calling en v1? | **No.** Diferido a v2. |
| Model routing en el contrato? | **No.** El contrato define la interfaz. El routing es capa superior futura. |

---

## 7. CONSECUENCIAS

### Positivas

- Provider-agnostico. Cambiar de modelo no requiere reescribir engines.
- Reduce vendor lock-in (Principio I — Soberania).
- Permite naturalizar OpenAI correctamente (NAT-1).
- Prepara para DeepSeek, Claude, modelos locales.
- Mejora testability (mock `LLMProvider`, mock `EmbeddingProvider`).
- Prepara agentes y workflows para ser modelo-independientes.

### Costos

- Requiere fase de implementacion (LLM-1) para crear contratos en shared.
- Requiere adapters para cada proveedor.
- Puede requerir migrar imports existentes en `algorithmus-core-engine` y `semantic-memory`.
- `LLMGateway` actual debera adaptarse para consumir el nuevo contrato.

---

## 8. ESTRATEGIA DE IMPLEMENTACION FUTURA

### Fase: LLM-1 — Implement LLMProvider contracts

Tareas:

1. Crear `packages/shared/src/llm/` con:
   - `LLMProvider.ts` — interfaz y tipos canonicos
   - `EmbeddingProvider.ts` — interfaz separada
   - `index.ts` — exports
2. Registrar exports en `packages/shared/src/index.ts`.
3. Crear mock `InMemoryLLMProvider` para tests.
4. Crear mock `InMemoryEmbeddingProvider` para tests.
5. Escribir tests de contrato.
6. Typecheck y tests pasan.
7. Documentar en `estado-actual.md`.

### No incluye en LLM-1

- Adapter de OpenAI (eso es LLM-2 o parte de naturalizacion).
- Migracion de `LLMGateway` existente (eso es refactor posterior).
- Adapter de DeepSeek, Claude, etc.

---

## 9. CRITERIOS DE ACEPTACION PARA LLM-1

- [ ] `LLMProvider` existe en `packages/shared/src/llm/`.
- [ ] `EmbeddingProvider` existe en `packages/shared/src/llm/` (separado).
- [ ] Tipos exportados desde `@curdeeclau/shared`.
- [ ] Mock providers funcionales para tests.
- [ ] Tests de contrato pasan.
- [ ] Cero cambios en engines existentes (solo se agrega shared).
- [ ] Cero dependencias de SDKs de proveedores en shared.

---

## 10. RELACION CON PEKIN

- **Principio I (Soberania):** Los modelos son herramientas externas. CURDEECLAU no depende de ninguna.
- **Principio IV (Separacion Principio-Herramienta):** El principio es "modelo de lenguaje como servicio". La herramienta es OpenAI, DeepSeek, etc. El contrato extrae el principio.
- **Governance Level 2, Seccion 6 (Naturalizacion):** OpenAI no puede ser Naturalized sin un adapter que implemente `LLMProvider`. Este ADR crea el contrato que falta.
- **NAT-1 (ficha openai.md):** La ficha dice "requiere trabajo de ingenieria (definir LLMProvider interface)". Este ADR es ese trabajo de decision. La implementacion sigue.

---

## 11. RELACION CON RIESGOS

| Riesgo | Estado anterior | Estado posterior |
|--------|----------------|-----------------|
| R-1 (Sin LLMProvider) | P0 — Sin decision | P0 — Decidido. Pendiente LLM-1. |
| Naturalizacion OpenAI | Bloqueada (sin interfaz) | Desbloqueada. Pendiente adapter. |

---

## 12. PROXIMO PASO AUTORIZADO

**LLM-1 — Implement LLMProvider contract in shared/.** Crear interfaces, tipos y mocks. Sin tocar engines existentes.

Seguido de: **LLM-2** (OpenAI adapter) o **ADR-TOP-1** (topology ADR), segun prioridad del Senado.

---

*Fin del ADR-LLM-1 v1.0.0*
*Ratificado por la Asamblea de Pekin el 13 de junio de 2026*
