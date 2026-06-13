# ADR-LLM-2 — Multi-provider LLM Strategy

> Tipo: institutional/adr
> Version: 1.0.0
> Ratificado: 2026-06-13
> Autoridad: Asamblea de Pekin
> Deriva de: ADR-LLM-1, LLM-1, RISK-1
> Naturalizacion relacionada: OpenAI, OpenRouter (nueva)

---

## 1. ESTADO

**ACEPTADO / RATIFICADO**

---

## 2. CONTEXTO

ADR-LLM-1 establecio que CURDEECLAU debe tener contratos canonicos LLMProvider y EmbeddingProvider en shared/. LLM-1 implemento esos contratos con types, interfaces, errores y mocks.

La ruta natural siguiente era LLM-2: OpenAI Adapter. Pero el Senado planteo una cuestion estrategica: si el primer adapter debe ser OpenAI directo o si OpenRouter —un gateway multi-modelo que ya aparece en 15 archivos del repositorio— es una mejor primera opcion.

OpenRouter provee acceso unificado a OpenAI, DeepSeek, Anthropic/Claude, Google/Gemini, Meta/Llama y docenas de modelos via una sola API. Esto permite multi-provider desde el inicio sin implementar un adapter por cada proveedor.

---

## 3. PROBLEMA

Sin una estrategia multi-provider explicita:

1. **Vendor lock-in secuencial.** Si LLM-2 implementa solo OpenAI adapter, se difiere DeepSeek/Claude a fases futuras inciertas. Cada adapter adicional compite por prioridad.
2. **Dependencia de OpenRouter sin gobernanza.** OpenRouter ya aparece en LLMGateway (`provider: "ollama" | "openrouter" | "gemini"`), blueprints n8n, y PRD_MASTER.md. Si no se gobierna, se vuelve dependencia de facto sin decision.
3. **OpenRouter como autoridad implicita.** Sin declaracion explicita, un agente o desarrollador podria asumir que OpenRouter ES el LLMProvider, saltandose la interfaz canonica.
4. **Sin fallback.** Si OpenRouter se cae, sin un adapter directo de OpenAI o DeepSeek como fallback, el sistema queda sin capacidad LLM.

---

## 4. DECISION

La Asamblea de Pekin declara:

### Estrategia general: OpenRouter-first, not OpenRouter-only

1. **LLMProvider sigue siendo el contrato canonico interno.** Ningun gateway externo reemplaza la interfaz definida en shared.

2. **OpenRouter sera el primer adapter implementado (LLM-2).** Provee acceso multi-modelo via una sola API. Reduce la urgencia de implementar multiples adapters.

3. **OpenRouter no es autoridad institucional.** Es un adapter externo. Se consume detras de LLMProvider. Ningun engine, app o agente debe importar el SDK de OpenRouter directamente.

4. **OpenRouter no reemplaza LLMRouter futuro.** LLMRouter sera un componente interno de CURDEECLAU para seleccion de proveedor/modelo por costo, calidad, latencia, privacidad y disponibilidad. OpenRouter es un provider externo; LLMRouter es logica interna.

5. **OpenAI directo queda como adapter/fallback futuro (LLM-3).** Si OpenRouter falla o no conviene para cierto caso de uso, OpenAI directo debe estar disponible.

6. **DeepSeek directo queda como adapter/fallback futuro economico.** DeepSeek ofrece modelos competitivos a menor costo. Especialmente relevante para cargas altas.

7. **Anthropic/Claude directo queda como adapter/fallback futuro premium.** Claude ofrece capacidades diferenciadas en razonamiento extenso y seguridad.

8. **Ningun consumer debe depender directamente de OpenRouter, OpenAI, DeepSeek ni Anthropic.** Todos los consumos pasan por LLMProvider.

---

## 5. ARQUITECTURA OBJETIVO

```
apps / agents / workflows / engines
        |
        v
   LLMRouter (futuro, interno)
   - Seleccion por costo, calidad, latencia
   - Fallback automatico
   - Rate limiting, circuit breaker
        |
        v
   LLMProvider (shared/, YA EXISTE)
   - Contrato canonico
   - generate(request) => response
        |
        +-- OpenRouterAdapter (LLM-2, proximo)
        |   - Gateway multi-modelo
        |   - Acceso a OpenAI, DeepSeek, Claude, Gemini, etc.
        |
        +-- OpenAIAdapter (LLM-3, futuro)
        |   - Fallback directo
        |   - Menor latencia (sin salto extra)
        |
        +-- DeepSeekAdapter (LLM-4, futuro)
        |   - Fallback economico
        |
        +-- AnthropicAdapter (LLM-5, futuro)
            - Fallback premium
```

---

## 6. ALCANCE

### Incluye

- Estrategia multi-provider con OpenRouter como primer adapter.
- Clasificacion de OpenRouter como External AI Gateway.
- Relacion de OpenRouter con LLMProvider (detras, no en lugar de).
- Ruta de adapters futuros (OpenAI, DeepSeek, Anthropic).
- Relacion con LLMRouter futuro.

