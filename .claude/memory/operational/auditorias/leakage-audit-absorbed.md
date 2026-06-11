# LEAKAGE AUDIT — ABSORBIDO

> Tipo: operational/auditorias
> Versión: 1.0.0 — Absorción Phase C
> Creado: 2026-06-11
> Fuente legacy absorbida: `docs/architecture/leakage-audit.md` (RT-1, 2026-05-18, supersedido como autoridad activa)
> Autoridad vigente: Constitución de Pekín, Principio IV (Separación Principio-Herramienta), Principio I (Soberanía de la Civilización)

---

## PROPÓSITO

Preservar el inventario de fugas de provider, verticales, orquestación y runtime detectadas en la auditoría RT-1. Estos hallazgos alimentan directamente a La Aduana (naturalización de providers) y a La Armería (catálogo y certificación de legos).

---

## RESUMEN EJECUTIVO

Auditoría completada el 2026-05-18. Se detectaron **18 hallazgos** en **6 categorías:**

| Categoría | Definición | Hallazgos |
|-----------|------------|-----------|
| Provider leakage | Código específico de provider dentro de engines | 8 (PL-1..PL-8) |
| Vertical leakage | Conocimiento de dominio dentro de engines genéricos | 3 (VL-1..VL-3) |
| Orchestration overlap | Múltiples orquestadores con mecanismos distintos | 2 (OO-1..OO-2) |
| Responsibility overlap | Dos packages implementando lo mismo de forma distinta | 2 (RO-1..RO-2) |
| App-as-package | Lógica de runtime atrapada en apps | 2 (AP-1..AP-2) |
| Runtime contamination | Código no determinista o acoplado a provider en capa de engine | 2 (RC-1..RC-2) |

---

## HALLAZGOS CRÍTICOS

### PL-1: YCloud (WhatsApp) en algorithmus-core-engine
- **Ubicación:** `packages/algorithmus/algorithmus-core-engine/src/infra/providers/ycloud/`
- **Impacto:** No se puede cambiar de provider WhatsApp sin tocar el core orchestrator
- **Fix planeado:** Extraer a `providers/whatsapp-ycloud/`, implementar `IChannel`

### PL-2: Pinecone como hard dependency en knowledge-engine
- **Ubicación:** `packages/knowledge-engine/package.json`
- **Impacto:** Cada install de knowledge-engine descarga Pinecone SDK. No se puede migrar a Qdrant sin cambios de package
- **Fix planeado:** Definir `IVectorProvider` en shared, inyectar vía DI

### PL-3: Pinecone en algorithmus-core-engine
- **Ubicación:** `packages/algorithmus/algorithmus-core-engine/src/infra/pinecone/client.ts`
- **Impacto:** RAG retrieval acoplado a la API específica de Pinecone
- **Fix planeado:** Extraer a `providers/vector-pinecone/`, inyectar vía `IVectorProvider`

### AP-1: Math engine atrapado en app quiniela
- **Ubicación:** `apps/quiniela-2026_deepclaude/src/lib/quiniela/` — 72 source files
- **Contenido:** Matrices, algoritmos, probabilidades, reducciones, contests, entitlements, comunicación, orquestador, survivor
- **Impacto:** No puede ser consumido por otras apps. Viola contrato del monorepo
- **Fix planeado:** Extraer a `packages/math/math-engine-ts/`

---

## HALLAZGOS ALTOS

| ID | Descripción | Impacto |
|----|-------------|---------|
| PL-4 | OpenAI Moderation en safety path | Safety depende de disponibilidad de API OpenAI. Mitigado: detrás de `SafetyPort`, fail-closed |
| PL-5 | Supabase legacy client post ADR-006 | Ambigüedad de persistencia dual (Supabase + PostgreSQL) |
| VL-1 | Dental schemas en knowledge-engine | No se puede usar knowledge-engine para otro vertical sin cargar schemas dentales |
| OO-1 | Dos runtimes paralelos (TypeScript engines vs 39 n8n blueprints) | Sin puente entre ambos. Blueprints no ejecutan en engine runtime |

---

## HALLAZGOS MEDIOS Y BAJOS

| ID | Descripción | Severidad | Disposición |
|----|-------------|-----------|-------------|
| PL-6 | BullMQ en core | MEDIUM | Infraestructura, no provider. Aceptable |
| PL-7 | Sentry en core | MEDIUM | Ya detrás de interfaz `Metrics`. Aceptable |
| PL-8 | Google Suite en n8n blueprints | MEDIUM | Blueprints congelados como referencia. Sin acción |
| VL-2 | Path convention implícita en knowledge loaders | MEDIUM | Formalizar como `VerticalManifest` schema |
| VL-3 | es-MX/MXN en dental vertical | LOW | Correcto — es un vertical, locale esperado aquí |
| OO-2 | Dos capas de orquestación en conversacional | MEDIUM | Separación core vs platform correcta, naming confuso |
| AP-2 | reducidas-2026 standalone HTML | LOW | Supersedido por quiniela-2026 |
| RC-1 | HardGate safety depende de OpenAI | MEDIUM | Fail-closed → unsafe. Degradación segura |
| RC-2 | LLMGateway fallback chain hardcodeada | MEDIUM | Hacer configurable vía `ILLMProvider[]` injection |

---

## Hallazgos NO conflictivos (patrón correcto)

| ID | Descripción | Veredicto |
|----|-------------|-----------|
| RO-1 | CRM entity types en shared vs ghl-engine | ✅ No es leak. Shared = canónico, GHL = específico. Patrón adapter correcto |
| RO-2 | Calendar types en shared vs calendar-engine | ✅ Modelo a seguir. Calendar-engine extiende shared correctamente |

---

## RELACIÓN CON INSTITUCIONES DE PEKÍN

| Institución | Relación |
|-------------|----------|
| **La Aduana** | Los 8 provider leakages son backlog directo de naturalización. Cada provider debe extraerse, envolverse en adapter, y registrarse en `procedural/naturalizacion/` |
| **La Armería** | AP-1 (math engine atrapado) y AP-2 (reducidas) son backlog de extracción y catalogación en Legoland |
| **La Academia** | VL-1 (dental schemas) es caso de estudio: cómo un vertical contamina un engine genérico. Alimenta el patrón de separación vertical/engine |
| **El Senado** | OO-1 (dual runtime) requiere decisión: ¿convertir blueprints n8n a definiciones de workflow-orchestrator o mantenerlos como referencia congelada? |

---

## PENDIENTES / PREGUNTAS ABIERTAS

- [ ] Priorizar extracción de providers críticos: YCloud (PL-1), Pinecone (PL-2, PL-3)
- [ ] Mover schemas dentales de knowledge-engine a `verticals/dental/schemas/` (VL-1)
- [ ] Extraer math engine de quiniela app a `packages/math/` (AP-1)
- [ ] Decidir destino de n8n blueprints (OO-1): ¿convertir o archivar?
- [ ] Formalizar `VerticalManifest` schema para path conventions (VL-2)

---

*Fin del Leakage Audit Absorbido v1.0.0*
*Absorbido de docs/architecture/leakage-audit.md (RT-1) bajo autoridad de la Constitución de Pekín*
