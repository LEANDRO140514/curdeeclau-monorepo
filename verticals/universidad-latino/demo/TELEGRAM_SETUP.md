# Telegram Setup — Universidad Latino Demo

> Tipo: vertical/demo
> Version: 1.0.0
> Creado: 2026-06-14

---

## Como crear el bot con BotFather

1. Abre Telegram y busca `@BotFather`.
2. Envia el comando `/newbot`.
3. Elige un nombre: `Universidad Latino Demo`
4. Elige un username: `UniversidadLatinoDemoBot` (o el que este disponible).
5. BotFather te dara un token. Copialo.

   ```
   Done! Congratulations on your new bot.
   Use this token to access the HTTP API:
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

---

## Variables a configurar

### Requerida

```bash
export TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
```

### Opcionales (para modo live)

```bash
export LLM_PROVIDER_API_KEY="sk-..."       # API key del LLM
export DATABASE_URL="postgres://..."        # Conexion Postgres
export GHL_API_KEY="..."                    # API key de GHL
export GHL_LOCATION_ID="..."                # Location ID de GHL
```

---

## Como ejecutar

### Modo mock (sin token — simulado)

```bash
cd packages/algorithmus/algorithmus-core-engine
npx tsx src/demo/universidad-latino/runTelegramAdmissionsDemo.ts
```

Simula una conversacion completa en consola. No requiere nada.

### Modo Telegram real (con token)

```bash
export TELEGRAM_BOT_TOKEN="1234567890:ABCdef..."
cd packages/algorithmus/algorithmus-core-engine
npx tsx src/demo/universidad-latino/runTelegramAdmissionsDemo.ts
```

El bot empieza a hacer polling. Abre Telegram, busca tu bot y escribe `Hola`.

### Modo Telegram + GHL live (con todo)

```bash
export TELEGRAM_BOT_TOKEN="..."
export DATABASE_URL="postgres://..."
export GHL_API_KEY="..."
export GHL_LOCATION_ID="..."
cd packages/algorithmus/algorithmus-core-engine
npx tsx src/demo/universidad-latino/runTelegramAdmissionsDemo.ts
```

---

## Como probar la conversacion

1. Abre Telegram en tu telefono o desktop.
2. Busca tu bot por el username que elegiste.
3. Escribe `Hola, me interesa Derecho`.
4. El bot debe responder como asistente de admisiones de Universidad Latino.
5. Sigue la conversacion proporcionando nombre, telefono, horario, canal.
6. Al final, el bot confirmara el registro.

---

## Como detener el bot

Presiona `Ctrl+C` en la terminal. El bot dejara de hacer polling.

---

## Diferencia entre modo mock y modo live

| Aspecto | Mock | Live (solo Telegram) | Live (+ GHL) |
|---------|------|---------------------|--------------|
| TELEGRAM_BOT_TOKEN | No requerido | Requerido | Requerido |
| LLM | Mock (predefinido) | Mock (predefinido) | Real (si se configura LLM_PROVIDER_API_KEY) |
| Persistencia | En memoria | En memoria | Postgres (si DATABASE_URL) |
| GHL | Mock | Mock | Real (si GHL_API_KEY) |
| Telegram real | No | Si | Si |

---

## Troubleshooting

### El bot no responde

- Verifica que `TELEGRAM_BOT_TOKEN` esta exportado.
- Verifica que el token es correcto (prueba con `/getMe` en BotFather).
- Verifica que tienes conexion a internet.
- Revisa los logs de la terminal.

### Error "ETELEGRAM: 401 Unauthorized"

El token es invalido. Crea un nuevo bot con BotFather.

### Error "ETELEGRAM: 409 Conflict"

Otro proceso esta usando el mismo token. Deten el proceso anterior.

### La conversacion se reinicia

Las sesiones son en memoria. Si reinicias el proceso, las conversaciones se pierden. Para persistencia, configura DATABASE_URL.

### El bot no entiende mi carrera

Solo reconoce las 10 carreras del catalogo UV-0. Si preguntas por una carrera fuera del catalogo, el asistente te informara honestamente.

---

## Que NO hacer con credenciales

1. **NO** comitear el `.env` ni el token en codigo.
2. **NO** compartir el token de BotFather con terceros.
3. **NO** exponer el token en logs. El runner ya enmascara telefonos en logs.
4. **NO** usar el bot en grupos publicos sin aprobacion.
5. **NO** ejecutar el bot en produccion sin supervision.
6. **NO** hacer push con credenciales al repositorio.

---

*Fin del Telegram Setup v1.0.0*
