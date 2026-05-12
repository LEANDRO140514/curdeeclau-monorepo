/**
 * Single source of truth for REDIS_URL used by the Redis client, BullMQ, and DI wiring.
 *
 * - Non-production: if `REDIS_URL` is unset or empty, defaults to `redis://localhost:6379`.
 * - Production (`NODE_ENV === "production"`): `REDIS_URL` is required and must be non-empty.
 * - Any non-empty value must be a valid `redis://` or `rediss://` URL.
 */

export const DEFAULT_REDIS_URL = "redis://localhost:6379";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export function validateRedisUrl(url: string): void {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "redis:" && parsed.protocol !== "rediss:") {
      throw new Error(
        `REDIS_URL must use protocol redis: or rediss: (got ${parsed.protocol})`,
      );
    }
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error(
        `REDIS_URL is not a valid URL. Expected redis:// or rediss:// (value: ${JSON.stringify(url)})`,
      );
    }
    throw e;
  }
}

export function resolveRedisUrl(): string {
  const raw = process.env.REDIS_URL?.trim();
  if (raw) {
    validateRedisUrl(raw);
    return raw;
  }
  if (isProduction()) {
    throw new Error(
      "REDIS_URL is required in production. Set REDIS_URL to your Redis connection string (e.g. redis://localhost:6379 or rediss://...).",
    );
  }
  return DEFAULT_REDIS_URL;
}

let cached: string | null = null;

/**
 * Resolves, validates, and caches the Redis URL; mirrors it to `process.env.REDIS_URL`
 * so any code that reads the env var sees the effective value (including the dev default).
 */
export function getRedisUrl(): string {
  if (cached) {
    return cached;
  }
  const url = resolveRedisUrl();
  process.env.REDIS_URL = url;
  cached = url;
  return url;
}

export function syncRedisUrlToEnv(): void {
  getRedisUrl();
}
