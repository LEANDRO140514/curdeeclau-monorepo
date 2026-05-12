import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import pino from "pino";
import type { MetricsService } from "../observability/metrics/MetricsService";
import type { IdentityManager } from "../../core/identity/IdentityManager";
import type { WhatsAppInboundJobProducer } from "../queue/queueClient";
import type { YCloudInboundIdempotency } from "../providers/ycloud/ycloudIdempotency";
import type { YCloudWebhookVerifier } from "../providers/ycloud/ycloudWebhookVerifier";
import { parseYCloudInboundWhatsAppText } from "../providers/ycloud/ycloudWebhookParser";
import {
  captureHandlerException,
  setSentryRequestContext,
} from "../observability/sentry";

export const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  name: "algorithmus-api",
});

export type WhatsAppHandlerServices = {
  identityManager: IdentityManager;
  webhookVerifier: YCloudWebhookVerifier;
  idempotency: YCloudInboundIdempotency;
  inboundJobProducer: WhatsAppInboundJobProducer;
};

let handlerServices: WhatsAppHandlerServices | null = null;

/** Debe llamarse antes de aceptar tráfico (p. ej. al arrancar el servidor). */
export function configureWhatsAppHandler(
  services: WhatsAppHandlerServices,
): void {
  handlerServices = services;
}

/** Outcome HTTP canónico (Grafana / SLOs). */
export type HttpRequestOutcome = "success" | "error" | "ignored";

function reasonToHttpOutcome(internalReason: string): HttpRequestOutcome {
  switch (internalReason) {
    case "queued":
      return "success";
    case "ignored_not_inbound":
    case "duplicate":
      return "ignored";
    case "missing_tenant":
    case "misconfigured":
    case "unauthorized":
    case "error":
    default:
      return "error";
  }
}

/** Labels estables: solo `tenant_id` + `outcome` (sin route/channel/trace). */
function tenantOutcomeLabels(tenant_id: string, outcome: HttpRequestOutcome) {
  return { tenant_id, outcome };
}

function recordWhatsAppHttpMetrics(
  metrics: MetricsService,
  startNs: bigint,
  tenant_id: string,
  internalReason: string,
): void {
  const seconds = Number(process.hrtime.bigint() - startNs) / 1e9;
  const outcome = reasonToHttpOutcome(internalReason);
  const labels = tenantOutcomeLabels(tenant_id, outcome);
  metrics.observeHistogram("request_duration_seconds", seconds, labels);
  metrics.incrementCounter("whatsapp_requests_total", 1, labels);
}

function readTenantIdHeader(req: Request): string | undefined {
  const raw = req.headers["x-tenant-id"];
  if (Array.isArray(raw)) {
    return typeof raw[0] === "string" ? raw[0].trim() : undefined;
  }
  return typeof raw === "string" ? raw.trim() : undefined;
}

function previewBody(raw: unknown): string {
  try {
    const s = JSON.stringify(raw);
    return s.length > 400 ? `${s.slice(0, 400)}…` : s;
  } catch {
    return "[unserializable]";
  }
}

/**
 * Webhook corto: validación, idempotencia inbound, identidad, encolado BullMQ.
 * Orchestrator + envío YCloud se ejecutan en `src/workers/whatsappWorker.ts`.
 */
