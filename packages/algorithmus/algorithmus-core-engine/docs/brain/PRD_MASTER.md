PRD: Algorithmus Core Engine (v2.0 — Engineering Spec)
type: prd
status: active

project: algorithmus-core-engine

stack: [node, typescript, postgres, redis, docker]

ai_tracking: created_by: leandro_espinosa

reviewed_by: system

last_sync: 2026-04-05

0. PROPÓSITO DEL SISTEMA
   Algorithmus Core Engine es un orquestador stateful AI-driven multitenant, diseñado para:

Procesar interacciones entrantes (chat, voz, email).

Mantener estado conversacional determinístico (FSM).

Delegar generación de lenguaje a LLMs bajo control.

Ejecutar acciones (reply, booking, escalation).

Garantizar consistencia bajo concurrencia.

1. ARQUITECTURA BASE
   1.1 Estilo Arquitectónico
   Modular Monolith + Event Bus (Redis).

Modularidad: Boundaries por dominio (core, modules, infra).

Comunicación interna: Event-driven (no llamadas directas entre módulos).

Estado: Persistido en PostgreSQL (direct connection, Supabase removed from core runtime).

Coordinación: Redis (locks + events).

Escalabilidad: Horizontal por contenedor.

1.2 Event Bus Interno
Todos los módulos se comunican mediante eventos tipados: message.received, lead.resolved, fsm.transition, llm.completed, action.executed, error.occurred.
Regla: Ningún módulo puede invocar otro directamente; todo pasa por el bus.

2. MULTITENANCY
   2.1 Aislamiento obligatorio
   Cada operación debe incluir un tenant_id: string.

DB: Row-level isolation por tenant_id.

Redis: Namespacing (tenant:{id}:\*).

LLM Config: API keys por tenant.

RAG: Índices separados por tenant.

3. GESTIÓN DE IDENTIDAD (SSOT)
   3.1 Flujo de Identidad
   Lookup en Postgres (indexado).

Si no existe → fallback async a GHL.

Normalización de datos y Upsert atómico.

Emitir evento: lead.resolved.

3.2 Esquema Core (Leads)
id UUID PK, tenant_id UUID, phone_number TEXT UNIQUE.

first_name, email, tags JSONB, fsm_state TEXT.

ai_confidence_score FLOAT, last_interaction TIMESTAMP.

4. CONTROL DE CONCURRENCIA
   4.1 Lock por Lead
   Mecanismo: Redis SET NX EX.

Key: lock:lead:{lead_id} | TTL: 5s.

Reglas: Si el lock existe, realizar retry con backoff (máximo 3 intentos); si falla, descartar evento duplicado.

5. FSM (FINITE STATE MACHINE)
   Principio: La FSM es el único componente autorizado a mutar estado.

Regla Crítica: El LLM NO decide el estado; solo propone datos.

Estados: INIT, QUALIFYING, SUPPORT_RAG, BOOKING, HUMAN_HANDOVER.

6. LLM GATEWAY (FALLBACK)
   Nivel 1 (Ollama): Local (VPS dedicado), prioridad costo/privacidad.

Nivel 2 (OpenRouter): Resiliencia (Claude 3.5/GPT-4o).

Nivel 3 (Gemini): Seguridad y redundancia final.

Lógica: Si timeout > 5000ms o error, disparar fallback al siguiente nivel.

7. PIPELINE DE PROCESAMIENTO (CORE LOOP)
   message.received -> 2. identity.resolve -> 3. acquire lock (Redis) -> 4. FSM.evaluate -> 5. LLM.generate -> 6. FSM.validate + transition -> 7. action.execute -> 8. log.persist -> 9. release lock.

8. SEGURIDAD (THE CAGE)
   Límites Docker: API (3.2 vCPU / 8GB RAM), Postgres (2 vCPU / 8GB RAM), Redis (1 vCPU / 4GB RAM).

9. REGLAS NO NEGOCIABLES
   FSM es la única fuente de estado.

LLM nunca muta estado directamente.

Todo evento pasa por el bus.

Locks obligatorios por lead para prevenir race conditions.

Multitenancy enforced en cada capa.
