import pino, { type Logger } from "pino";
import type { Metrics } from "../observability/Metrics";
import type {
  AIValidator,
  GroundingPort,
  GroundingPortInput,
  GroundingPortOutput,
  SafetyPort,
  SafetyPortInput,
  SafetyPortOutput,
  ValidationContext,
  ValidationFlags,
  ValidationMetadata,
  ValidationReasonCode,
  ValidationResult,
} from "./AIValidationLayer";
import { BasicAIValidator } from "./AIValidatorImpl";
import {
  DEFAULT_GROUNDING_POLICY,
  type GroundingPolicy,
} from "./GroundingPolicy";

const DEFAULT_SAFETY_TIMEOUT_MS = 5000;
const DEFAULT_GROUNDING_TIMEOUT_MS = 5000;
const SAFETY_VALIDATIONS = "safety_validation_outcomes_total";
const GROUNDING_VALIDATIONS = "grounding_validation_outcomes_total";

const defaultLog = pino({
  level: process.env.LOG_LEVEL ?? "info",
  name: "production-ai-validator",
});

export type ProductionAIValidatorDeps = {
  readonly safetyPort: SafetyPort;
  /**
   * GroundingPort opcional. Si no se inyecta, el validator preserva
   * `baseResult.flags.isGrounded` (heuristica del `BasicAIValidator`).
   *
   * Para v1 el adapter tipico es `LexicalGroundingPort` (n-gram coverage).
   */
  readonly groundingPort?: GroundingPort;
  readonly groundingPolicy?: GroundingPolicy;
  readonly groundingTimeoutMs?: number;
  readonly base?: AIValidator;
  readonly logger?: Logger;
  readonly metrics?: Metrics;
  readonly safetyTimeoutMs?: number;
};

type SafetyEvaluation =
  | { readonly kind: "ok"; readonly output: SafetyPortOutput }
  | { readonly kind: "error"; readonly detail: string; readonly timedOut: boolean };

/**
 * Resultado interno de la evaluacion de grounding desde el validator.
 *
 *   - `skipped_no_port` -> no se inyecto adapter; preservar base.
 *   - `skipped_task`    -> task fuera de `evaluatedTasks`; preservar base.
 *   - `no_refs`         -> task evaluable pero sin referencias; isGrounded=false.
 *   - `empty_output`    -> task evaluable pero aiOutputText vacio; isGrounded=false.
 *   - `ok`              -> el adapter respondio (puede ser grounded o no).
 *   - `error`           -> el adapter lanzo, hizo timeout o fallo internamente
 *                          -> fail-closed con port_unavailable.
 */
type GroundingEvaluation =
  | { readonly kind: "skipped_no_port" }
  | { readonly kind: "skipped_task" }
  | { readonly kind: "no_refs" }
  | { readonly kind: "empty_output" }
  | { readonly kind: "ok"; readonly output: GroundingPortOutput }
  | {
      readonly kind: "error";
      readonly detail: string;
      readonly timedOut: boolean;
    };

