import type { Logger } from "pino";

export function requireEnv(log: Logger, name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    log.error({ event: "env_missing", name }, "missing required env");
    process.exit(1);
  }
  return value;
}

export function readEnvOptional(name: string, fallback: string): string {
  const raw = process.env[name]?.trim();
  return raw && raw.length > 0 ? raw : fallback;
}

export function readPositiveInt(name: string, defaultValue: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return defaultValue;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : defaultValue;
}
