# Telegram Live Validation — Universidad Latino

> Tipo: vertical/demo
> Version: 1.0.0
> Creado: 2026-06-14
> Fase: UV-LIVE

---

## Objetivo de la prueba

Validar que el bot de Telegram de Universidad Latino:
1. Recibe mensajes reales de Telegram.
2. Procesa la conversacion con AIAdmissionsAssistant correctamente.
3. Mantiene estado conversacional por chat_id.
4. Construye LeadCapturePayload valido al completar la conversacion.
5. Ejecuta captureFn (mock por defecto).
6. No expone el token en logs.

---

## Variables requeridas

```bash
# Requerida para Telegram real
export TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"

# Opcionales (solo si se autoriza modo live completo)
export LLM_PROVIDER_API_KEY="sk-..."        # LLM real
export DATABASE_URL="postgres://..."          # Postgres real
export GHL_API_KEY="..."                      # GHL real
export GHL_LOCATION_ID="..."                  # GHL real
```

### Estado actual (2026-06-14)

- `TELEGRAM_BOT_TOKEN`: **NO CONFIGURADO** — Bloquea validacion real.
- Resto de variables: No requeridas en modo mock.
- **Accion requerida:** Solicitar token a @BotFather o al administrador del bot.

---

## Comando de ejecucion

```bash
cd packages/algorithmus/algorithmus-core-engine

# Modo mock (sin token — simulado)
npx tsx src/demo/universidad-latino/runTelegramAdmissionsDemo.ts

# Modo Telegram real (requiere TELEGRAM_BOT_TOKEN)
export TELEGRAM_BOT_TOKEN="..."
npx tsx src/demo/universidad-latino/runTelegramAdmissionsDemo.ts

# Modo Telegram + GHL live (requiere todas las variables)
export TELEGRAM_BOT_TOKEN="..."
export DATABASE_URL="postgres://..."
export GHL_API_KEY="..."
export GHL_LOCATION_ID="..."
npx tsx src/demo/universidad-latino/runTelegramAdmissionsDemo.ts
```

---

## Checklist de conversacion

### Antes de empezar

- [ ] `TELEGRAM_BOT_TOKEN` configurado y verificado.
- [ ] `npx tsx` ejecutable en el entorno.
- [ ] Tests engine pasan (216/216).
- [ ] Abrir Telegram en telefono o desktop.
- [ ] Buscar el bot por su username.

### Durante la conversacion

- [ ] **Saludo:** Escribir "Hola" → Bot responde con saludo de admisiones de Universidad Latino.
- [ ] **Intencion de carrera:** Escribir "Me interesa Derecho" → Bot reconoce la carrera y pide nombre.
- [ ] **Nombre:** Escribir "Maria Garcia" → Bot confirma y pide telefono.
- [ ] **Telefono:** Escribir "+521234567890" → Bot confirma y pide horario.
- [ ] **Horario:** Escribir "Matutino" → Bot confirma y pide canal.
- [ ] **Canal:** Escribir "WhatsApp" → Bot confirma datos.
- [ ] **Confirmacion:** Escribir "Si" → Bot registra y confirma.
- [ ] **Conversacion completa:** El bot llega a estado DONE.
- [ ] **Reinicio:** Escribir "Hola" de nuevo → El bot responde como nueva conversacion (sesiones in-memory).

### Despues de la conversacion

- [ ] Verificar logs en terminal: `source: "telegram-admissions"`, `state: "DONE"`, `has_payload: true`.
- [ ] Verificar que NO aparece `TELEGRAM_BOT_TOKEN` en ningun log.
- [ ] Verificar que `chat_id` y `fields_collected` aparecen en logs.
- [ ] Verificar que `capturePayload` contiene los 5 campos requeridos.

---

## Casos de prueba

### Caso A — Saludo simple
**Input:** "Hola"
**Esperado:** Bot responde saludo de admisiones. Pide dato faltante.
**Resultado mock:** OK — respuesta contiene "Universidad Latino".
**Resultado live:** Pendiente (sin token).

### Caso B — Intencion de carrera
**Input:** "Me interesa Derecho"
**Esperado:** Bot reconoce "Derecho" como carrera. Continua flujo.
**Resultado mock:** OK — carrera extraida correctamente.
**Resultado live:** Pendiente (sin token).

### Caso C — Conversacion completa
**Input:** Nombre, telefono, carrera, horario, canal, confirmacion.
**Esperado:** Estado DONE. LeadCapturePayload construido. captureFn ejecutado.
**Resultado mock:** OK — 6 pasos, payload valido, 5 campos requeridos presentes.
**Resultado live:** Pendiente (sin token).

### Caso D — Carrera no soportada
**Input:** "Me interesa Medicina"
**Esperado:** Bot no inventa. Indica confirmar con asesor. No fuerza payload.
**Resultado mock:** OK — carrera_interes permanece null.
**Resultado live:** Pendiente (sin token).

### Caso E — Telefono invalido
**Input:** "12345" como telefono
**Esperado:** Bot solicita correccion. No captura lead incompleto.
**Resultado mock:** OK — formato E.164 validado por LeadCaptureService.
**Resultado live:** Pendiente (sin token).

---

## Como validar logs

```bash
# Durante la ejecucion, los logs aparecen en stdout con formato JSON.
# Buscar entradas con source "telegram-admissions":

# Estado de cada mensaje:
{"source":"telegram-admissions","chat_id":"123456","state":"COLLECTING","fields_collected":["nombre","carrera_interes"],"is_complete":false,"has_payload":false}

# Captura completada:
{"source":"telegram-admissions","chat_id":"123456","state":"DONE","fields_collected":["nombre","telefono","carrera_interes","horario_deseado","canal_origen"],"is_complete":true,"has_payload":true}
```

---

## Como detener el bot

Presionar `Ctrl+C` en la terminal. El bot deja de hacer polling inmediatamente.

---

## Como proteger el token

1. NUNCA escribir el token en codigo.
2. NUNCA commitear el token.
3. Usar `export TELEGRAM_BOT_TOKEN="..."` en la terminal (no en archivo).
4. Si se usa `.env`, asegurar que esta en `.gitignore`.
5. Verificar que los logs no contienen el token.
6. Si el token se expone, revocarlo con @BotFather inmediatamente.

---

## Errores esperados

| Error | Causa | Solucion |
|-------|-------|----------|
| `ETELEGRAM: 401 Unauthorized` | Token invalido o revocado | Crear nuevo bot con @BotFather |
| `ETELEGRAM: 409 Conflict` | Otro proceso usando el mismo token | Detener el proceso anterior |
| `[uv-telegram] No TELEGRAM_BOT_TOKEN` | Variable no configurada | `export TELEGRAM_BOT_TOKEN="..."` |
| Bot no responde | Sin conexion o token incorrecto | Verificar token y conexion |
| Conversacion se reinicia | Sesiones in-memory. Proceso reiniciado. | Comportamiento esperado. Para persistencia usar DATABASE_URL. |

---

## Criterio para pasar de Telegram a WhatsApp

**UV-LIVE debe estar VALIDATED con evidencia de conversacion real** antes de abrir UV-WA-0.

Evidencia minima requerida:
- [ ] Bot Telegram funcionando con token real.
- [ ] Conversacion completa de admisiones (Caso C superado).
- [ ] LeadCapturePayload generado con datos validos.
- [ ] Logs de aceptacion sin secretos expuestos.
- [ ] Errores de Caso D y Caso E manejados correctamente.
- [ ] Checklist de validacion completado.
- [ ] Ajustes documentados (si hubo correcciones).

---

*Fin de la Guia de Validacion Live v1.0.0*
