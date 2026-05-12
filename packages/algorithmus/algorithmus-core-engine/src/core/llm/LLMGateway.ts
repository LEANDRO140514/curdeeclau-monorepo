import pino, { type Logger } from "pino";
import type { MetricLabels, Metrics } from "../observability/Metrics";
import { NoopMetrics } from "../observability/Metrics";

export type LLMTask =
  | "classify_intent"
  | "extract_slots"
  | "rag_answer"
  | "generate_reply";

export type LLMInput = {
  task: LLMTask;
  input: string;
  traceId?: string;
  /** Para métricas multi-tenant (Prometheus); no afecta al proveedor. */
  tenantId?: string;
};

export type LLMResponse = {
  text: string;
  provider: "ollama" | "openrouter" | "gemini";
  latency_ms: number;
  confidence?: number;
  data?: Record<string, unknown>;
};

const defaultLog = pino({
  level: process.env.LOG_LEVEL ?? "info",
  name: "algorithmus-llm",
});

export type LLMGatewayDeps = {
  logger?: Logger;
  metrics?: Metrics;
};

function isLoggerLike(x: unknown): x is Logger {
  return (
    typeof x === "object" &&
    x !== null &&
    "info" in x &&
    typeof (x as { info?: unknown }).info === "function"
  );
}

const TIMEOUT_MS = 5000;

function abortAfter(ms: number): AbortSignal {
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
    return AbortSignal.timeout(ms);
  }
  const c = new AbortController();
  setTimeout(() => c.abort(new Error("timeout")), ms);
  return c.signal;
}

function metricsTenantLabel(input: LLMInput): MetricLabels {
  const tid = input.tenantId?.trim();
  return { tenant_id: tid && tid.length > 0 ? tid : "unknown" };
}

function tryParseJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const unwrapped = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    const v = JSON.parse(unwrapped) as unknown;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return v as Record<string, unknown>;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function coerceIntent(
  v: unknown,
): "venta" | "soporte" | null {
  if (v === "venta" || v === "soporte") return v;
  if (v === null) return null;
  return null;
}

export class LLMGateway {
  private readonly rootLog: Logger;
  private readonly metrics: Metrics;

  constructor(deps: LLMGatewayDeps);
  constructor(logger?: Logger);
  constructor(arg?: Logger | LLMGatewayDeps) {
    const legacyPositional = isLoggerLike(arg);
    const deps: LLMGatewayDeps = legacyPositional ? { logger: arg } : (arg ?? {});
    this.rootLog = deps.logger ?? defaultLog;
    this.metrics = deps.metrics ?? new NoopMetrics();
    if (legacyPositional) {
      this.rootLog.warn(
        {
          event: "deprecated_constructor_usage",
          service: "LLMGateway",
        },
        "usar new LLMGateway({ logger })",
      );
    }
  }

  async generate(input: LLMInput): Promise<LLMResponse> {
    const log = this.rootLog.child({
      module: "LLMGateway",
      trace_id: input.traceId,
    });

    log.info(
      {
        step: "llm_generate",
        task: input.task,
        inputLength: input.input.length,
      },
      "llm generate",
    );

    const steps = [
      { provider: "ollama" as const, fn: () => this.callOllama(input) },
      { provider: "openrouter" as const, fn: () => this.callOpenRouter(input) },
      { provider: "gemini" as const, fn: () => this.callGemini(input) },
    ];

    const errors: unknown[] = [];
    const tenant = metricsTenantLabel(input);
    for (let i = 0; i < steps.length; i++) {
      const attempt = i + 1;
      const { provider, fn } = steps[i];
      const model = provider;
      this.metrics.incrementCounter("llm_requests_total", 1, {
        ...tenant,
        model,
      });
      const started = process.hrtime.bigint();
      try {
        const res = await fn();
        const seconds = Number(process.hrtime.bigint() - started) / 1e9;
        this.metrics.observeHistogram("llm_latency_seconds", seconds, {
          ...tenant,
          model,
        });
        log.info(
          {
            step: "llm_provider_ok",
            provider: res.provider,
            latency_ms: res.latency_ms,
          },
          "llm provider ok",
        );
        if (attempt > 1) {
          this.metrics.incrementCounter("llm_fallback_success_total", 1, tenant);
          this.metrics.incrementCounter("llm_fallback_total", 1, {
            ...tenant,
            outcome: "recovered",
          });
        }
        return res;
      } catch (e) {
        errors.push(e);
        const seconds = Number(process.hrtime.bigint() - started) / 1e9;
        this.metrics.observeHistogram("llm_latency_seconds", seconds, {
          ...tenant,
          model,
        });
        this.metrics.incrementCounter("llm_failures_total", 1, {
          ...tenant,
          model,
        });
        log.warn(
          {
            step: "llm_provider_fail",
            provider,
            error: e instanceof Error ? e.message : String(e),
          },
          `${provider} falló${attempt < steps.length ? "; fallback" : ""}`,
        );
      }
    }

    this.metrics.incrementCounter("llm_fallback_exhausted_total", 1, tenant);
    this.metrics.incrementCounter("llm_fallback_total", 1, {
      ...tenant,
      outcome: "exhausted",
    });
    const msg = `LLMGateway: todos los proveedores fallaron: ${errors.map(String).join(" | ")}`;
    log.error({ step: "llm_all_providers_failed" }, msg);
    throw new Error(msg);
  }

