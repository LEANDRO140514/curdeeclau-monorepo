import pino, { type Logger } from "pino";
import type { Metrics } from "../../core/observability/Metrics";
import type {
  GroundingPort,
  GroundingPortInput,
  GroundingPortOutput,
  ValidationReasonCode,
} from "../../core/validation/AIValidationLayer";
import { LexicalGroundingClient } from "./LexicalGroundingClient";

const defaultLog = pino({
  level: process.env.LOG_LEVEL ?? "info",
  name: "lexical-grounding-port",
});

const GROUNDING_EVENTS = "grounding_port_evaluations_total";
const GROUNDING_LATENCY = "grounding_port_latency_seconds";

export type LexicalGroundingPortDeps = {
  readonly client: LexicalGroundingClient;
  readonly minConfidence: number;
  readonly logger?: Logger;
  readonly metrics?: Metrics;
};

function tenantLabel(input: GroundingPortInput): string {
  const t = input.tenantId?.trim();
  return t && t.length > 0 ? t : "unknown";
}

/**
 * Lexical Grounding v1 — adapter `GroundingPort`.
 *
 * Contrato:
 *   - Resuelve siempre con un `GroundingPortOutput`. NUNCA lanza por entrada
 *     vacia o sin referencias.
 *   - `kind === "empty_input"` (texto IA muy corto / sin bigramas / refs sin
 *     excerpt) -> `{ isGrounded: false, confidence: 0, reasonCodes: ["ungrounded_output"] }`.
 *     NO se reporta como `port_unavailable`: no hay error de port; hay datos
 *     insuficientes para evaluar.
 *   - `kind === "ok"` -> `isGrounded = score >= minConfidence`.
 *
 * Importa SOLO la interfaz `GroundingPort` desde el core. El core no conoce
 * a este adapter ni al cliente lexical.
 */
export class LexicalGroundingPort implements GroundingPort {
  private readonly client: LexicalGroundingClient;
  private readonly minConfidence: number;
  private readonly log: Logger;
  private readonly metrics?: Metrics;

  constructor(deps: LexicalGroundingPortDeps) {
    this.client = deps.client;
    this.minConfidence = deps.minConfidence;
    this.log =
      deps.logger ??
      defaultLog.child({ module: "LexicalGroundingPort" });
    this.metrics = deps.metrics;
  }

  async evaluate(input: GroundingPortInput): Promise<GroundingPortOutput> {
    const tenant = tenantLabel(input);
    const result = this.client.score(input.aiOutputText, input.references);

    if (result.kind === "empty_input") {
      this.metrics?.incrementCounter(GROUNDING_EVENTS, 1, {
        outcome: "ungrounded",
        reason: result.reason,
        tenant_id: tenant,
      });
      this.metrics?.observeHistogram(
        GROUNDING_LATENCY,
        result.latencyMs / 1000,
        { outcome: "ungrounded", tenant_id: tenant },
      );
      this.log.info(
        {
          step: "grounding_evaluation",
          outcome: "ungrounded",
          reason: result.reason,
          tenant_id: tenant,
          trace_id: input.traceId,
        },
        "lexical grounding empty input",
      );
      const reasonCodes: readonly ValidationReasonCode[] = [
        "ungrounded_output",
      ];
      return {
        isGrounded: false,
        confidence: 0,
        reasonCodes,
        referenceIds: [],
      };
    }

    const isGrounded = result.score >= this.minConfidence;
    const outcome = isGrounded ? "grounded" : "ungrounded";

    this.metrics?.incrementCounter(GROUNDING_EVENTS, 1, {
      outcome,
      tenant_id: tenant,
    });
    this.metrics?.observeHistogram(
      GROUNDING_LATENCY,
      result.latencyMs / 1000,
      { outcome, tenant_id: tenant },
    );

    this.log.info(
      {
        step: "grounding_evaluation",
        outcome,
        score: result.score,
        covered_bigrams: result.coveredBigrams,
        total_bigrams: result.totalBigrams,
        threshold: this.minConfidence,
        tenant_id: tenant,
        trace_id: input.traceId,
      },
      "lexical grounding evaluation",
    );

    const reasonCodes: readonly ValidationReasonCode[] = isGrounded
      ? []
      : ["ungrounded_output"];

    return {
      isGrounded,
      confidence: result.score,
      reasonCodes,
      referenceIds: input.references.map((r) => r.id),
    };
  }
}