export async function handleWhatsAppWebhook(
  req: Request,
  res: Response,
  metrics: MetricsService,
): Promise<void> {
  const startNs = process.hrtime.bigint();
  const traceId = randomUUID();
  const receivedAt = new Date().toISOString();
  const tenantId = readTenantIdHeader(req);

  const log = baseLogger.child({
    module: "WhatsAppHandler",
    trace_id: traceId,
    tenant_id: tenantId ?? "unknown",
  });

  log.info(
    {
      event: "whatsapp_webhook_received",
      body_preview: previewBody(req.body),
    },
    "whatsapp webhook received",
  );

  if (typeof tenantId !== "string" || !tenantId.trim()) {
    recordWhatsAppHttpMetrics(metrics, startNs, "unknown", "missing_tenant");
    res.status(400).send("missing x-tenant-id");
    return;
  }

  const services = handlerServices;
  if (!services) {
    log.error(
      { event: "whatsapp_handler_misconfigured" },
      "handler sin servicios",
    );
    recordWhatsAppHttpMetrics(metrics, startNs, "unknown", "misconfigured");
    res.status(503).send("service unavailable");
    return;
  }

  const verify = services.webhookVerifier.verify(req);
  if (!verify.ok) {
    log.warn(
      {
        event: "whatsapp_webhook_verification_failed",
        reason: verify.reason,
      },
      "webhook verification failed",
    );
    recordWhatsAppHttpMetrics(
      metrics,
      startNs,
      tenantId.trim(),
      "unauthorized",
    );
    res.status(401).send("unauthorized");
    return;
  }

  const inbound = parseYCloudInboundWhatsAppText(req.body, {
    tenantId: tenantId.trim(),
    receivedAt,
  });

  if (!inbound) {
    log.info(
      { event: "whatsapp_webhook_ignored", reason: "not_inbound_text" },
      "webhook ignored",
    );
    metrics.incrementCounter(
      "whatsapp_events_ignored_total",
      1,
      tenantOutcomeLabels(tenantId.trim(), "ignored"),
    );
    recordWhatsAppHttpMetrics(
      metrics,
      startNs,
      tenantId.trim(),
      "ignored_not_inbound",
    );
    res.status(200).send("ignored");
    return;
  }

  log.info(
    {
      event: "whatsapp_inbound_normalized",
      message_id: inbound.messageId,
      from_preview: inbound.externalUserId.slice(0, 8),
      text_preview: inbound.text.slice(0, 80),
    },
    "inbound normalized",
  );

  log.info(
    {
      event: "whatsapp_inbound_accepted",
      message_id: inbound.messageId,
      from_preview: inbound.externalUserId.slice(0, 8),
    },
    "inbound accepted before idempotency",
  );

  const dedup = await services.idempotency.tryAcquire(
    inbound.tenantId,
    inbound.messageId,
    traceId,
  );

  if (dedup === "duplicate") {
    log.info(
      {
        event: "whatsapp_duplicate_ignored",
        message_id: inbound.messageId,
      },
      "duplicate webhook ignored",
    );
    metrics.incrementCounter(
      "whatsapp_duplicates_total",
      1,
      tenantOutcomeLabels(inbound.tenantId, "ignored"),
    );
    recordWhatsAppHttpMetrics(metrics, startNs, inbound.tenantId, "duplicate");
    res.status(200).send("duplicate");
    return;
  }

  metrics.incrementCounter(
    "whatsapp_messages_inbound_total",
    1,
    tenantOutcomeLabels(inbound.tenantId, "success"),
  );
  metrics.incrementCounter("messages_total", 1, {
    tenant_id: inbound.tenantId,
    direction: "inbound",
  });

  setSentryRequestContext({
    trace_id: traceId,
    tenant_id: inbound.tenantId,
  });

  const runLog = log.child({
    tenant_id: inbound.tenantId,
    message_id: inbound.messageId,
  });

  let leadIdForScope: string | undefined;

  try {
    const lead = await services.identityManager.resolveLead({
      tenantId: inbound.tenantId,
      channel: "whatsapp",
      externalId: inbound.externalUserId,
      traceId,
    });

    leadIdForScope = lead.id;

    setSentryRequestContext({
      trace_id: traceId,
      tenant_id: inbound.tenantId,
      lead_id: lead.id,
    });

    const receivedMs = Date.parse(inbound.receivedAt);
    await services.inboundJobProducer.add({
      tenantId: inbound.tenantId,
      leadId: lead.id,
      currentState: lead.fsm_state,
      traceId,
      inboundMessage: {
        messageId: inbound.messageId,
        from: inbound.externalUserId,
        text: inbound.text,
        channel: inbound.channel,
        ...(Number.isFinite(receivedMs) ? { timestamp: receivedMs } : {}),
      },
    });

    runLog.info(
      { event: "whatsapp_inbound_enqueued", message_id: inbound.messageId },
      "inbound enqueued for async processing",
    );

    metrics.incrementCounter(
      "whatsapp_inbound_jobs_enqueued_total",
      1,
      tenantOutcomeLabels(inbound.tenantId, "success"),
    );
    recordWhatsAppHttpMetrics(metrics, startNs, inbound.tenantId, "queued");
    res.status(200).json({ ok: true });
  } catch (err) {
    runLog.error(
      {
        event: "whatsapp_handler_error",
        error: err instanceof Error ? err.message : String(err),
      },
      "whatsapp handler error",
    );
    metrics.incrementCounter(
      "whatsapp_handler_errors_total",
      1,
      tenantOutcomeLabels(inbound.tenantId, "error"),
    );
    captureHandlerException(
      err,
      { module: "whatsapp_handler", step: "webhook_pipeline" },
      {
        trace_id: traceId,
        tenant_id: inbound.tenantId,
        lead_id: leadIdForScope,
      },
    );
    recordWhatsAppHttpMetrics(metrics, startNs, inbound.tenantId, "error");
    res.status(500).send("internal error");
  }
}

