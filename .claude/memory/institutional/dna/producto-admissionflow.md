# DNA DE ADMISSIONFLOW

> Tipo: institutional/dna
> Versión: 1.0.0 — Fundacional
> Creado: 2026-06-11
> Revisado: 2026-06-11

---

## IDENTIDAD

**Nombre:** AdmissionFlow
**Tipo:** Producto — Sistema conversacional de captura de leads de admisión universitaria
**Versión:** 1.0.0 (operational)
**Vertical:** UV-1 (ver `vertical-uv1.md`)
**Ubicación:** `packages/engines/telegram-provider/src/AdmissionFlow.ts`

AdmissionFlow es el producto concreto que materializa el vertical UV-1. Es el sistema que una universidad despliega para recibir prospectos por Telegram, guiarlos por un flujo conversacional de captura de datos, y sincronizarlos automáticamente con su CRM.

AdmissionFlow no es el bot. No es el CRM. Es el puente conversacional entre el prospecto y la universidad.

---

## MISIÓN

Convertir mensajes de Telegram en leads universitarios calificados:

1. **Recibir prospectos** que escriben por Telegram a la universidad.
2. **Guiar conversación** paso a paso: Nombre → Teléfono → Carrera → Email → Campus.
3. **Calificar leads** en tiempo real: PROVISIONAL (nombre) → CAPTURADO (nombre + teléfono).
4. **Sincronizar con GHL** al instante de capturar teléfono.
5. **Persistir en PostgreSQL** para que ningún lead se pierda entre reinicios.
6. **Emitir DomainEvents** para que otros sistemas reaccionen (notificaciones, analytics, asignación de asesor).

---

## VISIÓN

Un admission system donde:

- La universidad configura sus carreras, campus y mensajes de bienvenida.
- Los prospectos conversan naturalmente, sin sentir que llenan un formulario.
- Cada lead llega al CRM con datos estructurados y trazabilidad de origen.
- Los asesores humanos reciben leads calificados, no mensajes crudos.
- El sistema escala a múltiples canales (Telegram → WhatsApp → Web) sin reescribir la lógica de captura.

---

## PERFILES INSTITUCIONALES

Por el Principio III (Identidad antes que Existencia), AdmissionFlow declara sus 6 perfiles:

### Memory Profile
- **Tipo:** Session-scoped con persistencia PostgreSQL
- **Qué recuerda:** Estado FSM de cada chat activo (step, campos capturados)
- **Cuándo olvida:** Sessions in-memory expiran al reiniciar proceso (pendiente: expiry explícito)
- **No recuerda:** Historial de conversaciones (responsabilidad del CRM)

### Flow Profile
- **Canal:** Telegram (Webhook + Polling)
- **Eventos emitidos:** `TelegramMessageReceived` con metadata de admisión
- **Compuertas:** FSM de 6 pasos con transiciones deterministas
- **Nivel de autonomía:** Semi-automático — captura autónoma, handoff manual a asesor al completar

### Control Profile
- **Decisiones automatizadas:** Avance de paso FSM, clasificación LEAD_PROVISIONAL/CAPTURADO
- **Decisiones humanas:** Asignación de asesor post-captura
- **Escalaciones:** Error de persistencia → log estructurado, Error GHL sync → log + continue

### Agent Profile
- **Agentes involucrados:** AdmissionFlow (FSM), TelegramProvider (canal), GHLSyncService (CRM)
- **Harness:** TelegramProvider encapsula AdmissionFlow — solo el provider accede al bot y a la red

### Support Profile
- **Incidentes esperados:** GHL API down, PostgreSQL connection lost, Telegram rate limiting
- **Mitigación:** GHL sync es fault-tolerant (error → log → continue), PostgreSQL con fallback a InMemory
- **Monitoreo:** Structured JSON logs por cada mensaje procesado

### Observability Profile
- **Métricas:** Tasa de abandono por paso, conversión /start→COMPLETED, errores GHL sync
- **Logs:** JSON estructurado con lead_id, admission_step, lead_state, field_captured, is_complete
- **Alertas:** Error rate de GHL sync > threshold

