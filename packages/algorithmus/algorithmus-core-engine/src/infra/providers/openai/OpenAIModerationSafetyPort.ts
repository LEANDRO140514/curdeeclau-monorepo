import pino, { type Logger } from "pino";
import type { Metrics } from "../../../core/observability/Metrics";
import type {
  SafetyPort,
  SafetyPortInput,
  SafetyPortOutput,
  ValidationReasonCode,
} from "../../../core/validation/AIValidationLayer";
import {
  OpenAIModerationClient,
  type OpenAIModerationResult,
} from "./OpenAIModerationClient";

const defaultLog = pino({
  level: process.env.LOG_LEVEL ?? "info",
  name: "openai-moderation-safety-port",
});

const SAFETY_EVENTS = "safety_port_evaluations_total";
const SAFETY_LATENCY = "safety_port_latency_seconds";
const USER_AI_SEPARATOR = "\n---\n";

export type OpenAIModerationSafetyPortDeps = {
  client: OpenAIModerationClient;
  logger?: Logger;
  metrics?: Metrics;
};

function buildModerationInputText(input: SafetyPortInput): string {
  const user = input.userMessage?.trim() ?? "";
  const ai = input.aiOutputText?.trim() ?? "";
  if (user.length > 0 && ai.length > 0) {
    return `${user}${USER_AI_SEPARATOR}${ai}`;
  }
  return ai.length > 0 ? ai : user;
}

function tenantLabel(input: SafetyPortInput): string {
  const t = input.tenantId?.trim();
  return t && t.length > 0 ? t : "unknown";
}

/**
 * Adapter `SafetyPort` sobre OpenAI Moderation API.
 *
 * Contrato:
 *   - Resuelve siempre con un `SafetyPortOutput`.
 *   - HTTP/parse/timeout/network -> `{ isSafe: false, reasonCodes: ["port_unavailable"] }`.
 *     El validator interpreta como fail-closed.
 *   - flagged=true -> `{ isSafe: false, reasonCodes: ["unsafe_content"], labels: [categorias activas] }`.
 *   - flagged=false -> `{ isSafe: true, reasonCodes: [], labels: [] }`.
 *
 * Importa solo la INTERFAZ `SafetyPort` desde el core. El core no conoce
 * a este adapter ni a OpenAI.
 */
export class OpenAIModerationSafetyPort implements SafetyPort {
  private readonly client: OpenAIModerationClient;
  private readonly log: Logger;
  private readonly metrics?: Metrics;

  constructor(deps: OpenAIModerationSafetyPortDeps) {
    this.client = deps.client;
    this.log =
      deps.logger ??
      defaultLog.child({ module: "OpenAIModerationSafetyPort" });
    this.metrics = deps.metrics;
  }

  async evaluate(input: SafetyPortInput): Promise<SafetyPortOutput> {
    const text = buildModerationInputText(input);
    const tenant = tenantLabel(input);

    const result: OpenAIModerationResult = await this.client.evaluate({
      text,
      traceId: input.traceId,
      tenantId: input.tenantId,
    });

    if (result.kind === "error") {
      this.log.warn(
        {
          event: "safety_port_failure",
          reason: result.reason,
          detail: result.detail,
          tenant_id: tenant,
          trace_id: input.traceId,
        },
        "safety port failure",
      );
      this.metrics?.incrementCounter(SAFETY_EVENTS, 1, {
        outcome: "error",
        reason: result.reason,
        tenant_id: tenant,
      });
      this.metrics?.observeHistogram(
        SAFETY_LATENCY,
        result.latencyMs / 1000,
        { outcome: "error", tenant_id: tenant },
      );
      const reasonCodes: readonly ValidationReasonCode[] = ["port_unavailable"];
      return {
        isSafe: false,
        reasonCodes,
        labels: [],
      };
    }

    const outcome = result.flagged ? "unsafe" : "safe";
    this.metrics?.incrementCounter(SAFETY_EVENTS, 1, {
      outcome,
      tenant_id: tenant,
    });
    this.metrics?.observeHistogram(
      SAFETY_LATENCY,
      result.latencyMs / 1000,
      { outcome, tenant_id: tenant },
    );

    if (result.flagged) {
      const reasonCodes: readonly ValidationReasonCode[] = ["unsafe_content"];
      return {
        isSafe: false,
        reasonCodes,
        labels: result.categories,
      };
    }

    return {
      isSafe: true,
      reasonCodes: [],
      labels: result.categories,
    };
  }
}
