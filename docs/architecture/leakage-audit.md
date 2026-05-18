# Leakage Audit

**Phase:** RT-1
**Date:** 2026-05-18
**Status:** Audit complete — classified by severity

---

## Leakage Categories

| Category | Definition |
|---|---|
| **Provider leakage** | Provider-specific code (SDK imports, API calls, types) inside engine or orchestrator packages |
| **Vertical leakage** | Domain-specific knowledge, schemas, or config inside generic engine packages |
| **Orchestration overlap** | Multiple orchestrators doing the same thing with different mechanisms |
| **Responsibility overlap** | Two packages implementing the same capability differently |
| **App-as-package** | Runtime logic living inside an app instead of a reusable package |
| **Runtime contamination** | Non-deterministic or provider-coupled code in deterministic engine layer |

---

## PROVIDER LEAKAGE

### CRITICAL

#### PL-1: YCloud (WhatsApp) in conversational orchestrator
| Dimension | Detail |
|---|---|
| Location | `packages/algorithmus/algorithmus-core-engine/src/infra/providers/ycloud/` |
| Files | `ycloudClient.ts`, `ycloudSender.ts`, `ycloudIdempotency.ts`, `ycloudWebhookParser.ts`, `ycloudWebhookVerifier.ts`, `ycloudTypes.ts` |
| Leak type | Provider SDK code inside engine package |
| Impact | Cannot swap WhatsApp provider without touching core orchestrator |
| Fix | Extract to `providers/whatsapp-ycloud/`, implement `IChannel` |

#### PL-2: Pinecone in knowledge engine (hard dependency)
| Dimension | Detail |
|---|---|
| Location | `packages/knowledge-engine/package.json` |
| Evidence | `"@pinecone-database/pinecone": "^X.X.X"` — direct dependency |
| Leak type | Provider SDK as hard npm dependency in engine |
| Impact | Every install of knowledge-engine pulls Pinecone SDK. Cannot swap to Qdrant without package changes. |
| Fix | Define `IVectorProvider` in shared, make Pinecone a provider package, inject via DI |

#### PL-3: Pinecone in conversational core
| Dimension | Detail |
|---|---|
| Location | `packages/algorithmus/algorithmus-core-engine/src/infra/pinecone/client.ts` |
| Files | Also `src/core/rag/PineconeRAGAdapter.ts`, `src/core/embedding/pineconeDimension.ts` |
| Leak type | Provider-specific adapter in core orchestrator |
| Impact | RAG retrieval is coupled to Pinecone's specific API |
| Fix | Extract to `providers/vector-pinecone/`, inject via `IVectorProvider` |

### HIGH

#### PL-4: OpenAI Moderation in safety path
| Dimension | Detail |
|---|---|
| Location | `algorithmus-core-engine/src/infra/providers/openai/OpenAIModerationClient.ts` |
| Leak type | Provider-specific safety evaluation |
| Impact | Safety path depends on OpenAI API availability |
| Mitigation | Already behind `SafetyPort` interface — good pattern. Extract to `providers/llm-openai/`. |

#### PL-5: Supabase legacy client in conversational core
| Dimension | Detail |
|---|---|
| Location | `algorithmus-core-engine/src/core/supabase_client.ts` |
| Leak type | Legacy provider after ADR-006 migration |
| Impact | Dual persistence ambiguity (Supabase + PostgreSQL) |
| Fix | Remove per ADR-006 completion |

### MEDIUM

#### PL-6: BullMQ in conversational core
| Dimension | Detail |
|---|---|
| Location | `algorithmus-core-engine/src/infra/queue/` |
| Leak type | Queue infrastructure as direct dependency |
| Impact | Queue implementation is coupled to Redis+BullMQ |
| Mitigation | Queue is infrastructure, not a provider. Acceptable for now. Could abstract behind `IQueueProvider` in future. |

#### PL-7: Sentry in conversational core
| Dimension | Detail |
|---|---|
| Location | `algorithmus-core-engine/src/infra/observability/sentry.ts` |
| Leak type | Observability provider |
| Impact | Low — Sentry is behind a generic interface |
| Mitigation | Already behind `Metrics` interface. Acceptable. |

