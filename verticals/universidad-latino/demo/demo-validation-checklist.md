# Demo Validation Checklist

> Tipo: vertical/demo
> Version: 1.0.0
> Creado: 2026-06-14

---

Usar este checklist antes de cada presentacion de la demo para verificar que todo funciona correctamente.

## Modo controlado (mock)

### Asistente — comportamiento conversacional

- [ ] El asistente saluda presentandose como "asistente virtual de admisiones de Universidad Latino".
- [ ] El asistente NO se presenta como "IA", "bot" o "chatbot".
- [ ] El asistente responde preguntas frecuentes del FAQ sin inventar.
- [ ] Si el prospecto pregunta por una carrera fuera del catalogo, el asistente NO inventa.
- [ ] El asistente informa que un asesor confirmara la disponibilidad y sugiere carreras del catalogo.
- [ ] El asistente solicita datos uno por uno, no todos al mismo tiempo.
- [ ] El asistente recolecta los 5 campos requeridos (nombre, telefono, carrera, horario, canal).
- [ ] El asistente confirma los datos con el usuario antes de capturar.
- [ ] El asistente produce un mensaje final claro y profesional.
- [ ] El asistente NO menciona GHL, CRM, bases de datos ni terminos tecnicos.
- [ ] El mensaje final incluye que un asesor dara seguimiento.

### Captura de lead

- [ ] LeadCaptureService es invocado con payload valido.
- [ ] El payload contiene los 5 campos requeridos.
- [ ] El telefono esta en formato E.164 (+521234567890).
- [ ] El tenantId es correcto (tenant-uv-demo).
- [ ] La respuesta de LeadCaptureService se procesa correctamente.

### No GHL directo

- [ ] AIAdmissionsAssistant no tiene referencias a GHLClient.
- [ ] AIAdmissionsAssistant no llama createContact, findContactByPhone, ni updateContact.
- [ ] Toda la sincronizacion GHL ocurre dentro de LeadCaptureService.

### Manejo de errores

- [ ] Telefono invalido (sin formato E.164): LeadCaptureService rechaza con error claro.
- [ ] Carrera no soportada: el asistente responde sin inventar, no fuerza payload invalido.
- [ ] LLM falla: el asistente responde con fallback generico, no pierde estado.
- [ ] LeadCaptureService falla: el asistente informa al usuario, permite reintento.

### Resultado comercial

- [ ] El resultado incluye status (NEW_LEAD o EXISTING_LEAD).
- [ ] El resultado incluye pipelineStage (Nuevo prospecto).
- [ ] El resultado incluye tags (universidad-latino, admisiones, uv-1, canal:*, carrera:*, interes:*).
- [ ] El resultado incluye ghlContactId (simulado en modo mock).

## Modo real (requiere credenciales)

- [ ] GHL_API_KEY configurada en .env (no en codigo).
- [ ] GHL_LOCATION_ID configurada en .env.
- [ ] DATABASE_URL configurada para Postgres.
- [ ] LLM_PROVIDER_API_KEY configurada en .env.
- [ ] Contacto creado en GHL real.
- [ ] No se crean duplicados en GHL.
- [ ] No se crean duplicados en Postgres.
- [ ] Pipeline stage inicial es "Nuevo prospecto".
- [ ] Tags aplicados en GHL.
- [ ] Custom fields poblados en GHL.

---

*Fin del checklist v1.0.0*
