import pino, { type Logger } from "pino";

const defaultLog = pino({
  level: process.env.LOG_LEVEL ?? "info",
  name: "openai-moderation-http",
});

const RESPONSE_PREVIEW_MAX = 500;
const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "omni-moderation-latest";
const DEFAULT_TIMEOUT_MS = 3000;

export type OpenAIModerationClientDeps = {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
  logger?: Logger;
};

export type OpenAIModerationInput = {
  readonly text: string;
  readonly traceId?: string;
  readonly tenantId?: string;
};

/**
 * Resultado tipado del cliente HTTP. Nunca lanza por errores semanticos:
 * cualquier fallo (HTTP, timeout, parse, network) se reporta como `error`.
 * El adapter superior decide la policy (fail-closed via SafetyPort).
 */
export type OpenAIModerationResult =
  | {
      readonly kind: "ok";
      readonly flagged: boolean;
      readonly categories: readonly string[];
      readonly model: string;
      readonly latencyMs: number;
    }
  | {
      readonly kind: "error";
      readonly reason: "timeout" | "http" | "parse" | "network" | "empty_input";
      readonly detail: string;
      readonly latencyMs: number;
    };

type ModerationCategoriesShape = Record<string, boolean | null | undefined>;

type ModerationApiResponse = {
  readonly id?: string;
  readonly model?: string;
  readonly results?: readonly {
    readonly flagged?: boolean;
    readonly categories?: ModerationCategoriesShape;
  }[];
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseModerationResponse(
  bodyText: string,
): ModerationApiResponse | null {
  try {
    const v = JSON.parse(bodyText) as unknown;
    return isObject(v) ? (v as ModerationApiResponse) : null;
  } catch {
    return null;
  }
}

function extractActiveCategories(
  shape: ModerationCategoriesShape | undefined,
): readonly string[] {
  if (!shape) return [];
  const labels: string[] = [];
  for (const [key, value] of Object.entries(shape)) {
    if (value === true) labels.push(key);
  }
  return labels;
}

/**
 * Cliente HTTP minimo para `POST /v1/moderations`.
 * Sin logica de policy ni de validacion. Solo HTTP + parse defensivo + timeout.
 *
 * Auth: header `Authorization: Bearer <apiKey>` (estandar OpenAI).
 *
 * NO importa nada de `core/`. NO depende del Validation Layer.
 */
export class OpenAIModerationClient {
  private readonly log: Logger;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(deps: OpenAIModerationClientDeps) {
    this.log =
      deps.logger ?? defaultLog.child({ module: "OpenAIModerationClient" });
    this.apiKey = deps.apiKey;
    this.baseUrl = (deps.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.model = deps.model ?? DEFAULT_MODEL;
    this.timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  async evaluate(input: OpenAIModerationInput): Promise<OpenAIModerationResult> {
    const start = Date.now();
    const log = this.log.child({
      module: "OpenAIModerationClient",
      trace_id: input.traceId,
    });

    const text = input.text.trim();
    if (text.length === 0) {
      return {
        kind: "error",
        reason: "empty_input",
        detail: "input text is empty",
        latencyMs: 0,
      };
    }

    const url = `${this.baseUrl}/moderations`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: text,
        }),
        signal: controller.signal,
      });

      const bodyText = await res.text();
      const latencyMs = Date.now() - start;

      if (!res.ok) {
        log.error(
          {
            event: "openai_moderation_http_error",
            status: res.status,
            response_preview: bodyText.slice(0, RESPONSE_PREVIEW_MAX),
          },
          "openai moderation http error",
        );
        return {
          kind: "error",
          reason: "http",
          detail: `HTTP ${res.status}`,
          latencyMs,
        };
      }

      const parsed = parseModerationResponse(bodyText);
      if (!parsed || !Array.isArray(parsed.results) || parsed.results.length === 0) {
        log.error(
          {
            event: "openai_moderation_parse_error",
            response_preview: bodyText.slice(0, RESPONSE_PREVIEW_MAX),
          },
          "openai moderation parse error",
        );
        return {
          kind: "error",
          reason: "parse",
          detail: "unexpected response shape",
          latencyMs,
        };
      }

      const first = parsed.results[0] ?? {};
      const flagged = first.flagged === true;
      const categories = extractActiveCategories(first.categories);

      return {
        kind: "ok",
        flagged,
        categories,
        model: typeof parsed.model === "string" ? parsed.model : this.model,
        latencyMs,
      };
    } catch (err) {
      const latencyMs = Date.now() - start;
      const isAbort =
        err instanceof Error &&
        (err.name === "AbortError" || /aborted/i.test(err.message));
      const message = err instanceof Error ? err.message : String(err);
      log.error(
        {
          event: "openai_moderation_request_failed",
          error: message,
          aborted: isAbort,
        },
        "openai moderation request failed",
      );
      return {
        kind: "error",
        reason: isAbort ? "timeout" : "network",
        detail: message,
        latencyMs,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
