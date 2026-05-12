import pino, { type Logger } from "pino";

const defaultLog = pino({
  level: process.env.LOG_LEVEL ?? "info",
  name: "ycloud-http",
});

const RESPONSE_PREVIEW_MAX = 500;

export type YCloudClientDeps = {
  logger?: Logger;
  apiKey: string;
  baseUrl: string;
  timeoutMs: number;
};

export type YCloudPostResult =
  | { ok: true; status: number; bodyText: string }
  | { ok: false; status: number; bodyText: string; error: string };

/**
 * Cliente HTTP mínimo hacia la API YCloud (sin lógica de negocio).
 * Auth: header oficial `X-API-Key` (documentación YCloud).
 */
export class YCloudClient {
  private readonly log: Logger;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(deps: YCloudClientDeps) {
    this.log = deps.logger ?? defaultLog.child({ module: "YCloudClient" });
    this.apiKey = deps.apiKey;
    this.baseUrl = deps.baseUrl.replace(/\/$/, "");
    this.timeoutMs = deps.timeoutMs;
  }

  async postJson(path: string, body: unknown, traceId?: string): Promise<YCloudPostResult> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const log = this.log.child({
      module: "YCloudClient",
      trace_id: traceId,
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": this.apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const bodyText = await res.text();
      const preview = bodyText.slice(0, RESPONSE_PREVIEW_MAX);

      if (!res.ok) {
        log.error(
          {
            event: "ycloud_http_error",
            status: res.status,
            response_preview: preview,
            path,
          },
          "ycloud HTTP error",
        );
        return {
          ok: false,
          status: res.status,
          bodyText,
          error: `HTTP ${res.status}`,
        };
      }

      return { ok: true, status: res.status, bodyText };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === "AbortError"
            ? "timeout"
            : err.message
          : String(err);
      log.error(
        {
          event: "ycloud_http_error",
          path,
          error: message,
        },
        "ycloud request failed",
      );
      return {
        ok: false,
        status: 0,
        bodyText: "",
        error: message,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
