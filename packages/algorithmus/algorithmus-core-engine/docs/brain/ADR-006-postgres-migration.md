# ADR-006 — Migración del runtime principal a PostgreSQL (Supabase fuera del core path)

**Estado:** Aceptada  
**Fecha:** 2026-04-28  
**Ámbito:** Algorithmus Core Engine — capa de persistencia de `leads` y FSM

## Contexto

El motor principal (API Express, worker BullMQ, orquestación WhatsApp) necesitaba alinear el **código** con la regla de arquitectura ya establecida: **PostgreSQL es la única fuente de verdad** (ver `.cursor/rules/04_data_integrity.md`). Hasta esta decisión, el acceso pasaba por el cliente `@supabase/supabase-js` como *query builder* sobre Postgres, lo que mezclaba el nombre del proveedor de hosting con el contrato del dominio.

## Decisión

1. **Runtime principal (`DATABASE_URL`)**  
   El arranque vía `createAppContext` exige `DATABASE_URL` y utiliza el pool `pg` (`src/infra/postgres/client.ts`). Toda lectura/escritura de filas `leads` en el flujo principal pasa por **`LeadsRepository`** (`src/infra/postgres/LeadsRepository.ts`): búsqueda por teléfono, upsert de identidad, actual incremental de `fsm_state`, y (cuando se cablee) inserción normalizada desde integraciones.

2. **Supabase ya no forma parte del core path**  
   `IdentityManager` y `Orchestrator` **no** dependen de `SupabaseClient` para persistir. La dependencia del core hacia Postgres se materializa como **repositorio + SQL parametrizado**, no como SDK de un vendor concreto.

3. **Código legado intencionalmente no migrado en este corte**  
   - **`src/app/api/webhooks/ghl/route.ts`** (ruta estilo Next.js, excluida del `tsc` principal del monolito Express): sigue usando `createSupabaseServerClient` y `supabase_client.ts`. Es **deuda explícita**; su limpieza (Postgres + `LeadsRepository`/`insertFromGhl`, tenant, mapeo de columnas) queda para un **paso posterior**, sin bloquear el runtime WhatsApp.  
   - **`src/core/supabase_client.ts`** y la dependencia **`@supabase/supabase-js`** se **mantienen** hasta que el webhook GHL u otros consumidores legacy dejen de usarlos.

4. **Límite de acceso a datos**  
   **`LeadsRepository`** es el **boundary** de acceso a la tabla `leads` para el flujo principal: contratos tipados, SQL explícito, y reglas de integridad (p. ej. no pisar `fsm_state`, `tags`, `ai_confidence_score` en conflictos controlados por identidad).

## Consecuencias

- **Operación:** Producción debe definir **`DATABASE_URL`** (cadena estándar `postgres://...`, con `sslmode` según el hosting).  
- **Desarrollo:** Copiar `.env.example` y rellenar al menos `DATABASE_URL` para ejercicios que toquen DB real; los tests del core siguen usando stubs del repositorio.  
- **Claridad:** “Supabase” deja de ser sinónimo de “capa de datos del core” en el camino feliz; sigue siendo solo un **camino legacy** acotado (GHL + módulo cliente).

## Próximo paso recomendado

**Identidad agnóstica de canal (channel-agnostic identity):** unificar resolución y persistencia de leads para todos los orígenes (WhatsApp, GHL, futuros canales) detrás de las mismas abstracciones (`IdentityManager` + `LeadsRepository` o un puerto explícito), eliminando divergencias de env (`PRIMA_DONNA_*` vs `SUPABASE_*` vs solo `DATABASE_URL`) y cerrando el webhook GHL sobre Postgres con tenant y esquema alineados a `schema.sql`.

## Referencias

- `src/infra/postgres/schema.sql` — esquema canónico `leads`.  
- `.cursor/rules/04_data_integrity.md` — SSOT Postgres, reglas de upsert.  
- `.env.example` — variables esperadas en runtime (incl. nota sobre Supabase solo legacy).
