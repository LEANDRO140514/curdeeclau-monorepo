import "../app/loadEnv";
import { UnrecoverableError, Worker } from "bullmq";
import { getRedisUrl } from "../config/redisUrl";
import { createAppContext } from "../app/compositionRoot";
import { readPositiveInt } from "../app/envHelpers";
import { baseLogger } from "../infra/handlers/whatsappHandler";
import {
  captureHandlerException,
  captureInfraMessage,
  initSentry,
  setSentryRequestContext,
} from "../infra/observability/sentry";
import {
  coerceJobFsmState,
  WHATSAPP_INBOUND_QUEUE,
} from "../infra/queue/jobTypes";
import { createBullMqConnection } from "../infra/queue/queueClient";
import { getRedis } from "../infra/redis/client";

function outboundMessageLabels(tenant_id: string) {
  return { tenant_id, outcome: "success" as const };
}

async function main(): Promise<void> {
  initSentry();

  const log = baseLogger.child({ module: "whatsapp_worker" });
  const outboundTtlSec = readPositiveInt(
    "YCLOUD_OUTBOUND_IDEMPOTENCY_TTL_SEC",
    300,
  );

  const redisUrl = getRedisUrl();

  const ctx = await createAppContext(log, { withInboundQueue: false });
  const connection = createBullMqConnection(redisUrl);

  const worker = new Worker(
    WHATSAPP_INBOUND_QUEUE,
    async (job) => {
      const start = process.hrtime.bigint();
      const { tenantId, leadId, currentState, traceId, inboundMessage } =
        job.data;

      if (
        !tenantId?.trim() ||
        !leadId?.trim() ||
        typeof inboundMessage?.text !== "string" ||
        !inboundMessage.text.trim() ||
        !inboundMessage?.messageId?.trim() ||
        !inboundMessage?.from?.trim()
      ) {
        log.error(
          {
            event: "whatsapp_worker_invalid_payload",
            job_id: job.id,
            has_tenant: Boolean(tenantId?.trim()),
            has_lead: Boolean(leadId?.trim()),
            has_text:
              typeof inboundMessage?.text === "string" &&
              Boolean(inboundMessage.text.trim()),
            has_message_id: Boolean(inboundMessage?.messageId?.trim()),
            has_from: Boolean(inboundMessage?.from?.trim()),
          },
          "invalid job payload",
        );
        throw new UnrecoverableError("invalid job payload");
      }

      const logger = baseLogger.child({
        module: "whatsapp_worker",
        trace_id: traceId,
        tenant_id: tenantId,
        lead_id: leadId,
        job_id: job.id,
      });

      setSentryRequestContext({
        trace_id: traceId,
        tenant_id: tenantId,
        lead_id: leadId,
      });

      const jobCreatedMs = job.timestamp ?? Date.now();
      const lagSec = Math.max(0, (Date.now() - jobCreatedMs) / 1000);
      ctx.metrics.observeHistogram("queue_lag_seconds", lagSec, {
        queue: WHATSAPP_INBOUND_QUEUE,
        tenant_id: tenantId,
      });

      ctx.metrics.incrementCounter("queue_jobs_total", 1, {
        queue: WHATSAPP_INBOUND_QUEUE,
        tenant_id: tenantId,
        outcome: "started",
      });

      logger.info(
        { event: "job_started", step: "whatsapp_worker_job_start", lag_sec: lagSec },
        "worker job started",
      );

      try {
        const result = await ctx.orchestrator.process({
          tenantId,
          leadId,
          message: inboundMessage.text,
          currentState: coerceJobFsmState(currentState),
          traceId,
        });

        if (result.fsmPersisted === false) {
          captureInfraMessage("FSM state persist failed after orchestrator", {
            tags: {
              module: "whatsapp_worker",
              step: "orchestrator_fsm_persist",
            },
            extra: {
              trace_id: traceId,
              tenant_id: tenantId,
              lead_id: leadId,
              persist_error:
                result.internalDiagnostics?.persistError ?? "unknown",
            },
            level: "error",
          });
        }

        const redis = await getRedis();
        const outboundKey = `outbound:${tenantId}:${inboundMessage.messageId}`;
        const acquired = await redis.set(outboundKey, "1", {
          NX: true,
          EX: outboundTtlSec,
        });

        if (acquired !== "OK") {
          logger.info(
            { step: "whatsapp_outbound_dedupe_skip" },
            "outbound skipped (already sent)",
          );
        } else {
          try {
            const sent = await ctx.sender.sendText({
              channel: "whatsapp",
              to: inboundMessage.from,
              text: result.messageToSend,
              tenantId,
              traceId,
            });
            if (!sent) {
              await redis.del(outboundKey);
              throw new Error("YCloud sendDirectly failed");
            }
            ctx.metrics.incrementCounter(
              "whatsapp_outbound_messages_total",
              1,
              outboundMessageLabels(tenantId),
            );
            ctx.metrics.incrementCounter("messages_total", 1, {
              tenant_id: tenantId,
              direction: "outbound",
            });
          } catch (sendErr) {
            await redis.del(outboundKey).catch(() => undefined);
            throw sendErr;
          }
        }

        const duration = Number(process.hrtime.bigint() - start) / 1e9;
        ctx.metrics.observeHistogram("queue_job_duration_seconds", duration, {
          queue: WHATSAPP_INBOUND_QUEUE,
          tenant_id: tenantId,
          outcome: "completed",
        });
        ctx.metrics.incrementCounter("queue_jobs_total", 1, {
          queue: WHATSAPP_INBOUND_QUEUE,
          tenant_id: tenantId,
          outcome: "completed",
        });

        logger.info(
          { step: "whatsapp_worker_job_ok", duration_sec: duration },
          "worker job completed",
        );
      } catch (error) {
        logger.error(
          {
            step: "whatsapp_worker_job_error",
            error: error instanceof Error ? error.message : String(error),
          },
          "worker job attempt failed",
        );
        captureHandlerException(
          error,
          { module: "whatsapp_worker", step: "inbound_job" },
          { trace_id: traceId, tenant_id: tenantId, lead_id: leadId },
        );
        if (!(error instanceof UnrecoverableError)) {
          const made = job.attemptsMade ?? 0;
          const maxAttempts = job.opts.attempts ?? 1;
          if (made + 1 < maxAttempts) {
            ctx.metrics.incrementCounter("queue_jobs_total", 1, {
              queue: WHATSAPP_INBOUND_QUEUE,
              tenant_id: tenantId,
              outcome: "retry",
            });
          }
        }
        throw error;
      }
    },
    { connection, concurrency: 1 },
  );

  worker.on("failed", (job, err) => {
    if (!job?.data?.tenantId) {
      return;
    }
    ctx.metrics.incrementCounter("queue_failures_total", 1, {
      queue: WHATSAPP_INBOUND_QUEUE,
      tenant_id: job.data.tenantId,
    });
    ctx.metrics.incrementCounter("queue_jobs_total", 1, {
      queue: WHATSAPP_INBOUND_QUEUE,
      tenant_id: job.data.tenantId,
      outcome: "failed",
    });
    log.error(
      {
        event: "whatsapp_worker_job_exhausted",
        job_id: job.id,
        tenant_id: job.data.tenantId,
        error: err instanceof Error ? err.message : String(err),
      },
      "job failed after retries",
    );
  });

  worker.on("error", (err) => {
    log.error(
      {
        event: "whatsapp_worker_bullmq_error",
        error: err instanceof Error ? err.message : String(err),
      },
      "worker connection error",
    );
  });

  log.info({ event: "whatsapp_worker_started" }, "whatsapp worker listening");

  const shutdown = async (signal: string) => {
    log.info(
      { event: "whatsapp_worker_shutdown", signal },
      "closing worker gracefully",
    );
    try {
      await worker.close();
      await connection.quit();
    } catch (e: unknown) {
      log.warn(
        { event: "whatsapp_worker_shutdown_error", error: String(e) },
        "error during worker shutdown",
      );
    }
    process.exit(0);
  };

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });
}

void main().catch((err: unknown) => {
  baseLogger.error(
    {
      event: "whatsapp_worker_fatal",
      error: err instanceof Error ? err.message : String(err),
    },
    "worker bootstrap failed",
  );
  process.exit(1);
});
