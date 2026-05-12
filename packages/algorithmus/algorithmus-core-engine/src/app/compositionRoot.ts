import type { Logger } from "pino";
import { EmbeddingService } from "../core/embedding/EmbeddingService";
import { FSMEngine } from "../core/fsm/FSMEngine";
import { FSMTransitionChecker } from "../core/fsm/FSMTransitionChecker";
import { IdentityManager } from "../core/identity/IdentityManager";
import { LLMGateway } from "../core/llm/LLMGateway";
import type { Metrics } from "../core/observability/Metrics";
import { NoopMetrics } from "../core/observability/Metrics";
import { Orchestrator } from "../core/orchestrator/Orchestrator";
import { PineconeRAGAdapter } from "../core/rag/PineconeRAGAdapter";
import { RAGService } from "../core/rag/RAGService";
import type { AIValidator } from "../core/validation/AIValidationLayer";
import { BasicAIValidator } from "../core/validation/AIValidatorImpl";
import { BasicDecisionMatrix } from "../core/validation/DecisionMatrixImpl";
import { BasicHardGate } from "../core/validation/HardGateImpl";
import { NoopValidationMetricsPort } from "../core/validation/NoopMetricsPort";
import { ProductionAIValidator } from "../core/validation/ProductionAIValidator";
import { LexicalGroundingClient } from "../infra/grounding/LexicalGroundingClient";
import { LexicalGroundingPort } from "../infra/grounding/LexicalGroundingPort";
import { OpenAIModerationClient } from "../infra/providers/openai/OpenAIModerationClient";
import { OpenAIModerationSafetyPort } from "../infra/providers/openai/OpenAIModerationSafetyPort";
import { YCloudClient } from "../infra/providers/ycloud/ycloudClient";
import { YCloudInboundIdempotency } from "../infra/providers/ycloud/ycloudIdempotency";
import { YCloudSender } from "../infra/providers/ycloud/ycloudSender";
import { YCloudWebhookVerifier } from "../infra/providers/ycloud/ycloudWebhookVerifier";
import { BullmqQueueDepthExporter } from "../infra/observability/bullmqQueueDepthExporter";
import { PrometheusMetricsAdapter } from "../infra/observability/metrics/PrometheusMetricsAdapter";
import { getRedis } from "../infra/redis/client";
import {
  createBullMqConnection,
  createWhatsAppInboundJobProducer,
  createWhatsAppInboundQueue,
  type WhatsAppInboundJobProducer,
} from "../infra/queue/queueClient";
import { WHATSAPP_INBOUND_QUEUE } from "../infra/queue/jobTypes";
import { LeadsRepository } from "../infra/postgres/LeadsRepository";
import { getRedisUrl } from "../config/redisUrl";
import { requireEnv, readEnvOptional, readPositiveInt } from "./envHelpers";

/** Default 15000. Set to `0` to disable queue depth polling. */
function readQueueDepthIntervalMs(defaultMs: number): number {
  const raw = process.env.METRICS_QUEUE_DEPTH_INTERVAL_MS?.trim();
  if (raw === undefined || raw === "") {
    return defaultMs;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    return defaultMs;
  }
  return n;
}

/**
 * Kill-switch operativo del SafetyPort. Default: habilitado.
 *
 * Cualquier valor distinto de `"false"` (case-insensitive) cuenta como `true`.
 * SAFETY_PORT_ENABLED=false NO desactiva el AI Validation Layer: el pipeline
 * Validation -> Decision -> FSM -> HardGate -> Output sigue activo. Solo
 * sustituye `ProductionAIValidator` por `BasicAIValidator` (que mantiene
 * `isSafe=true` placeholder pero sigue evaluando isComplete/isGrounded/
 * isWithinFSM/confidence).
 */
function readSafetyPortEnabled(defaultValue: boolean): boolean {
  const raw = process.env.SAFETY_PORT_ENABLED?.trim().toLowerCase();
  if (raw === undefined || raw === "") return defaultValue;
  if (raw === "false" || raw === "0" || raw === "no") return false;
  return true;
}

/**
 * Kill-switch operativo del GroundingPort (Lexical Grounding v1).
 * Default: DESHABILITADO. Solo se activa con `GROUNDING_PORT_ENABLED=true|1|yes`.
 *
 * Cuando esta deshabilitado el `ProductionAIValidator` preserva la heuristica
 * base `groundingReferences.length > 0` del `BasicAIValidator`. Cuando esta
 * habilitado, el adapter calcula coverage de bigramas entre `aiOutputText` y
 * `excerpt` de las referencias RAG.
 */
