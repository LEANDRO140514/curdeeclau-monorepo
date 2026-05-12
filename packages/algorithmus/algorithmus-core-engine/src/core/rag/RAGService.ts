import pino, { type Logger } from "pino";
import type { Metrics } from "../observability/Metrics";

export type RAGQueryInput = {
  tenantId: string;
  query: string;
  topK?: number;
};

export type RAGDocument = {
  id: string;
  content: string;
  score: number;
  metadata?: Record<string, unknown>;
};

export type RAGQueryResult = {
  documents: RAGDocument[];
  usedTopK: number;
};

const DEFAULT_TOP_K = 5;
const MIN_TOP_K = 1;
const MAX_TOP_K = 10;
const MAX_QUERY_LENGTH = 1000;

const defaultLog = pino({
  level: process.env.LOG_LEVEL ?? "info",
  name: "algorithmus-rag",
});

export type RAGVectorAdapter = {
  query(input: RAGQueryInput): Promise<RAGDocument[]>;
};

export type RAGServiceDeps = {
  logger?: Logger;
  /** Retrieval vía adapter (p. ej. PineconeRAGAdapter). */
  adapter?: RAGVectorAdapter;
  /** Alias de función; preferir `adapter` cuando sea instancia con `.query`. */
  vectorSearch?: (input: RAGQueryInput) => Promise<RAGDocument[]>;
  /** Métricas (puerto `Metrics`; inyectado desde composition root). */
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

function resolveRagDeps(
  arg1?: Logger | RAGServiceDeps,
  arg2?: Pick<RAGServiceDeps, "adapter" | "vectorSearch" | "metrics">,
): RAGServiceDeps {
  if (arg2 !== undefined) {
    if (!isLoggerLike(arg1)) {
      throw new Error(
        "RAGService: el segundo argumento solo es válido si el primero es logger",
      );
    }
    return { logger: arg1, ...arg2 };
  }
  if (arg1 === undefined) {
    return {};
  }
  if (isLoggerLike(arg1)) {
    return { logger: arg1 };
  }
  return arg1;
}

export class RAGService {
  private readonly rootLog: Logger;
  private readonly vectorSearch?: (
    input: RAGQueryInput,
  ) => Promise<RAGDocument[]>;
  private readonly metrics?: Metrics;

  constructor(deps: RAGServiceDeps);
  constructor(
    logger: Logger,
    deps: Pick<RAGServiceDeps, "adapter" | "vectorSearch" | "metrics">,
  );
  constructor(
    arg1?: Logger | RAGServiceDeps,
    arg2?: Pick<RAGServiceDeps, "adapter" | "vectorSearch" | "metrics">,
  ) {
    const legacy =
      arg2 !== undefined ||
      (arg1 !== undefined && isLoggerLike(arg1));
    const deps = resolveRagDeps(arg1, arg2);
    this.rootLog = deps.logger ?? defaultLog;
    if (legacy) {
      this.rootLog.warn(
        {
          event: "deprecated_constructor_usage",
          service: "RAGService",
        },
        "usar new RAGService({ logger, adapter })",
      );
    }
    this.vectorSearch =
      deps.adapter != null
        ? (input) => deps.adapter!.query(input)
        : deps.vectorSearch;
    this.metrics = deps.metrics;
  }

  async query(input: RAGQueryInput): Promise<RAGQueryResult> {
    const log = this.rootLog.child({
      module: "RAGService",
      tenant_id: input.tenantId,
    });

    try {
      this.validate(input);
      const usedTopK = input.topK ?? DEFAULT_TOP_K;
      const normalizedQuery = this.normalizeQuery(input.query);

      if (normalizedQuery.length > MAX_QUERY_LENGTH) {
        throw new Error("query too long");
      }

      log.info(
        {
          step: "rag_query_start",
          usedTopK,
          queryLength: normalizedQuery.length,
          query_preview: normalizedQuery.slice(0, 100),
        },
        "rag query start",
      );

      const tenantLabel = { tenant_id: input.tenantId.trim() };
      const m = this.metrics;
      if (m) {
        m.incrementCounter("rag_queries_total", 1, tenantLabel);
      }

      const ragStart = process.hrtime.bigint();
      let documents: RAGDocument[] = [];
      try {
        documents = await this.searchVectorStore(
          input.tenantId.trim(),
          normalizedQuery,
          usedTopK,
        );
      } catch (searchErr) {
        if (m) {
          m.incrementCounter("rag_retrieval_failed_total", 1, tenantLabel);
        }
        throw searchErr;
      } finally {
        if (m) {
          const ragSecs = Number(process.hrtime.bigint() - ragStart) / 1e9;
          m.observeHistogram("rag_latency_seconds", ragSecs, tenantLabel);
        }
      }

      if (documents.length === 0) {
        if (m) {
          m.incrementCounter("rag_no_documents_total", 1, tenantLabel);
        }
        log.info(
          { step: "rag_query_empty", usedTopK },
          "rag query empty",
        );
      } else {
        if (m) {
          m.incrementCounter("rag_queries_with_documents_total", 1, tenantLabel);
        }
        log.info(
          {
            step: "rag_query_ok",
            usedTopK,
            count: documents.length,
          },
          "rag query ok",
        );
      }

      return { documents, usedTopK };
    } catch (err) {
      log.error(
        {
          step: "rag_query_error",
          error: err instanceof Error ? err.message : err,
        },
        "rag query error",
      );
      throw err;
    }
  }

  /** Trim, colapsa espacios internos y minúsculas (útil antes de embeddings). */
  private normalizeQuery(raw: string): string {
    return raw.trim().replace(/\s+/g, " ").toLowerCase();
  }

  private validate(input: RAGQueryInput): void {
    if (typeof input.tenantId !== "string" || !input.tenantId.trim()) {
      throw new Error("RAGService: tenantId es obligatorio y no puede estar vacío");
    }
    if (typeof input.query !== "string" || !input.query.trim()) {
      throw new Error("RAGService: query es obligatoria y no puede estar vacía");
    }
    if (input.topK !== undefined) {
      if (
        !Number.isInteger(input.topK) ||
        input.topK < MIN_TOP_K ||
        input.topK > MAX_TOP_K
      ) {
        throw new Error(
          `RAGService: topK debe ser un entero entre ${MIN_TOP_K} y ${MAX_TOP_K}`,
        );
      }
    }
  }

  private async searchVectorStore(
    tenantId: string,
    query: string,
    topK: number,
  ): Promise<RAGDocument[]> {
    if (!this.vectorSearch) {
      return [];
    }
    return this.vectorSearch({ tenantId, query, topK });
  }
}
