import "./loadEnv";

/**
 * Composition root: wiring, Express, listen. Sin lógica de negocio.
 *
 * Env críticas: DATABASE_URL (Postgres para leads/FSM), REDIS_URL (en producción;
 *   en desarrollo, por defecto redis://localhost:6379 si falta),
 * OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_HOST,
 * YCLOUD_API_KEY, YCLOUD_WHATSAPP_FROM.
 * Opcionales: YCLOUD_BASE_URL (default https://api.ycloud.com/v2), YCLOUD_REQUEST_TIMEOUT_MS,
 * YCLOUD_WEBHOOK_SECRET, YCLOUD_WEBHOOK_REJECT_UNVERIFIED_IN_PRODUCTION,
 * YCLOUD_INBOUND_IDEMPOTENCY_TTL_SEC.
 * Opcional: YCLOUD_OUTBOUND_IDEMPOTENCY_TTL_SEC (worker, default 300).
 * Opcional: SENTRY_DSN, SENTRY_ENV, SENTRY_BASE_RATE, SENTRY_WEBHOOK_RATE.
 * Opcional: METRICS_ENABLED=false desactiva Prometheus y GET /metrics (default: métricas activas).
 * PORT opcional (default 3000).
 *
 * Procesamiento WhatsApp inbound: encolado BullMQ; ejecutar worker aparte:
 * `npm run worker:whatsapp`
 */
import express, {
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import {
  initSentry,
  setupExpressErrorHandler,
} from "../infra/observability/sentry";
import {
  baseLogger,
  configureWhatsAppHandler,
  handleWhatsAppWebhook,
} from "../infra/handlers/whatsappHandler";
import { PrometheusMetricsAdapter } from "../infra/observability/metrics/PrometheusMetricsAdapter";
import type { Metrics } from "../core/observability/Metrics";
import { registerMetricsRoute } from "./metrics/registerMetricsRoute";
import { registerHttpRoutes } from "./routes";
import { createAppContext } from "./compositionRoot";

const log = baseLogger.child({ module: "server" });

function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    void fn(req, res).catch(next);
  };
}

async function main(): Promise<void> {
  initSentry();

  const portRaw = process.env.PORT?.trim() || "3000";
  const PORT = Number.parseInt(portRaw, 10);
  if (!Number.isFinite(PORT) || PORT <= 0) {
    log.error({ event: "env_invalid", name: "PORT", portRaw }, "invalid PORT");
    process.exit(1);
  }

  const ctx = await createAppContext(log, { withInboundQueue: true });

  if (!ctx.inboundJobProducer) {
    log.error(
      { event: "server_misconfigured" },
      "inbound job producer missing",
    );
    process.exit(1);
  }

  const metrics: Metrics = ctx.metrics;

  configureWhatsAppHandler({
    identityManager: ctx.identityManager,
    webhookVerifier: ctx.webhookVerifier,
    idempotency: ctx.idempotency,
    inboundJobProducer: ctx.inboundJobProducer,
  });

  const app = express();
  app.use(express.json());

  registerHttpRoutes(app, {
    health: (_req, res) => {
      res.json({ ok: true });
    },
    whatsappWebhook: asyncHandler((req, res) =>
      handleWhatsAppWebhook(req, res, metrics),
    ),
  });

  if (metrics instanceof PrometheusMetricsAdapter) {
    registerMetricsRoute(app, metrics);
  }

  setupExpressErrorHandler(app);

  app.listen(PORT, () => {
    log.info({ event: "server_start", port: PORT }, "server start");
  });
}

void main().catch((err: unknown) => {
  log.error(
    {
      event: "server_fatal",
      error: err instanceof Error ? err.message : String(err),
    },
    "server bootstrap failed",
  );
  process.exit(1);
});