function readGroundingPortEnabled(defaultValue: boolean): boolean {
  const raw = process.env.GROUNDING_PORT_ENABLED?.trim().toLowerCase();
  if (raw === undefined || raw === "") return defaultValue;
  if (raw === "true" || raw === "1" || raw === "yes") return true;
  return false;
}

function readMinConfidence(defaultValue: number): number {
  const raw = process.env.GROUNDING_MIN_CONFIDENCE?.trim();
  if (!raw) return defaultValue;
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0 || n > 1) return defaultValue;
  return n;
}

export type AppContext = {
  orchestrator: Orchestrator;
  sender: YCloudSender;
  metrics: Metrics;
  identityManager: IdentityManager;
  webhookVerifier: YCloudWebhookVerifier;
  idempotency: YCloudInboundIdempotency;
  /**
   * Solo el proceso HTTP encola jobs. El worker no lo usa.
   */
  inboundJobProducer: WhatsAppInboundJobProducer | undefined;
  closeQueueResources: () => Promise<void>;
};

/**
 * Ensambla dependencias compartidas (core + infra). No abre puerto HTTP ni worker.
 *
 * `withInboundQueue`: instancia BullMQ Queue + producer (proceso API únicamente).
 */
export async function createAppContext(
  log: Logger,
  options: { withInboundQueue: boolean },
): Promise<AppContext> {
  await getRedis();

  requireEnv(log, "DATABASE_URL");
  const redisUrl = getRedisUrl();
  requireEnv(log, "OPENAI_API_KEY");
  requireEnv(log, "PINECONE_API_KEY");
  requireEnv(log, "PINECONE_INDEX_HOST");

  const ycloudApiKey = requireEnv(log, "YCLOUD_API_KEY");
  const ycloudFrom = requireEnv(log, "YCLOUD_WHATSAPP_FROM");

  const ycloudBaseUrl = readEnvOptional(
    "YCLOUD_BASE_URL",
    "https://api.ycloud.com/v2",
  );
  const ycloudTimeoutMs = readPositiveInt("YCLOUD_REQUEST_TIMEOUT_MS", 5000);
  const idempotencyTtlSec = readPositiveInt(
    "YCLOUD_INBOUND_IDEMPOTENCY_TTL_SEC",
    300,
  );

  const ycloudWebhookSecret = process.env.YCLOUD_WEBHOOK_SECRET?.trim() || "";
  const rejectUnverified =
    process.env.YCLOUD_WEBHOOK_REJECT_UNVERIFIED_IN_PRODUCTION?.trim() ===
    "true";

  const metrics: Metrics =
    process.env.METRICS_ENABLED === "false"
      ? new NoopMetrics()
      : new PrometheusMetricsAdapter();

  const leadsRepository = new LeadsRepository();

  const ycloudClient = new YCloudClient({
    logger: log,
    apiKey: ycloudApiKey,
    baseUrl: ycloudBaseUrl,
    timeoutMs: ycloudTimeoutMs,
  });

  const ycloudSender = new YCloudSender({
    client: ycloudClient,
    logger: log,
    defaultFrom: ycloudFrom,
  });

  const ycloudVerifier = new YCloudWebhookVerifier({
    logger: log,
    webhookSecret: ycloudWebhookSecret || undefined,
    rejectUnverifiedInProduction: rejectUnverified,
  });

  const ycloudIdempotency = new YCloudInboundIdempotency({
    getRedis,
    logger: log,
    ttlSec: idempotencyTtlSec,
  });

  const embeddingService = new EmbeddingService(log);
  const pineconeRag = new PineconeRAGAdapter(embeddingService, log);
  const rag = new RAGService({
    logger: log,
    adapter: pineconeRag,
    metrics,
  });

  const fsmEngine = new FSMEngine();
  const llmGateway = new LLMGateway({ logger: log, metrics });
  const identityManager = new IdentityManager({
    leadsRepository,
    getRedis,
    logger: log,
  });

  const safetyPortEnabled = readSafetyPortEnabled(true);
  const groundingPortEnabled = readGroundingPortEnabled(false);
  const openaiApiKey = process.env.OPENAI_API_KEY?.trim();

  let aiValidator: AIValidator;
  if (safetyPortEnabled && openaiApiKey) {
    const moderationClient = new OpenAIModerationClient({
      apiKey: openaiApiKey,
      baseUrl: readEnvOptional(
        "OPENAI_MODERATION_BASE_URL",
        "https://api.openai.com/v1",
      ),
      model: readEnvOptional(
        "OPENAI_MODERATION_MODEL",
        "omni-moderation-latest",
      ),
      timeoutMs: readPositiveInt("OPENAI_MODERATION_TIMEOUT_MS", 3000),
      logger: log,
    });
    const safetyPort = new OpenAIModerationSafetyPort({
      client: moderationClient,
      logger: log,
      metrics,
    });

    const groundingPort = groundingPortEnabled
      ? new LexicalGroundingPort({
          client: new LexicalGroundingClient({
            minOutputChars: readPositiveInt("GROUNDING_MIN_OUTPUT_CHARS", 20),
          }),
          minConfidence: readMinConfidence(0.3),
          logger: log,
          metrics,
        })
      : undefined;

    aiValidator = new ProductionAIValidator({
      safetyPort,
      groundingPort,
      base: new BasicAIValidator(),
      logger: log,
      metrics,
      safetyTimeoutMs: readPositiveInt("SAFETY_VALIDATOR_TIMEOUT_MS", 5000),
      groundingTimeoutMs: readPositiveInt("GROUNDING_VALIDATOR_TIMEOUT_MS", 5000),
    });
    log.info(
      { event: "safety_port_wired", provider: "openai_moderation" },
      "safety port enabled",
    );
    if (groundingPort !== undefined) {
      log.info(
        { event: "grounding_port_wired", backend: "lexical_v1" },
        "grounding port enabled (lexical v1)",
      );
    } else {
      log.info(
        { event: "grounding_port_disabled", reason: "kill_switch_default_off" },
        "grounding port disabled (default off; preserving base heuristic)",
      );
    }
  } else {
    aiValidator = new BasicAIValidator();
    log.warn(
      {
        event: "safety_port_disabled",
        reason: !safetyPortEnabled ? "kill_switch" : "missing_openai_api_key",
      },
      "safety port disabled; using BasicAIValidator (isSafe placeholder)",
    );
    if (groundingPortEnabled) {
      log.warn(
        {
          event: "grounding_port_skipped",
          reason: "safety_port_off_basic_validator_in_use",
        },
        "grounding port not wired because BasicAIValidator is in use",
      );
    }
  }

  const aiDecisionMatrix = new BasicDecisionMatrix();
  const aiHardGate = new BasicHardGate();
  const fsmTransitionChecker = new FSMTransitionChecker(fsmEngine);
  const validationMetrics = new NoopValidationMetricsPort();

  const orchestrator = new Orchestrator({
    logger: log,
    metrics,
    leadsRepository,
    fsmEngine,
    llmGateway,
    ragService: rag,
    validator: aiValidator,
    decisionMatrix: aiDecisionMatrix,
    hardGate: aiHardGate,
    fsmTransitionChecker,
    validationMetrics,
  });

  let inboundJobProducer: WhatsAppInboundJobProducer | undefined;
  let queueCloser: () => Promise<void> = async () => {};

  if (options.withInboundQueue) {
    const bullConn = createBullMqConnection(redisUrl);
    const queue = createWhatsAppInboundQueue(bullConn);
    inboundJobProducer = createWhatsAppInboundJobProducer(queue);

    let depthExporter: BullmqQueueDepthExporter | undefined;
    const queueDepthIntervalMs = readQueueDepthIntervalMs(15_000);
    if (queueDepthIntervalMs > 0 && metrics instanceof PrometheusMetricsAdapter) {
      depthExporter = new BullmqQueueDepthExporter({
        queue,
        metrics,
        log,
        queueLabel: WHATSAPP_INBOUND_QUEUE,
        intervalMs: queueDepthIntervalMs,
      });
      depthExporter.start();
    }

    queueCloser = async () => {
      await depthExporter?.stop();
      await queue.close();
      await bullConn.quit();
    };
  }

  return {
    orchestrator,
    sender: ycloudSender,
    metrics,
    identityManager,
    webhookVerifier: ycloudVerifier,
    idempotency: ycloudIdempotency,
    inboundJobProducer,
    closeQueueResources: queueCloser,
  };
}