#### PL-8: Google Suite in n8n blueprints (NOT engine code)
| Dimension | Detail |
|---|---|
| Location | `workflows/blueprints/` — 20+ JSON files |
| Evidence | Google Calendar, Sheets, Gmail, Drive OAuth2 credential IDs |
| Leak type | Provider coupling in reference blueprints |
| Impact | Low — blueprints are frozen as reference, not runtime |
| Fix | None needed. Blueprints document the n8n legacy, not the engine future. |

---

## VERTICAL LEAKAGE

### HIGH

#### VL-1: Dental schemas in knowledge engine
| Dimension | Detail |
|---|---|
| Location | `packages/knowledge-engine/src/schemas/` |
| Files | `patient.ts` (PatientSchema), `appointment.ts` (AppointmentSchema), `procedure.ts` (ProcedureSchema), `faq.ts` (FaqSchema with dental IDs) |
| Leak type | Vertical-specific entity schemas in a supposedly generic engine |
| Impact | Cannot use knowledge-engine for real-estate or other vertical without carrying dental baggage |
| Fix | Move to `verticals/dental/schemas/`. Keep only `knowledge-chunk.ts` in engine. |

#### VL-2: Dental path convention in knowledge loaders
| Dimension | Detail |
|---|---|
| Location | `packages/knowledge-engine/src/loaders/loaders.ts` |
| Evidence | Path convention `verticals/{vertical}/knowledge/*.json` |
| Leak type | Implicit vertical convention, not formal contract |
| Impact | Medium — convention is reasonable, but no schema validates it |
| Fix | Formalize as `VerticalManifest` schema in openspec |

### LOW

#### VL-3: es-MX / MXN hardcoded in dental vertical
| Dimension | Detail |
|---|---|
| Location | `verticals/dental/config/vertical.json` |
| Evidence | `"currency": "MXN"`, `"language": "es-MX"`, `"timezone": "America/Mexico_City"` |
| Leak type | Single-locale configuration |
| Impact | Low — this IS a vertical, locale is expected here |
| Fix | No fix needed. This is correct vertical scoping. Future verticals define their own locale. |

---

## ORCHESTRATION OVERLAP

### HIGH

#### OO-1: Two parallel runtimes
| Dimension | Detail |
|---|---|
| Runtime A | Forge/Engine runtime — TypeScript engines + workflow-orchestrator |
| Runtime B | n8n blueprint runtime — 39 JSON workflow definitions with n8n execution |
| Overlap | Both define calendar booking, CRM operations, handoff, RAG, media delivery |
| Impact | No bridge between the two. Blueprints can't execute on engine runtime. |
| Fix | Future phase: convert blueprints to `workflow-orchestrator` definitions. Blueprints remain as reference docs. |

#### OO-2: Two orchestration layers in conversational runtime
| Dimension | Detail |
|---|---|
| Orchestrator A | `algorithmus-core-engine/src/core/orchestrator/Orchestrator.ts` — FSM + LLM + Validation pipeline |
| Orchestrator B | `algorithmus-platform/src/app/createPlatformOrchestrator.ts` — wraps Orchestrator A with attention layer |
| Overlap | Platform orchestrator adds thin wrapper. Separation is correct (core vs platform), but naming makes overlap confusing. |
| Fix | Renaming (conversational-core / conversational-platform) clarifies the relationship. |

---

## RESPONSIBILITY OVERLAP

### MEDIUM

#### RO-1: CRM entity types in shared vs ghl-engine
| Dimension | Detail |
|---|---|
| Shared | `@curdeeclau/shared/src/crm/` — CRMContact, CRMOpportunity, CRMPipeline, CRMCampaign |
| ghl-engine | `@curdeeclau/ghl-engine/src/types.ts` — GHLContact, GHLOpportunity, GHLPipeline, GHLAppointment |
| Overlap | Both define contact/opportunity/pipeline types |
| Verdict | NOT a leak. Shared has canonical types. GHL-engine has GHL-specific types. This is correct adapter pattern. |

