import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * LEGACY: Supabase is only used for GHL webhook integration.
 * It is NOT part of the Core Engine runtime.
 * Core Engine uses PostgreSQL via LeadsRepository.
 */

/**
 * Prima Donna — Supabase
 *
 * Variables (defínelas en Easypanel como entorno de **runtime** del contenedor,
 * no como “build args” de Nixpacks salvo que tu stack las necesite en compile).
 * Prefijo PRIMA_DONNA_* para no chocar con otros proyectos o con SUPABASE_* genéricos
 * que suelen quedar “stale” al rotar credenciales en el mismo panel.
 *
 * - PRIMA_DONNA_SUPABASE_URL
 * - PRIMA_DONNA_SUPABASE_ANON_KEY        → cliente público / RLS
 * - PRIMA_DONNA_SUPABASE_SERVICE_ROLE_KEY → solo servidor (nunca al bundle del cliente)
 */

const ENV_URL = "PRIMA_DONNA_SUPABASE_URL";
const ENV_ANON = "PRIMA_DONNA_SUPABASE_ANON_KEY";
const ENV_SERVICE_ROLE = "PRIMA_DONNA_SUPABASE_SERVICE_ROLE_KEY";

function readEnv(name: string): string {
  const raw = process.env[name];
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) {
    throw new Error(
      `[supabase] Falta ${name}. En Easypanel/Nixpacks: variable de entorno en runtime (mismo nombre exacto), sin reutilizar claves de otros proyectos.`,
    );
  }
  return value;
}

/**
 * Cliente servidor: Service Role. Bypass RLS — usar solo en API, workers, scripts Node.
 * No importar esta función desde código que acabe en el navegador.
 */
export function createSupabaseServerClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "[supabase] createSupabaseServerClient no debe ejecutarse en el navegador (Service Role).",
    );
  }

  const url = readEnv(ENV_URL);
  const serviceRoleKey = readEnv(ENV_SERVICE_ROLE);

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Cliente “público”: Anon key + RLS. Válido en servidor (SSR, route handlers) o en Node.
 * Si más adelante expones esto al browser con Vite/Webpack, inyecta solo URL + anon
 * por el mecanismo de env de ese bundler (nunca la service role).
 */
export function createSupabasePublicClient(): SupabaseClient {
  const url = readEnv(ENV_URL);
  const anonKey = readEnv(ENV_ANON);

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}
