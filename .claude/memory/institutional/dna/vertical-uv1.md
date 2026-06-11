# DNA DE UV-1 (ADMISSIONFLOW VERTICAL)

> Tipo: institutional/dna
> Versión: 1.0.0 — Fundacional
> Creado: 2026-06-11
> Revisado: 2026-06-11

---

## IDENTIDAD

**Nombre:** UV-1 — AdmissionFlow Vertical
**Tipo:** Vertical — Captura conversacional de leads de admisión universitaria
**Versión:** 1.0.0 (operational)
**Ubicación:** `packages/engines/telegram-provider/src/AdmissionFlow.ts`

UV-1 es el vertical de captura de leads de admisión mediante flujo conversacional. Un prospecto escribe a la universidad por Telegram, y el AdmissionFlow lo guía paso a paso — nombre, teléfono, carrera, email, campus — hasta completar su registro.

UV-1 no es un CRM. No es una base de datos de estudiantes. Es el primer punto de contacto entre la universidad y el prospecto.

---

## MISIÓN

Convertir prospectos en leads calificados mediante conversación guiada:

1. **Iniciar conversación** con saludo amigable y profesional.
2. **Capturar datos progresivamente:** Nombre → Teléfono → Carrera → Email? → Campus?
3. **Clasificar leads:** LEAD_PROVISIONAL (nombre) → LEAD_CAPTURADO (nombre + teléfono).
4. **Sincronizar con CRM** (GHL) al alcanzar LEAD_CAPTURADO.
5. **Persistir en PostgreSQL** para supervivencia cross-session.

---

## VISIÓN

Un sistema de admisión donde:

- La universidad recibe leads estructurados sin intervención humana inicial.
- Cada lead tiene identidad resuelta y trazabilidad de origen.
- La conversación es natural — el prospecto no siente que llena un formulario.
- Los datos se sincronizan en tiempo real con el CRM de la universidad.
- El sistema funciona 24/7 en Telegram, y es extensible a WhatsApp y Web.

---

## PRINCIPIOS OPERATIVOS

| Principio Constitucional | Manifestación en UV-1 |
|--------------------------|------------------------|
| V. Flujo Gobernado | FSM determinista de 6 pasos. Cada transición es explícita. Sin ambigüedad de estado. |
| III. Identidad antes que Existencia | Cada lead tiene estado explícito (PROVISIONAL/CAPTURADO) y trazabilidad completa. |
| I. Soberanía | GHL es reemplazable vía GHLSyncService. El AdmissionFlow no depende de GHL. |
| VII. Fallo Visible | Errores de persistencia y sync se loguean estructuradamente. El usuario no ve fallos. |

---

## ARQUITECTURA

### Flujo de Conversación

```
/start → "¿Cuál es tu nombre completo?"
   ↓ (name)
"Gracias, {name}. ¿Cuál es tu número de teléfono?"
   ↓ (phone) → LEAD_CAPTURADO → sync PostgreSQL + GHL
"¿Qué carrera te interesa estudiar?"
   ↓ (career)
"¿Cuál es tu correo electrónico? (Opcional)"
   ↓ (email | "saltar")
"¿En qué campus te gustaría estudiar? (Opcional)"
   ↓ (campus | "saltar")
"¡Listo! Tus datos han sido registrados..."
   → COMPLETED
```

### Estados de Lead

| Estado | Trigger | Significado |
|--------|---------|-------------|
| `LEAD_PROVISIONAL` | Nombre capturado | Lead inició el proceso pero no ha dado teléfono |
| `LEAD_CAPTURADO` | Nombre + teléfono capturados | Lead calificado — dispara persistencia y sync |

### Pasos de la FSM

| Paso | Campo | Validación |
|------|-------|------------|
| `AWAITING_NAME` | name | Texto libre |
| `AWAITING_PHONE` | phone | Texto libre (el Caller lo valida) |
| `AWAITING_CAREER` | career | Texto libre |
| `AWAITING_EMAIL` | email | Opcional ("saltar" para omitir) |
| `AWAITING_CAMPUS` | campus | Opcional ("saltar" para omitir) |
| `COMPLETED` | — | Terminal — responde con resumen |

### Stack de Integración

```
Telegram Message
  → TelegramProvider (polling)
    → LeadStore.identify() (PostgreSQL)
    → AdmissionFlow.handleMessage()
      → send reply to user
      → persist lead state transitions
      → GHLSyncService.syncToGHL() (LEAD_CAPTURADO)
      → emit DomainEvent (TelegramMessageReceived)
    → WorkflowOrchestrator.dispatch()
```

---

## COMPONENTES

| Componente | Responsabilidad |
|------------|----------------|
| `AdmissionFlow` | FSM conversacional in-memory. Pura — no sabe de persistencia ni canales. |
| `TelegramProvider` | Polling de Telegram, integración AdmissionFlow + LeadStore + GHL. |
| `LeadStore` | Resolución de identidad de lead (canal → ID). |
| `GHLSyncService` | Sincronización idempotente con GoHighLevel CRM. |
| `PostgresCRMProvider` | Persistencia de leads en PostgreSQL (BV-2). |

---

## ESTADO ACTUAL

- **Fase:** Producción (UV-1 operational)
- **BV-1.01:** Structured logging + DomainEvent emission ✅
- **BV-1.02:** Lead identification on every inbound message ✅
- **BV-1.03:** GHL sync on every inbound message (idempotent) ✅
- **BV-2:** PostgreSQL persistence con fallback a InMemory ✅
- **Pendiente:** Session expiry / cleanup (sessions in-memory no expiran)
- **Pendiente:** Multi-tenant isolation (un solo tenant por instancia)
- **Pendiente:** Extensión a WhatsApp y Web

---

## DEPENDENCIAS

| Paquete | Uso |
|---------|-----|
| `@curdeeclau/shared` | DomainEvent, RuntimeEventDispatcher |
| `@curdeeclau/workflow-orchestrator` | Orquestación de eventos post-captura |
| `@curdeeclau/ghl-engine` | Cliente de API GoHighLevel |
| `node-telegram-bot-api` | Polling de Telegram Bot API |
| `pg` (PostgreSQL) | Persistencia de leads |

---

## MÉTRICAS CLAVE

- Tasa de abandono por paso (dónde se van los prospectos)
- Tasa de conversión: /start → COMPLETED
- Tiempo promedio hasta LEAD_CAPTURADO
- Tasa de error en sync GHL
- Volumen de leads capturados por día/canal

---

## NO NEGOCIABLE

- AdmissionFlow es puro — no sabe de persistencia, canales ni CRMs externos.
- La FSM es determinista. Cada input tiene exactamente una transición definida.
- GHL es opcional. Si las credenciales no existen, el sistema opera sin sync.
- Los datos del lead se persisten al alcanzar LEAD_CAPTURADO, no antes.
- `/start` resetea la conversación — fresh start garantizado.

---

## RELACIÓN CON PRODUCTO ADMISSIONFLOW

UV-1 es el **vertical** (infraestructura conversacional genérica para admisiones).
AdmissionFlow es el **producto** (instancia concreta para una universidad específica, con sus carreras, campus y branding).

Ver `producto-admissionflow.md` para el DNA del producto.

---

*Fin del DNA de UV-1 v1.0.0*
