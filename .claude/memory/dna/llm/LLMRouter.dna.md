# LLMRouter — DNA

> Tipo: dna/llm
> Version: 1.0.0
> Creado: 2026-06-14
> Autoridad: ADR-LLM-2
> Ubicacion: `packages/algorithmus/algorithmus-core-engine/src/core/llm/LLMRouter.ts`

---

## 1. NOMBRE

**LLMRouter** — Internal LLM Provider Router v1

---

## 2. TIPO

Internal Component / Provider-Agnostic Routing Layer

LLMRouter es la autoridad interna de seleccion de providers. No es un provider externo. No es un adapter. Es la capa que decide QUE adapter usar para cada request.

---

## 3. CANAL / PLATAFORMA EXTERNA RELACIONADA

**Ninguna.** LLMRouter no se comunica con ninguna API externa. Opera exclusivamente sobre instancias de `LLMProvider` inyectadas. No conoce detalles de OpenRouter, OpenAI, DeepSeek ni Anthropic.

---

## 4. ESTADO INSTITUCIONAL

- [x] **Active** — Implementado (LLM-RTR-1). 28 tests pasan con mock providers. Sin llamadas reales.
- [ ] Canonical
- [ ] Superseded
- [ ] Deprecated
- [ ] Allied — No aplica. LLMRouter no es un provider externo.
- [ ] Naturalized — No aplica. Es un componente interno, no un provider externo.

---

## 5. PROPOSITO

Seleccionar un `LLMProvider` registrado segun una estrategia simple de uso (default, cheap, premium, reasoning, specificProvider), sin acoplar consumers a vendors especificos. LLMRouter es la autoridad interna de seleccion multi-provider.

---

## 6. RESPONSABILIDAD PRINCIPAL

Enrutar cada `LLMRequest` al `LLMProvider` adecuado segun la estrategia configurada, con fallback automatico en errores retryable, y metadata de trazabilidad (selectedProviderId, fallbackUsed, attemptedProviders).

---

## 7. RESPONSABILIDADES EXPLICITAMENTE EXCLUIDAS

1. **NO es un provider externo.** No implementa `LLMProvider` directamente. Enruta a providers registrados.
2. **NO reemplaza `LLMProvider`.** El contrato canonico sigue siendo la unica interfaz que los consumidores deben conocer.
3. **NO reemplaza adapters.** Los adapters (OpenRouter, OpenAI, DeepSeek, Anthropic) siguen siendo las implementaciones concretas.
4. **NO ejecuta APIs directamente.** No tiene HTTP client, no conoce endpoints, no maneja API keys.
5. **NO implementa scoring dinamico de costo/calidad.** Diferido a v2.
6. **NO implementa observabilidad de costos.** Diferido a LLM-OBS-1.
7. **NO implementa circuit breaker.** Diferido a v2.
8. **NO implementa rate limiting.** Diferido a v2.
9. **NO implementa streaming, tool calling ni structured outputs.** Diferido a v2 del contrato.
10. **NO enruta embeddings.** `EmbeddingProvider` es contrato separado.
11. **NO migra consumidores.** LLM-MIG-1 es tarea separada.
12. **NO lee variables de entorno.** Toda configuracion es inyectada.

---

## 8. PROVIDER EXTERNO RELACIONADO

**Ninguno.** LLMRouter es un componente puramente interno. No tiene dependencia de ningun proveedor externo.

---

## 9. CONTRATO IMPLEMENTADO

LLMRouter no implementa `LLMProvider`. Opera SOBRE instancias de `LLMProvider` inyectadas.

```typescript
class LLMRouter {
  register(provider: LLMProvider): void;
  registerAll(providers: LLMProvider[]): void;
  generate(request: LLMRequest, options?: LLMRouterOptions): Promise<LLMResponse & { routerMetadata: LLMRouterMetadata }>;
}
```

---

## 10. CONFIGURACION