---

## FLUJO DE PRODUCTO

```
Usuario escribe "Hola" a @UniversidadBot
  ↓
Bot: "¡Bienvenido al proceso de admisión! ¿Cuál es tu nombre completo?"
  ↓ Usuario: "María García López"
Bot: "Gracias, María. ¿Cuál es tu número de teléfono?"
  ↓ [LEAD_PROVISIONAL → persistido]
Usuario: "5551234567"
  ↓ [LEAD_CAPTURADO → sync GHL + PostgreSQL]
Bot: "¿Qué carrera te interesa estudiar?"
  ↓ Usuario: "Medicina"
Bot: "¿Cuál es tu correo electrónico? (responde 'saltar' para omitir)"
  ↓ Usuario: "maria@email.com"
Bot: "¿En qué campus te gustaría estudiar? (responde 'saltar' para omitir)"
  ↓ Usuario: "saltar"
Bot: "¡Listo! Tus datos han sido registrados:
      • Nombre: María García López
      • Teléfono: 5551234567
      • Carrera: Medicina
      • Email: maria@email.com
      • Campus: No proporcionado

      Un asesor se pondrá en contacto contigo pronto."
  ↓ [COMPLETED]
```

---

## CONFIGURACIÓN DE UNIVERSIDAD

AdmissionFlow está diseñado para ser configurable por universidad:

| Elemento configurable | Actual | Futuro |
|----------------------|--------|--------|
| Mensaje de bienvenida | Hardcoded | Configurable por tenant |
| Campos requeridos | Nombre, Teléfono | Configurable (ej. agregar "Edad", "Bachillerato") |
| Campos opcionales | Email, Campus | Configurable |
| Catálogo de carreras | Texto libre | Validación contra catálogo |
| Catálogo de campus | Texto libre | Validación contra catálogo |
| CRM destino | GHL | Provider pattern (GHL, Salesforce, HubSpot) |

---

## ESTADO ACTUAL

- **Fase:** v1.0.0 producción (UV-1)
- **Canal:** Telegram (operational) ✅
- **Persistencia:** PostgreSQL + fallback InMemory ✅
- **CRM Sync:** GHL (opcional, fault-tolerant) ✅
- **DomainEvents:** Emisión canónica a WorkflowOrchestrator ✅
- **Pendiente:** Multi-tenancy (configuración por universidad)
- **Pendiente:** Catálogos validados de carreras y campus
- **Pendiente:** Session expiry (memoria infinita actual)
- **Pendiente:** WhatsApp channel (reutilizando patrón TelegramProvider)
- **Pendiente:** Web channel (widget embebible)

---

## DEPENDENCIAS

| Dependencia | Rol |
|-------------|-----|
| UV-1 (AdmissionFlow vertical) | Motor FSM conversacional |
| TelegramProvider | Canal de entrada |
| LeadStore | Resolución de identidad |
| GHLSyncService | Sincronización CRM |
| PostgresCRMProvider | Persistencia |
| WorkflowOrchestrator | Orquestación post-captura |
| `@curdeeclau/shared` | DomainEvents |

---

## MÉTRICAS DE PRODUCTO

- Leads capturados por día/semana/mes
- Tasa de abandono por paso (dónde se pierden los prospectos)
- Tasa de conversión /start → COMPLETED
- Tiempo promedio de captura completa
- % de leads con email capturado
- % de leads con campus especificado
- Errores GHL sync / total syncs
- Leads duplicados detectados por LeadStore

---

## NO NEGOCIABLE

- La conversación es guiada, no libre — la FSM determina el flujo.
- LEAD_CAPTURADO solo se alcanza con nombre + teléfono.
- GHL sync es opcional — el producto no depende del CRM para funcionar.
- Los datos del prospecto nunca se comparten con terceros.
- `/start` siempre resetea la conversación a cero.

---

*Fin del DNA de AdmissionFlow v1.0.0*