  private buildUserContent(input: LLMInput): string {
    const preamble = this.taskPreamble(input.task);
    return `${preamble}\n\n${input.input}`;
  }

  private taskPreamble(task: LLMTask): string {
    switch (task) {
      case "classify_intent":
        return (
          'Task: classify intent. Reply with JSON only: {"intent":"venta"|"soporte"|null}'
        );
      case "extract_slots":
        return (
          "Task: extract structured slots from the user message. Reply with JSON only: a single object whose keys are slot names and values are extracted strings or null."
        );
      case "rag_answer":
        return (
          'Task: answer using the provided context. Reply with JSON only: {"text":string,"confidence":number} where confidence is between 0 and 1.'
        );
      case "generate_reply":
        return "Task: generate a natural reply. Reply with plain text only, no JSON wrapper.";
    }
  }

  private normalize(
    task: LLMTask,
    raw: string,
    provider: LLMResponse["provider"],
    latency_ms: number,
  ): LLMResponse {
    switch (task) {
      case "classify_intent": {
        const obj = tryParseJsonObject(raw);
        const intent = obj ? coerceIntent(obj.intent) : null;
        return {
          text: raw.trim(),
          provider,
          latency_ms,
          data: { intent },
        };
      }
      case "extract_slots": {
        const obj = tryParseJsonObject(raw);
        return {
          text: raw.trim(),
          provider,
          latency_ms,
          data: obj ?? {},
        };
      }
      case "rag_answer": {
        const obj = tryParseJsonObject(raw);
        let textOut = raw.trim();
        let confidence: number | undefined;
        if (obj) {
          const t = obj.text;
          if (typeof t === "string") textOut = t;
          const c = obj.confidence;
          if (typeof c === "number" && Number.isFinite(c)) {
            confidence = Math.min(1, Math.max(0, c));
          }
        }
        return {
          text: textOut,
          provider,
          latency_ms,
          confidence: confidence ?? 0,
        };
      }
      case "generate_reply":
        return {
          text: raw.trim(),
          provider,
          latency_ms,
        };
    }
  }

  private async callOllama(input: LLMInput): Promise<LLMResponse> {
    const base =
      typeof process !== "undefined" && process.env?.OLLAMA_BASE_URL
        ? process.env.OLLAMA_BASE_URL.replace(/\/$/, "")
        : "http://127.0.0.1:11434";
    const model =
      (typeof process !== "undefined" && process.env?.OLLAMA_MODEL) || "llama3.2";
    const started = Date.now();
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: abortAfter(TIMEOUT_MS),
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: this.buildUserContent(input) }],
        stream: false,
      }),
    });
    if (!res.ok) {
      throw new Error(`ollama: HTTP ${res.status}`);
    }
    const body = (await res.json()) as {
      message?: { content?: string };
    };
    const content = body.message?.content;
    if (typeof content !== "string") {
      throw new Error("ollama: respuesta sin contenido");
    }
    const latency_ms = Date.now() - started;
    return this.normalize(input.task, content, "ollama", latency_ms);
  }

  private async callOpenRouter(input: LLMInput): Promise<LLMResponse> {
    const key =
      typeof process !== "undefined" ? process.env?.OPENROUTER_API_KEY : undefined;
    if (!key?.trim()) {
      throw new Error("openrouter: OPENROUTER_API_KEY no definida");
    }
    const model =
      (typeof process !== "undefined" && process.env?.OPENROUTER_MODEL) ||
      "openai/gpt-4o-mini";
    const started = Date.now();
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key.trim()}`,
      },
      signal: abortAfter(TIMEOUT_MS),
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: this.buildUserContent(input) }],
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`openrouter: HTTP ${res.status} ${errText.slice(0, 200)}`);
    }
    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = body.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("openrouter: respuesta sin contenido");
    }
    const latency_ms = Date.now() - started;
    return this.normalize(input.task, content, "openrouter", latency_ms);
  }

  private async callGemini(input: LLMInput): Promise<LLMResponse> {
    const key =
      typeof process !== "undefined" ? process.env?.GEMINI_API_KEY : undefined;
    if (!key?.trim()) {
      throw new Error("gemini: GEMINI_API_KEY no definida");
    }
    const model =
      (typeof process !== "undefined" && process.env?.GEMINI_MODEL) ||
      "gemini-1.5-flash";
    const started = Date.now();
    const url = new URL(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    );
    url.searchParams.set("key", key.trim());

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: abortAfter(TIMEOUT_MS),
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: this.buildUserContent(input) }],
          },
        ],
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`gemini: HTTP ${res.status} ${errText.slice(0, 200)}`);
    }
    const body = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text =
      body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text.trim()) {
      throw new Error("gemini: respuesta vacía");
    }
    const latency_ms = Date.now() - started;
    return this.normalize(input.task, text, "gemini", latency_ms);
  }
}