#### RO-2: Calendar types in shared vs calendar-engine
| Dimension | Detail |
|---|---|
| Shared | `@curdeeclau/shared/src/calendar/` — Calendar, TimeSlot, Reservation, Reminder |
| calendar-engine | `@curdeeclau/calendar-engine/src/types.ts` — re-exports shared + adds engine-specific types |
| Overlap | Calendar-engine correctly extends shared |
| Verdict | ✅ Correct pattern. Other engines should follow this model. |

---

## APP-AS-PACKAGE

### CRITICAL

#### AP-1: Math engine trapped in quiniela app
| Dimension | Detail |
|---|---|
| Location | `apps/quiniela-2026_deepclaude/src/lib/quiniela/` |
| Size | 72 source files |
| Content | Matrices, algorithms, probabilities, reductions, contest, entitlements, communication, orchestrator, survivor |
| Impact | Cannot be consumed by other apps. Violates monorepo contract. |
| Fix | Extract to `packages/math/math-engine-ts/`. App imports via `workspace:*`. |

### LOW

#### AP-2: reducidas-2026 standalone HTML
| Dimension | Detail |
|---|---|
| Location | `apps/reducidas-2026/reducidas` |
| Content | Single HTML file, reduction calculator |
| Impact | Not a workspace package. Superseded by quiniela-2026. |
| Fix | Archive or remove. |

---

## RUNTIME CONTAMINATION

### MEDIUM

#### RC-1: HardGate safety depends on OpenAI
| Dimension | Detail |
|---|---|
| Location | `algorithmus-core-engine/src/infra/providers/openai/OpenAIModerationClient.ts` |
| Risk | If OpenAI API is down, safety evaluation fails |
| Mitigation | SafetyPort is fail-closed: error → unsafe. System degrades safely. Acceptable. |

#### RC-2: LLMGateway hardcoded fallback chain
| Dimension | Detail |
|---|---|
| Location | `algorithmus-core-engine/src/core/llm/LLMGateway.ts` |
| Evidence | Ollama → OpenRouter → Gemini chain hardcoded in gateway |
| Risk | Adding a new LLM provider requires modifying gateway code |
| Fix | Future: make fallback chain configurable via `ILLMProvider[]` injection |

---

## Summary Matrix

| ID | Category | Severity | Location | Fix Phase |
|---|---|---|---|---|
| PL-1 | Provider (YCloud) | CRITICAL | algorithmus-core-engine | RT-2 |
| PL-2 | Provider (Pinecone) | CRITICAL | knowledge-engine | RT-2 |
| PL-3 | Provider (Pinecone) | CRITICAL | algorithmus-core-engine | RT-2 |
| PL-4 | Provider (OpenAI Mod) | HIGH | algorithmus-core-engine | RT-2 |
| PL-5 | Provider (Supabase) | HIGH | algorithmus-core-engine | RT-2 |
| PL-6 | Provider (BullMQ) | MEDIUM | algorithmus-core-engine | Future |
| PL-7 | Provider (Sentry) | MEDIUM | algorithmus-core-engine | Acceptable |
| PL-8 | Provider (Google) | MEDIUM | workflows/blueprints | Frozen |
| VL-1 | Vertical (dental schemas) | HIGH | knowledge-engine | RT-1 |
| VL-2 | Vertical (path convention) | MEDIUM | knowledge-engine | RT-1 |
| VL-3 | Vertical (es-MX locale) | LOW | verticals/dental | Acceptable |
| OO-1 | Orchestration (dual runtime) | HIGH | Engines vs n8n | Future |
| OO-2 | Orchestration (dual layer) | MEDIUM | conversational-* | RT-1 (rename) |
| RO-1 | Responsibility (CRM types) | NONE | shared vs ghl-engine | Correct |
| RO-2 | Responsibility (Calendar types) | NONE | shared vs calendar | ✅ Model |
| AP-1 | App-as-package (math) | CRITICAL | quiniela-2026/lib/ | RT-1 |
| AP-2 | App-as-package (reducidas) | LOW | reducidas-2026 | RT-1 |
| RC-1 | Runtime (OpenAI safety) | MEDIUM | algorithmus-core-engine | Acceptable |
| RC-2 | Runtime (LLM chain) | MEDIUM | algorithmus-core-engine | Future |