```typescript
type LLMRouterConfig = {
  strategyDefaults?: Partial<Record<LLMRouterStrategy, string[]>>;
  logger?: Logger;
};
```

### Estrategias de ruteo v1

| Estrategia | ProviderIds preferidos | Caso de uso |
|-----------|----------------------|-------------|
| `default` | openrouter, openai, deepseek, anthropic | Uso general, OpenRouter-first |
| `cheap` | deepseek, openrouter, openai, anthropic | Cargas altas, costo optimizado |
| `premium` | anthropic, openai, openrouter, deepseek | Tareas que requieren maxima calidad |
| `reasoning` | anthropic, openai, openrouter, deepseek | Razonamiento complejo |
| `specificProvider` | ProviderId explicito | Seleccion directa por providerId |

### Opciones de ruteo

```typescript
type LLMRouterOptions = {
  strategy?: LLMRouterStrategy;     // default: 'default'
  providerId?: string;              // Requerido si strategy es 'specificProvider'
  enableFallback?: boolean;         // default: true
  fallbackSequence?: string[];      // Secuencia personalizada (sobreescribe strategy defaults)
};
```

---

## 11. INPUTS

| Input | Origen | Sensibilidad | Formato |
|-------|--------|-------------|---------|
| `LLMRequest` | Consumidor (engine, agente) | Alto — puede contener datos de usuario | `LLMRequest` canonico |
| `LLMRouterOptions` | Consumidor | Bajo | `{ strategy?, providerId?, ... }` |
| Providers registrados | Inyectados en constructor/register | N/A — mock en tests | `LLMProvider[]` |

---

## 12. OUTPUTS

| Output | Destino | Sensibilidad | Evento asociado |
|--------|---------|-------------|-----------------|
| `LLMResponse & { routerMetadata }` | Consumidor | Medio | Ninguno (v1) |
| `routerMetadata.selectedProviderId` | Consumidor / logs | Bajo | Identifica el provider que respondio |
| `routerMetadata.fallbackUsed` | Consumidor / logs | Bajo | Indica si hubo fallback |
| `routerMetadata.attemptedProviders` | Consumidor / logs | Bajo | Traza de providers intentados |
| `LLMRouterError` | Consumidor | Medio | Todos los providers agotados |

---

## 13. INVARIANTES

1. **MUST:** Toda seleccion de provider debe pasar por LLMRouter (cuando este activo).
2. **MUST NOT:** LLMRouter no debe conocer detalles internos de ningun adapter.
3. **MUST:** Providers deben ser inyectados. LLMRouter no instancia adapters.
4. **MUST:** Errores de provider deben conservarse como `LLMProviderError` dentro de `LLMRouterError`.
5. **MUST:** `routerMetadata` debe incluir `selectedProviderId`, `fallbackUsed`, `attemptedProviders`, `strategy`.
6. **SHALL:** Fallback solo procede si el error es retryable (o si se fuerza explicitamente).
7. **SHALL:** Si `enableFallback: false`, la cadena se detiene en el primer error.
8. **SHALL:** Providers no registrados se saltan silenciosamente en la cadena de estrategia.
9. **SHALL NOT:** LLMRouter no debe leer variables de entorno.
10. **SHALL NOT:** LLMRouter no debe gestionar API keys ni credenciales.

---

## 14. RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Seleccion incorrecta de provider para la tarea | Media | Medio | Las estrategias son defaults razonables. Consumers pueden sobreescribir con `strategy` o `providerId`. |
| Fallback infinito si todos los providers fallan como retryable | Baja | Bajo | La cadena se agota cuando todos los providers registrados fallan. `LLMRouterError` se lanza con `attemptedProviders`. |
| Acoplamiento de consumers a LLMRouter en vez de LLMProvider | Media | Bajo | LLMRouter devuelve `LLMResponse` canonico enriquecido. Los consumers que solo necesitan `LLMResponse` pueden ignorar `routerMetadata`. |

---

## 15. EVIDENCIA DE TESTS

