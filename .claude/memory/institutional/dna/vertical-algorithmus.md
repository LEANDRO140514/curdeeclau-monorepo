# DNA DE ALGORITHMUS

> Tipo: institutional/dna
> Versión: 1.0.0 — Fundacional
> Creado: 2026-06-11
> Revisado: 2026-06-11

---

## IDENTIDAD

**Nombre:** Algorithmus
**Tipo:** Vertical — Motor conversacional determinista
**Versión:** 1.x (operational)
**Ubicación:** `packages/algorithmus/algorithmus-core-engine/`

Algorithmus no es un bot. No es un canal. No es una UI.

Algorithmus es un motor determinista que recibe eventos, resuelve identidad, ejecuta FSM y decide acciones. Todo lo demás —Telegram, WhatsApp, UI— vive fuera.

Algorithmus es el cerebro conversacional de CURDEECLAU. No habla con usuarios; procesa conversaciones.

---

## MISIÓN

Procesar conversaciones multitenant de forma determinista, trazable y segura:

1. **Resolver identidad** de cada lead que entra por cualquier canal.
2. **Ejecutar FSM** como única fuente de verdad de estado conversacional.
3. **Orquestar IA** (LLM/RAG) con capa de validación (Safety, Grounding, HardGate).
4. **Garantizar** que el LLM nunca muta estado directamente.
5. **Emitir eventos canónicos** para que otros sistemas reaccionen.

---

## VISIÓN

Un motor conversacional donde:

- Cada lead tiene identidad resuelta y unificada a través de canales.
- Cada conversación tiene estado determinista gobernado por FSM.
- Cada llamada al LLM está validada, grounded y auditada.
- Cada tenant está aislado — datos, estado, configuración, límites.
- El motor sobrevive a cambios de proveedor de IA, canal de mensajería o base de datos.

---

## PRINCIPIOS OPERATIVOS

Algorithmus adhiere a los 10 Principios Constitucionales. Específicamente eleva:

| Principio | Manifestación en Algorithmus |
|-----------|------------------------------|
| V. Flujo Gobernado | FSM como única fuente de verdad de estado. Cada transición es explícita, trazable y auditable. |
| IV. Separación Principio-Herramienta | OpenAI, Pinecone, YCloud están detrás de interfaces. El motor no importa SDKs directamente en su núcleo. |
| VI. Decisión Informada | Cada respuesta del LLM pasa por Safety → Grounding → HardGate antes de ser aceptada. |
| VII. Fallo Visible | Errores de IA, timeouts, respuestas inválidas se loguean estructuradamente. Nada falla en silencio. |

---

## ARQUITECTURA

### Flujo Principal

```
1. Mensaje inbound (WhatsApp/Telegram/Web)
2. IdentityManager resuelve/crea lead (multicanal, ADR-007)
3. Job encolado → Worker procesa (BullMQ + Redis)
4. FSMEngine evalúa estado actual y acción requerida
5. Orchestrator ejecuta pipeline IA:
   a. LLM generate → Safety check
   b. RAG retrieval → Grounding verification
   c. HardGate → approve/reject/rewrite
6. Estado FSM persistido (PostgreSQL via LeadsRepository)
7. Respuesta outbound emitida
```

### Componentes Nucleares

| Componente | Responsabilidad |
|------------|----------------|
| `IdentityManager` | Resolución y unificación de identidad multicanal |
| `FSMEngine` | Máquina de estados determinista — fuente única de verdad |
| `Orchestrator` | Pipeline IA con capa de validación en 3 etapas |
| `LeadsRepository` | Boundary único de base de datos para el core |
| `WhatsAppWorker` | Procesamiento asíncrono vía BullMQ + YCloud |

### Reglas No Negociables

- **FSM es única fuente de verdad de estado.** Ningún otro componente puede decidir estado.
- **LeadsRepository es boundary único de DB.** Ningún otro componente accede directamente a PostgreSQL.
- **Todo acceso de negocio es tenant-scoped.** No hay queries sin tenant.
- **El LLM no muta estado directamente.** El pipeline IA sugiere; la FSM decide.

---

## PERSISTENCIA

| Storage | Uso |
|---------|-----|
| PostgreSQL | Principal — leads, estado FSM, datos conversacionales |
| Redis | Control de concurrencia (locks), BullMQ queues |
| Pinecone | Vector store para RAG (embeddings de conocimiento) |
| Supabase | Legacy-only — solo `webhooks/ghl/route.ts`. No es parte del path principal. |

---

## ESTADO ACTUAL

- **Fase:** Producción (v1.x)
- **ADR-006:** Migración completada de Supabase a PostgreSQL directo
- **ADR-007:** Identidad multicanal en progreso
- **Deuda técnica:** GHL webhook legacy persiste en Supabase hasta limpieza final

---

## DEPENDENCIAS EXTERNAS NATURALIZADAS

| Proveedor | Propósito | Interfaz |
|-----------|-----------|----------|
| OpenAI | Generación de texto, embeddings | Detrás de Orchestrator |
| Pinecone | Vector store para RAG | Detrás de capa de retrieval |
| YCloud | API de WhatsApp Business | Detrás de WhatsAppWorker |
| BullMQ + Redis | Colas de procesamiento asíncrono | Directo (infraestructura) |

---

## MÉTRICAS CLAVE

- Tiempo de respuesta end-to-end (inbound → outbound)
- Tasa de validación HardGate (approve/reject/rewrite)
- Precisión de resolución de identidad multicanal
- Throughput de worker WhatsApp (jobs/min)

---

## NO NEGOCIABLE

- FSM como fuente única de verdad de estado.
- LeadsRepository como boundary único de base de datos.
- Tenant-scoping en todo acceso de negocio.
- LLM no muta estado — la FSM decide.
- Toda llamada externa debe tener catch-block con log estructurado.

---

*Fin del DNA de Algorithmus v1.0.0*