function dedupReasonCodes(
  codes: readonly ValidationReasonCode[],
): readonly ValidationReasonCode[] {
  const seen = new Set<ValidationReasonCode>();
  const out: ValidationReasonCode[] = [];
  for (const c of codes) {
    if (!seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  return out;
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label}_timeout_${ms}ms`)),
      ms,
    );
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}

function tenantLabel(ctx: ValidationContext): string {
  const t = ctx.tenantId?.trim();
  return t && t.length > 0 ? t : "unknown";
}

/**
 * Validator de produccion. Compone `BasicAIValidator` (flags base) con un
 * `SafetyPort` y opcionalmente un `GroundingPort`.
 *
 * Garantia (fail-closed) del SafetyPort:
 *   - retorna isSafe=true        -> flags.isSafe = true.
 *   - retorna isSafe=false       -> flags.isSafe = false + reasonCode `unsafe_content`.
 *   - lanza, timeout o error     -> flags.isSafe = false + reasonCode `port_unavailable`.
 *
 * Garantia del GroundingPort (Lexical Grounding v1 cuando esta cableado):
 *   - port no inyectado / task fuera de scope -> preserva `baseResult.flags.isGrounded`.
 *   - sin referencias / output vacio          -> isGrounded=false + `ungrounded_output`.
 *   - port retorna isGrounded=true            -> isGrounded=true.
 *   - port retorna isGrounded=false           -> isGrounded=false + `ungrounded_output`.
 *   - port lanza, timeout o error             -> isGrounded=false + `port_unavailable`.
 *
 * `isComplete`, `isWithinFSM` y `confidence` provienen del `BasicAIValidator`
 * y se preservan tal cual.
 *
 * NO importa adapters concretos. Solo conoce las interfaces `SafetyPort` y
 * `GroundingPort` del core.
 */
export class ProductionAIValidator implements AIValidator {
  private readonly safetyPort: SafetyPort;
  private readonly groundingPort: GroundingPort | undefined;
  private readonly groundingPolicy: GroundingPolicy;
  private readonly base: AIValidator;
  private readonly log: Logger;
  private readonly metrics?: Metrics;
  private readonly safetyTimeoutMs: number;
  private readonly groundingTimeoutMs: number;

  constructor(deps: ProductionAIValidatorDeps) {
    this.safetyPort = deps.safetyPort;
    this.groundingPort = deps.groundingPort;
    this.groundingPolicy = deps.groundingPolicy ?? DEFAULT_GROUNDING_POLICY;
    this.base = deps.base ?? new BasicAIValidator();
    this.log =
      deps.logger ?? defaultLog.child({ module: "ProductionAIValidator" });
    this.metrics = deps.metrics;
    this.safetyTimeoutMs = deps.safetyTimeoutMs ?? DEFAULT_SAFETY_TIMEOUT_MS;
    this.groundingTimeoutMs =
      deps.groundingTimeoutMs ?? DEFAULT_GROUNDING_TIMEOUT_MS;
  }

  async validate(context: ValidationContext): Promise<ValidationResult> {
    const baseResult = await this.base.validate(context);
    const safety = await this.evaluateSafetyResilient(context);
    const grounding = await this.evaluateGroundingResilient(
      context,
      baseResult.flags.isGrounded,
    );

    const tenant = tenantLabel(context);

    let isSafe: boolean;
    let safetyExtraReasonCodes: readonly ValidationReasonCode[];
    let safetyLabels: readonly string[] | undefined;

    if (safety.kind === "ok") {
      const out = safety.output;
      isSafe = out.isSafe === true;
      safetyLabels = out.labels;
      if (!isSafe) {
        safetyExtraReasonCodes = [
          ...out.reasonCodes,
          ...(out.reasonCodes.includes("unsafe_content")
            ? []
            : (["unsafe_content"] as const)),
        ];
        this.metrics?.incrementCounter(SAFETY_VALIDATIONS, 1, {
          outcome: "unsafe",
          tenant_id: tenant,
        });
        this.log.info(
          {
            step: "safety_validation",
            outcome: "unsafe",
            tenant_id: tenant,
            trace_id: context.traceId,
            labels: out.labels,
          },
          "safety validation unsafe",
        );
      } else {
        safetyExtraReasonCodes = out.reasonCodes;
        this.metrics?.incrementCounter(SAFETY_VALIDATIONS, 1, {
          outcome: "safe",
          tenant_id: tenant,
        });
      }
    } else {
      isSafe = false;
      safetyExtraReasonCodes = ["port_unavailable"];
      safetyLabels = undefined;
      this.metrics?.incrementCounter(SAFETY_VALIDATIONS, 1, {
        outcome: "error",
        tenant_id: tenant,
        timed_out: safety.timedOut ? "true" : "false",
      });
      this.log.warn(
        {
          step: "safety_validation",
          outcome: "error",
          timed_out: safety.timedOut,
          detail: safety.detail,
          tenant_id: tenant,
          trace_id: context.traceId,
        },
        "safety validation failed; fail-closed",
      );
    }

    const groundingResolved = this.resolveGrounding(
      grounding,
      baseResult.flags.isGrounded,
      tenant,
      context,
    );

    const mergedFlags: ValidationFlags = {
      isSafe,
      isGrounded: groundingResolved.isGrounded,
      isComplete: baseResult.flags.isComplete,
      isWithinFSM: baseResult.flags.isWithinFSM,
    };

    const mergedReasonCodes = dedupReasonCodes([
      ...baseResult.reasonCodes,
      ...safetyExtraReasonCodes,
      ...groundingResolved.extraReasonCodes,
    ]);

    const mergedMetadata: ValidationMetadata = {
      ...baseResult.metadata,
      validatorName: "ProductionAIValidator",
      validatorVersion: "1.0.0",
      evaluatedAtIso: new Date().toISOString(),
      ...(safetyLabels !== undefined && safetyLabels.length > 0
        ? { safetyLabels }
        : {}),
      ...(groundingResolved.referenceIds !== undefined &&
      groundingResolved.referenceIds.length > 0
        ? { groundingReferenceIds: groundingResolved.referenceIds }
        : {}),
    };

    return {
      flags: mergedFlags,
      scores: baseResult.scores,
      reasonCodes: mergedReasonCodes,
      metadata: mergedMetadata,
    };
  }

  private async evaluateSafetyResilient(
    context: ValidationContext,
  ): Promise<SafetyEvaluation> {
    const safetyInput: SafetyPortInput = {
      tenantId: context.tenantId,
      traceId: context.traceId,
      userMessage: context.userMessage,
      aiOutputText: context.aiOutput.text,
    };

    try {
      const output = await withTimeout(
        Promise.resolve().then(() => this.safetyPort.evaluate(safetyInput)),
        this.safetyTimeoutMs,
        "safety_port",
      );
      return { kind: "ok", output };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const timedOut = /_timeout_\d+ms$/.test(message);
      return { kind: "error", detail: message, timedOut };
    }
  }

  /**
   * Evalua grounding aplicando la `GroundingPolicy` y la lista de tareas
   * evaluables. NUNCA lanza: cualquier error/timeout se materializa como
   * `{ kind: "error" }` para que el caller traduzca a fail-closed.
   *
   * Decisiones de corto-circuito (no se invoca el port):
   *   - `groundingPort` no inyectado            -> `skipped_no_port`.
   *   - `context.task` fuera de `evaluatedTasks` -> `skipped_task`.
   *   - `groundingReferences` vacias             -> `no_refs`.
   *   - `aiOutput.text` vacio post-trim          -> `empty_output`.
   *
   * `_baseIsGrounded` se acepta pero se usa unicamente en el caller
   * (`resolveGrounding`) cuando no hay decision activa del validator.
   */
  private async evaluateGroundingResilient(
    context: ValidationContext,
    _baseIsGrounded: boolean,
  ): Promise<GroundingEvaluation> {
    if (this.groundingPort === undefined) {
      return { kind: "skipped_no_port" };
    }

    if (!this.groundingPolicy.evaluatedTasks.has(context.task)) {
      return { kind: "skipped_task" };
    }

    const refs = context.groundingReferences ?? [];
    if (refs.length === 0) {
      return { kind: "no_refs" };
    }

    const aiText = context.aiOutput.text?.trim() ?? "";
    if (aiText.length === 0) {
      return { kind: "empty_output" };
    }

    const groundingInput: GroundingPortInput = {
      tenantId: context.tenantId,
      traceId: context.traceId,
      aiOutputText: aiText,
      references: refs,
    };

    try {
      const output = await withTimeout(
        Promise.resolve().then(() =>
          this.groundingPort!.evaluate(groundingInput),
        ),
        this.groundingTimeoutMs,
        "grounding_port",
      );
      return { kind: "ok", output };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const timedOut = /_timeout_\d+ms$/.test(message);
      return { kind: "error", detail: message, timedOut };
    }
  }

  /**
   * Traduce el resultado interno del grounding a la triple
   * `(isGrounded, extraReasonCodes, referenceIds?)` que el `validate()`
   * mergea sobre el `baseResult`. Tambien emite la metrica
   * `grounding_validation_outcomes_total` cuando el validator decide
   * activamente (no en `skipped_*`).
   */
  private resolveGrounding(
    grounding: GroundingEvaluation,
    baseIsGrounded: boolean,
    tenant: string,
    context: ValidationContext,
  ): {
    readonly isGrounded: boolean;
    readonly extraReasonCodes: readonly ValidationReasonCode[];
    readonly referenceIds?: readonly string[];
  } {
    switch (grounding.kind) {
      case "skipped_no_port":
      case "skipped_task":
        return { isGrounded: baseIsGrounded, extraReasonCodes: [] };

      case "no_refs":
      case "empty_output": {
        const reason: "no_refs" | "empty_output" = grounding.kind;
        this.metrics?.incrementCounter(GROUNDING_VALIDATIONS, 1, {
          outcome: "ungrounded",
          tenant_id: tenant,
          reason,
        });
        this.log.info(
          {
            step: "grounding_validation",
            outcome: "ungrounded",
            reason,
            tenant_id: tenant,
            trace_id: context.traceId,
          },
          "grounding skipped at validator (insufficient input)",
        );
        return {
          isGrounded: false,
          extraReasonCodes: ["ungrounded_output"],
        };
      }

      case "ok": {
        const out = grounding.output;
        const isGrounded = out.isGrounded === true;
        const outcome: "grounded" | "ungrounded" = isGrounded
          ? "grounded"
          : "ungrounded";
        this.metrics?.incrementCounter(GROUNDING_VALIDATIONS, 1, {
          outcome,
          tenant_id: tenant,
        });
        this.log.info(
          {
            step: "grounding_validation",
            outcome,
            confidence: out.confidence,
            tenant_id: tenant,
            trace_id: context.traceId,
          },
          "grounding validation evaluated",
        );

        const extra: ValidationReasonCode[] = [...out.reasonCodes];
        if (!isGrounded && !extra.includes("ungrounded_output")) {
          extra.push("ungrounded_output");
        }

        return {
          isGrounded,
          extraReasonCodes: extra,
          referenceIds: out.referenceIds,
        };
      }

      case "error": {
        this.metrics?.incrementCounter(GROUNDING_VALIDATIONS, 1, {
          outcome: "error",
          tenant_id: tenant,
          timed_out: grounding.timedOut ? "true" : "false",
        });
        this.log.warn(
          {
            step: "grounding_validation",
            outcome: "error",
            timed_out: grounding.timedOut,
            detail: grounding.detail,
            tenant_id: tenant,
            trace_id: context.traceId,
          },
          "grounding validation failed; fail-closed",
        );
        return {
          isGrounded: false,
          extraReasonCodes: ["port_unavailable"],
        };
      }
    }
  }
}
