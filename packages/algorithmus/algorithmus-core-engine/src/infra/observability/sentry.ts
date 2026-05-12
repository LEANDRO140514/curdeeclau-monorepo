import type { ErrorEvent } from "@sentry/core";
import {
  captureException as sentryCaptureException,
  captureMessage as sentryCaptureMessage,
  expressIntegration,
  init,
  setContext,
  setupExpressErrorHandler,
} from "@sentry/node";

/** Tags mínimos para filtrar en Sentry UI. */
export type SentryStandardTags = {
  module: string;
  step: string;
};

function hasDsn(): boolean {
  return Boolean(process.env.SENTRY_DSN?.trim());
}

function parseSampleRate(envName: string, fallback: number): number {
  const raw = process.env[envName]?.trim();
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, n));
}

/** Tasas configurables en runtime (`SENTRY_BASE_RATE`, `SENTRY_WEBHOOK_RATE`). */
const SENTRY_BASE_RATE = parseSampleRate("SENTRY_BASE_RATE", 0.05);
const SENTRY_WEBHOOK_RATE = parseSampleRate("SENTRY_WEBHOOK_RATE", 0.2);

const EXTRA_KEYS_TO_STRIP = new Set([
  "body",
  "text",
  "message",
  "phone",
  "raw",
  "query",
  "from",
  "to",
  "user_message",
  "message_text",
]);

/**
 * Evita enviar request HTTP crudo y extras con texto/teléfono completo.
 */
function sanitizeSentryEvent(event: ErrorEvent): ErrorEvent {
  if ("request" in event && event.request !== undefined) {
    (event as { request?: unknown }).request = undefined;
  }

  const e = event as ErrorEvent & {
    extra?: Record<string, unknown>;
    contexts?: Record<string, unknown>;
  };

  if (e.extra && typeof e.extra === "object" && !Array.isArray(e.extra)) {
    for (const key of Object.keys(e.extra)) {
      if (EXTRA_KEYS_TO_STRIP.has(key.toLowerCase())) {
        delete e.extra[key];
      }
    }
  }

  if (e.contexts?.request && typeof e.contexts.request === "object") {
    const req = e.contexts.request as Record<string, unknown>;
    if ("data" in req) {
      delete req.data;
    }
    if ("body" in req) {
      delete req.body;
    }
  }

  return event as ErrorEvent;
}

/**
 * Inicializa Sentry si `SENTRY_DSN` está definido. Idempotente respecto al resto del proceso.
 * Debe ejecutarse antes de montar Express.
 */
export function initSentry(): void {
  if (!hasDsn()) {
    return;
  }

  init({
    dsn: process.env.SENTRY_DSN!.trim(),
    environment:
      process.env.SENTRY_ENV?.trim() ||
      process.env.NODE_ENV ||
      "development",
    tracesSampler: (ctx) => {
      const urlRaw =
        (typeof ctx.normalizedRequest?.url === "string"
          ? ctx.normalizedRequest.url
          : "") ||
        (typeof ctx.request?.url === "string" ? ctx.request.url : "") ||
        (typeof ctx.transactionContext?.name === "string"
          ? ctx.transactionContext.name
          : "") ||
        (typeof ctx.name === "string" ? ctx.name : "") ||
        "";
      const url = urlRaw.toLowerCase();
      if (url.includes("/webhooks/whatsapp")) {
        return SENTRY_WEBHOOK_RATE;
      }
      return SENTRY_BASE_RATE;
    },
    integrations: [expressIntegration()],
    beforeSend(event) {
      const url = (
        (event.request?.url as string | undefined) || ""
      ).toLowerCase();
      const tagEvent =
        event.tags && typeof event.tags === "object" && "event" in event.tags
          ? String((event.tags as Record<string, string>).event)
          : "";

      if (
        url.includes("/health") ||
        (url.includes("/webhooks/whatsapp") && tagEvent === "ignored")
      ) {
        return null;
      }

      return sanitizeSentryEvent(event);
    },
  });
}

export { setupExpressErrorHandler };

/**
 * Contexto de correlación (sin PII completa; IDs y trazas).
 */
export function setSentryRequestContext(ctx: {
  trace_id?: string;
  tenant_id?: string;
  lead_id?: string;
}): void {
  if (!hasDsn()) {
    return;
  }
  setContext("request", ctx);
}

/**
 * Errores inesperados en capa HTTP/handler (no usar para flujos esperados: ignored, duplicate, 4xx validación).
 */
export function captureHandlerException(
  err: unknown,
  tags: SentryStandardTags,
  extra: { trace_id: string; tenant_id: string; lead_id?: string },
): void {
  if (!hasDsn()) {
    return;
  }
  const error = err instanceof Error ? err : new Error(String(err));
  sentryCaptureException(error, {
    tags,
    extra,
  });
}

/**
 * Fallo de persistencia FSM u otra inconsistencia infra sin excepción propagada.
 */
export function captureInfraMessage(
  message: string,
  options: {
    tags: SentryStandardTags;
    extra: Record<string, unknown>;
    level?: "error" | "warning";
  },
): void {
  if (!hasDsn()) {
    return;
  }
  sentryCaptureMessage(message, {
    level: options.level ?? "error",
    tags: options.tags,
    extra: options.extra,
  });
}