### No incluye

- Implementacion de adapters.
- Credenciales, API keys, endpoints.
- Model routing real.
- Migracion de consumidores existentes.
- Embeddings (EmbeddingProvider tiene su propia estrategia — ver ADR-LLM-1).
- Streaming, tool calling, structured outputs (diferidos a v2).

---

## 7. CONSECUENCIAS

### Positivas

- Multi-modelo desde el primer adapter. No esperar a LLM-3, LLM-4, LLM-5.
- Reduce vendor lock-in a OpenAI.
- Conserva soberania interna (LLMProvider es el contrato, no OpenRouter).
- Prepara LLMRouter futuro con multiples opciones disponibles.
- Facilita comparacion de costo/calidad/latencia entre modelos.
- OpenRouter ya esta en el vocabulario del repositorio (15 archivos).

### Costos y riesgos

- OpenRouter introduce una dependencia externa adicional (Gateway dependency).
- OpenRouter debe ser tratado como provider externo, no como autoridad.
- El adapter debe estar bien aislado para poder reemplazar OpenRouter si es necesario.
- OpenAI directo sigue siendo necesario como fallback (mayor complejidad).
- LLMRouter interno queda pendiente (sin el, la seleccion de modelo es manual).

---

## 8. CLASIFICACION DE PROVIDERS

| Provider | Tipo | Estado | Adapter | Prioridad |
|----------|------|--------|---------|-----------|
| **OpenRouter** | External AI Gateway | Allied (candidate) | LLM-2 (proximo) | Primer adapter |
| **OpenAI** | External AI Provider | Allied (candidate) | LLM-3 (futuro) | Fallback directo |
| **DeepSeek** | External AI Provider | Referenced (candidate) | LLM-4 (futuro) | Fallback economico |
| **Anthropic/Claude** | External AI Provider | Referenced (candidate) | LLM-5 (futuro) | Fallback premium |
| **LLMRouter** | Componente interno | Proposed (futuro) | N/A (es logica interna) | Post-LLM-2/3 |

---

## 9. RELACION CON NAT-1

### OpenRouter — Nueva ficha de naturalizacion

Se crea `procedural/naturalizacion/openrouter.md` con:

- Tipo: External AI Gateway / Model Gateway
- Estado: Allied / Naturalized Candidate
- Proposito: Gateway multi-modelo unificado detras de LLMProvider
- Autoridad: Ninguna. Es un provider externo.
- Regla: No debe consumirse directamente. Siempre via LLMProvider.

### OpenAI — Actualizacion de ficha existente

La ficha `openai.md` se actualiza para reflejar que:

- OpenAI puede consumirse indirectamente via OpenRouterAdapter (LLM-2).
- OpenAI puede consumirse directamente via OpenAIAdapter futuro (LLM-3).
- OpenAI ya no es necesariamente el primer adapter (LLM-2).
- OpenAI sigue siendo Allied / Naturalized Candidate.

---

## 10. RELACION CON RISK-1

El riesgo R-1 (Sin LLMProvider / OpenAI acoplado) se desglosa:

| Sub-riesgo | Descripcion | Estado |
|-----------|-------------|--------|
| R-1A | Consumidores directos de SDKs pendientes de migrar | Pendiente LLM-MIG-1 |
| R-1B | Falta adapter real detras de LLMProvider | Pendiente LLM-2 (OpenRouter) |
| R-1C | Falta LLMRouter interno | Diferido a futuro |
| R-1D | Falta estrategia de fallback multi-provider implementada | Pendiente LLM-3 (OpenAI directo) |

R-1 se mantiene en P0 hasta que LLM-2 entregue al menos un adapter funcional.

---

## 11. RUTA AUTORIZADA

| Fase | Entregable | Estado |
|------|-----------|--------|
| ADR-LLM-1 | Decision LLMProvider | CLOSED |
| LLM-1 | Contratos en shared/ | CLOSED |
| **ADR-LLM-2** | Estrategia multi-provider | **CLOSED (este ADR)** |
| LLM-2 | OpenRouterAdapter detras de LLMProvider | Pendiente |
| LLM-3 | OpenAIAdapter directo fallback | Pendiente |
| LLM-4 | DeepSeekAdapter economico | Pendiente |
| LLM-5 | AnthropicAdapter premium | Pendiente |
| LLM-MIG-1 | Migrar consumidores directos a LLMProvider | Pendiente |
| LLM-RTR-1 | LLMRouter interno v1 | Pendiente |

---

## 12. PROXIMO PASO AUTORIZADO

**LLM-2 — Implementar OpenRouterAdapter** que satisfaga `LLMProvider` de shared/. Sin tocar engines existentes. Sin migrar consumidores todavia.

---

*Fin del ADR-LLM-2 v1.0.0*
*Ratificado por la Asamblea de Pekin el 13 de junio de 2026*
