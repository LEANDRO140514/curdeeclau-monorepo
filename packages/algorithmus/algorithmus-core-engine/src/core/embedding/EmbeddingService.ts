import pino, { type Logger } from "pino";
import { getExpectedPineconeDimension } from "./pineconeDimension";

export type EmbeddingInput = {
  text: string;
};

export type EmbeddingResult = {
  vector: number[];
  dimensions: number;
};

const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
const DEFAULT_MODEL = "text-embedding-3-small";
const TIMEOUT_MS = 5000;
const MAX_TEXT_LENGTH = 2000;

const defaultLog = pino({
  level: process.env.LOG_LEVEL ?? "info",
  name: "algorithmus-embedding",
});

function requireApiKey(): string {
  const raw = process.env.OPENAI_API_KEY;
  const key = typeof raw === "string" ? raw.trim() : "";
  if (!key) {
    throw new Error("EmbeddingService: OPENAI_API_KEY es obligatoria");
  }
  return key;
}

function resolveModel(): string {
  const raw = process.env.OPENAI_EMBEDDING_MODEL;
  const m = typeof raw === "string" ? raw.trim() : "";
  return m || DEFAULT_MODEL;
}

function isNumberArray(v: unknown): v is number[] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every((x) => typeof x === "number" && Number.isFinite(x))
  );
}

function parseEmbeddingResponse(json: unknown): number[] {
  if (!json || typeof json !== "object") {
    throw new Error("EmbeddingService: respuesta JSON inválida");
  }
  const data = (json as { data?: unknown }).data;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("EmbeddingService: respuesta sin data[]");
  }
  const first = data[0];
  if (!first || typeof first !== "object") {
    throw new Error("EmbeddingService: data[0] inválido");
  }
  const embedding = (first as { embedding?: unknown }).embedding;
  if (!isNumberArray(embedding)) {
    throw new Error("EmbeddingService: embedding inválido o vacío");
  }
  return embedding;
}

export class EmbeddingService {
  private readonly rootLog: Logger;

  constructor(logger?: Logger) {
    this.rootLog = logger ?? defaultLog;
  }

  async embed(input: EmbeddingInput): Promise<EmbeddingResult> {
    const log = this.rootLog.child({
      module: "EmbeddingService",
    });

    const text = typeof input.text === "string" ? input.text : "";
    if (!text.trim()) {
      log.error(
        { step: "embedding_error", error: "text vacío" },
        "embedding error",
      );
      throw new Error("EmbeddingService: text no puede estar vacío");
    }
    if (text.length >= MAX_TEXT_LENGTH) {
      log.error(
        { step: "embedding_error", error: "text demasiado largo" },
        "embedding error",
      );
      throw new Error(
        `EmbeddingService: text debe tener menos de ${MAX_TEXT_LENGTH} caracteres`,
      );
    }

    log.info(
      {
        step: "embedding_start",
        textLength: text.length,
      },
      "embedding start",
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const apiKey = requireApiKey();
      const model = resolveModel();

      const res = await fetch(OPENAI_EMBEDDINGS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: text,
        }),
        signal: controller.signal,
      });

      const rawBody = await res.text();
      let json: unknown;
      try {
        json = JSON.parse(rawBody) as unknown;
      } catch {
        throw new Error("EmbeddingService: cuerpo de respuesta no es JSON");
      }

      if (!res.ok) {
        const msg =
          json &&
          typeof json === "object" &&
          "error" in json &&
          json.error &&
          typeof json.error === "object" &&
          "message" in json.error &&
          typeof (json.error as { message: unknown }).message === "string"
            ? (json.error as { message: string }).message
            : `HTTP ${res.status}`;
        throw new Error(`EmbeddingService: ${msg}`);
      }

      const vector = parseEmbeddingResponse(json);
      if (vector.length === 0) {
        throw new Error("EmbeddingService: vector vacío");
      }

      const expectedDim = getExpectedPineconeDimension();
      if (vector.length !== expectedDim) {
        throw new Error("invalid embedding dimension");
      }

      const result: EmbeddingResult = {
        vector,
        dimensions: vector.length,
      };

      log.info(
        {
          step: "embedding_ok",
          dimensions: result.dimensions,
        },
        "embedding ok",
      );

      return result;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === "AbortError"
            ? "timeout"
            : err.message
          : String(err);
      log.error(
        {
          step: "embedding_error",
          error: message,
        },
        "embedding error",
      );
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("EmbeddingService: timeout");
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