| Tipo | Cantidad | Estado |
|------|----------|--------|
| Tests unitarios (mock providers) | 28 | Todos pasan |
| Tests con adapters reales | 0 | Sin llamadas reales |
| Tests de integracion | 0 | Sin entorno configurado |

### Cobertura de tests (`LLMRouter.spec.ts`)

| Grupo | Tests | Que valida |
|-------|-------|------------|
| Registration | 5 | register, registerAll, reemplazo, rechazo sin providerId, rechazo sin generate |
| Strategy routing | 8 | default, specificProvider, cheap, premium, reasoning, provider no registrado, specificProvider sin providerId, salto de provider no registrado |
| Fallback | 6 | error retryable → fallback, error no retryable → stop, sin fallback → error, attemptedProviders, fallback sequence personalizada, enableFallback: false |
| Metadata | 2 | routerMetadata completo, providerMetadata original preservado |
| Safety constraints | 7 | sin API keys, sin llamadas externas, mock providers, LLMRouterError, listProviders vacio, isRegistered false, tolerancia provider no registrado en cadena |

---

## 16. SEGURIDAD Y CREDENCIALES

LLMRouter no maneja credenciales. No tiene acceso a API keys, tokens ni secrets. Los providers inyectados son responsables de su propia autenticacion.

---

## 17. FALLBACK / CONTINGENCIA

Si LLMRouter falla (todos los providers agotados):

- **Comportamiento esperado:** Lanza `LLMRouterError` con `attemptedProviders`, `strategy` y `lastError`.
- **Fallback inmediato:** El consumidor puede reintentar con otra estrategia o providerId explicito.
- **No hay fallback automatico externo al router.** El consumidor decide la politica de reintento.

---

## 18. RELACION CON ADR-LLM-2

ADR-LLM-2 establecio que:

- OpenRouter es gateway, no autoridad de seleccion.
- LLMRouter es la autoridad interna de seleccion.
- La seleccion de modelo no debe vivir dentro de OpenRouter.
- LLMRouter implementa el principio "OpenRouter-first, not OpenRouter-only" mediante estrategias configurable.

LLM-RTR-1 implementa la primera version del router previsto en ADR-LLM-2.

---

## 19. ARQUITECTURA ACTUALIZADA

```
apps / agents / workflows / engines
        |
        v
   LLMRouter (IMPLEMENTADO, LLM-RTR-1)
   - Seleccion por estrategia simple
   - Fallback retryable
   - Provider-agnostic metadata
   - routerMetadata en cada respuesta
        |
        v
   LLMProvider (shared/, IMPLEMENTADO)
   - Contrato canonico
   - generate(request) => response
        |
        +-- OpenRouterAdapter (LLM-2)
        +-- OpenAIAdapter (LLM-3)
        +-- DeepSeekAdapter (LLM-4)
        +-- AnthropicAdapter (LLM-5)
```

---

## 20. COMO REGENERARLO

Si `LLMRouter.ts` se pierde:

1. Leer este DNA.
2. Leer `LLMProvider.dna.md` (contrato que envuelve).
3. Leer ADR-LLM-2 (estrategia multi-provider).
4. Recrear `LLMRouter` con:
   - `Map<string, LLMProvider>` para providers registrados.
   - `register(provider)` y `registerAll(providers)`.
   - `generate(request, options)` → seleccion por estrategia → fallback retryable.
   - `routerMetadata` en la respuesta con `selectedProviderId`, `fallbackUsed`, `attemptedProviders`, `strategy`.
   - `LLMRouterError` cuando todos los providers se agotan.
   - 5 estrategias: default, cheap, premium, reasoning, specificProvider.
5. Ejecutar `LLMRouter.spec.ts` — debe pasar 28/28 con mock providers.

---

## 21. PROXIMO PASO AUTORIZADO

**LLM-MIG-1 — Migration de consumidores** a LLMProvider/LLMRouter. O **LLM-OBS-1 — Observabilidad de costos** para operacion real.

---

*Fin del LLMRouter DNA v1.0.0*
