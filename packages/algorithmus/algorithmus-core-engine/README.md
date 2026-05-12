# Algorithmus Core Engine

## ⚡ Quickstart (5 minutos)

```bash
git clone <repo>
cd algorithmus-core-engine
npm install
cp .env.example .env
```

Editar `.env` con:

- `DATABASE_URL`
- `REDIS_URL`
- (opcional) LLM / Pinecone keys

Luego:

```bash
npm run db:migrate
npm run smoke:postgres
npm test
npm start
```

Si todo sale OK:  
→ Core Engine corriendo localmente

---

# 🧠 Por qué esto es crítico

Sin esto, un dev:

```txt
lee → entiende → duda → pierde tiempo
```

Con esto:

```txt
clona → corre → ve que funciona → confía
```

## 🧠 Mental Model (muy importante)

- El Core NO es un bot
- El Core NO es un canal
- El Core NO es UI

El Core es:

→ un motor determinista que recibe eventos  
→ resuelve identidad  
→ ejecuta FSM  
→ decide acciones

Todo lo demás (Telegram, WhatsApp, UI) vive fuera.

Orquestador backend en **Node + TypeScript** para procesamiento conversacional multitenant.

Incluye:
- resolucion de identidad de lead
- FSM deterministica para estado conversacional
- orquestacion de LLM/RAG con capa de validacion (Safety, Grounding, HardGate)
- procesamiento asíncrono inbound/outbound de WhatsApp (YCloud + BullMQ)
- control de concurrencia con Redis locks

No incluye:
- Attention Layer
- adapters completos de nuevos canales (Telegram, email, etc.)
- decisiones de estado fuera de la FSM

---

## Arquitectura en 1 minuto

Flujo principal:
1. llega mensaje inbound
2. `IdentityManager` resuelve/crea lead
3. se encola job y el worker procesa
4. `FSMEngine` evalua estado y accion
5. `Orchestrator` ejecuta pipeline IA (LLM/RAG + validation layer)
6. se persiste estado FSM
7. se emite respuesta outbound

Principios no negociables:
- **FSM** es unica fuente de verdad de estado
- **LeadsRepository** es boundary unico de DB para el core
- todo acceso de negocio es **tenant-scoped**
- el LLM no muta estado directamente

---

## Persistencia y estado actual

- **Runtime principal (Express + worker):** PostgreSQL directo via `DATABASE_URL`.
  - Pool/cliente: `src/infra/postgres/client.ts`
  - Boundary de datos: `src/infra/postgres/LeadsRepository.ts`
- **Supabase:** solo legado para `src/app/api/webhooks/ghl/route.ts`.
  - No forma parte del path principal del Core Engine.

Referencias:
- [ADR-006 — Postgres migration](docs/brain/ADR-006-postgres-migration.md)
- ADR-007 (Multichannel Identity)

---

## Requisitos

- Node.js 20+ recomendado
- PostgreSQL accesible por `DATABASE_URL`
- Redis accesible por `REDIS_URL` (o default local)
- Credenciales de proveedores segun `.env.example` (`OPENAI_*`, `PINECONE_*`, `YCLOUD_*`)

---

## Configuracion

Copiá [`.env.example`](.env.example) a `.env` y completa al menos:
- `DATABASE_URL`
- `REDIS_URL`
- `OPENAI_API_KEY`
- `PINECONE_API_KEY`, `PINECONE_INDEX_HOST`
- `YCLOUD_API_KEY`, `YCLOUD_WHATSAPP_FROM`

---

## Clean local bootstrap

```bash
npm install
cp .env.example .env
# editar .env (DATABASE_URL + keys)
npm run db:migrate
npm run smoke:postgres
npm test
npm run start
```

Worker (proceso separado):
```bash
npm run worker:whatsapp
```

---

## Scripts principales

- `npm run build` - compila TypeScript a `dist/`
- `npm run test` - ejecuta suite Jest
- `npm run db:migrate` - ejecuta SQLs de `src/infra/postgres/migrations` en orden
- `npm run smoke:postgres` - valida conexion y tablas base de Postgres
- `npm run prepush:core` - gate de pre-push del core (`test` + `db:migrate` + `smoke`)
- `npm run start` - inicia servidor HTTP
- `npm run worker:whatsapp` - inicia worker BullMQ

---

## Datos y migraciones

- Schema base: `src/infra/postgres/schema.sql`
- Migrations incrementales: `src/infra/postgres/migrations/*.sql`
- Runner oficial: `scripts/run-postgres-migrations.ts`

Convencion:
- prefijo numerico (`001_`, `002_`, ...)
- SQL idempotente cuando aplique
- cambios de identidad multicanal bajo ADR-007

---

## Legacy y limites

- `src/app/api/webhooks/ghl/route.ts` y `src/core/supabase_client.ts` son **legacy-only**.
- Se mantienen para compatibilidad GHL hasta limpieza final.
- El Core Engine principal **no depende de Supabase** para operar.

---

## Troubleshooting rapido

- `DATABASE_URL is required`:
  - revisa `.env` y formato de cadena Postgres
- `[smoke:postgres] missing table: ...`:
  - ejecuta `npm run db:migrate` y verifica privilegios del usuario DB
- errores de Redis:
  - revisa `REDIS_URL` y conectividad
- tests verdes pero runtime falla:
  - confirma que API y worker usen el mismo entorno (`.env`) y credenciales

---

## Checklist pre-push (core)

```bash
npm run build
npm run test
npm run db:migrate
npm run smoke:postgres
npm run prepush:core
```

---

## Referencias

- `docs/brain/PRD_MASTER.md`
- `docs/brain/ADR-006-postgres-migration.md`
- `src/infra/postgres/LeadsRepository.ts`
- `.cursor/rules/04_data_integrity.md`
