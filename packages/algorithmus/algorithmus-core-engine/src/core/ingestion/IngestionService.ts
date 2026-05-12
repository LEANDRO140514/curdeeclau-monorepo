import pino, { type Logger } from "pino";
import type { EmbeddingService } from "../embedding/EmbeddingService";
import { getExpectedPineconeDimension } from "../embedding/pineconeDimension";
import { getPineconeIndex } from "../../infra/pinecone/client";

export type IngestionInput = {
  tenantId: string;
  documentId: string;
  content: string;
};

export type Chunk = {
  id: string;
  text: string;
};

const MAX_CONTENT_CHARS = 50_000;
const MAX_CHUNKS = 200;
const CHUNK_MIN = 300;
const CHUNK_MAX = 500;
const CHUNK_OVERLAP = 50;

const defaultLog = pino({
  level: process.env.LOG_LEVEL ?? "info",
  name: "algorithmus-ingestion",
});

type IngestionChunkMetadata = {
  content: string;
  documentId: string;
  chunkIndex: number;
};

export class IngestionService {
  private readonly rootLog: Logger;

  constructor(
    private readonly embeddingService: EmbeddingService,
    logger?: Logger,
  ) {
    this.rootLog = logger ?? defaultLog;
  }

  async ingest(input: IngestionInput): Promise<void> {
    const log = this.rootLog.child({
      module: "IngestionService",
      tenant_id: input.tenantId,
    });

    try {
      this.validate(input);

      log.info(
        {
          step: "ingestion_start",
          documentId: input.documentId,
          contentLength: input.content.length,
        },
        "ingestion start",
      );

      const provisional = this.chunkText(this.cleanContentText(input.content));
      const chunks: Chunk[] = provisional.map((c, chunkIndex) => ({
        id: `${input.documentId}_${chunkIndex}`,
        text: this.cleanContentText(c.text),
      }));

      if (chunks.length > MAX_CHUNKS) {
        throw new Error("too many chunks");
      }

      log.info(
        {
          step: "ingestion_chunked",
          count: chunks.length,
        },
        "ingestion chunked",
      );

      const records: Array<{
        id: string;
        values: number[];
        metadata: IngestionChunkMetadata;
      }> = [];

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
        const chunk = chunks[chunkIndex];
        const textForStore = this.cleanContentText(chunk.text);

        const embedResult = await this.embeddingService.embed({
          text: textForStore,
        });
        const vector = embedResult.vector;

        const expectedDim = getExpectedPineconeDimension();
        if (vector.length !== expectedDim) {
          throw new Error("invalid embedding dimension");
        }

        log.info(
          {
            step: "embedding_used",
            dimensions: vector.length,
          },
          "embedding used",
        );

        records.push({
          id: chunk.id,
          values: vector,
          metadata: {
            content: textForStore,
            documentId: input.documentId,
            chunkIndex,
          },
        });
      }

      const index = getPineconeIndex();
      await index.namespace(input.tenantId.trim()).upsert({
        records,
      });

      log.info(
        {
          step: "ingestion_upsert_ok",
          count: records.length,
        },
        "ingestion upsert ok",
      );
    } catch (err) {
      log.error(
        {
          step: "ingestion_error",
          error: err instanceof Error ? err.message : String(err),
        },
        "ingestion error",
      );
      throw err;
    }
  }

  private validate(input: IngestionInput): void {
    if (typeof input.tenantId !== "string" || !input.tenantId.trim()) {
      throw new Error("IngestionService: tenantId es obligatorio");
    }
    if (typeof input.documentId !== "string" || !input.documentId.trim()) {
      throw new Error("IngestionService: documentId es obligatorio");
    }
    if (typeof input.content !== "string" || !input.content.trim()) {
      throw new Error("IngestionService: content no puede estar vacío");
    }
    if (input.content.length >= MAX_CONTENT_CHARS) {
      throw new Error(
        `IngestionService: content debe tener menos de ${MAX_CONTENT_CHARS} caracteres`,
      );
    }
  }

  private cleanContentText(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }

  /**
   * Trocea por ~300–500 caracteres con solape ~50, en límites de palabra.
   * Devuelve `Chunk` con `id` provisional (índice); `ingest` reasigna a `documentId_index`.
   * Espera texto ya normalizado con {@link cleanContentText}.
   */
  private chunkText(text: string): Chunk[] {
    const normalized = this.cleanContentText(text);
    if (!normalized) {
      return [];
    }

    const pieces: string[] = [];
    let start = 0;

    while (start < normalized.length) {
      const remaining = normalized.length - start;
      if (remaining <= CHUNK_MAX) {
        const tail = normalized.slice(start).trim();
        if (tail.length > 0) {
          pieces.push(tail);
        }
        break;
      }

      const hardEnd = start + CHUNK_MAX;
      const minEnd = start + CHUNK_MIN;
      let cut = this.findWordBoundaryCut(normalized, minEnd, hardEnd);

      const slice = normalized.slice(start, cut).trimEnd();
      if (slice.length > 0) {
        pieces.push(slice);
      }

      if (cut >= normalized.length) {
        break;
      }

      start = this.nextStartWithOverlap(normalized, start, cut, CHUNK_OVERLAP);
      if (start >= cut) {
        start = cut;
        while (start < normalized.length && normalized[start] === " ") {
          start += 1;
        }
      }
    }

    return pieces.map((t, i) => ({
      id: String(i),
      text: t,
    }));
  }

  /** Último espacio en [minEnd, hardEnd); si no hay, primer espacio desde minEnd o hardEnd. */
  private findWordBoundaryCut(
    s: string,
    minEnd: number,
    hardEnd: number,
  ): number {
    let cut = hardEnd;
    while (cut > minEnd && s[cut - 1] !== " ") {
      cut -= 1;
    }
    if (cut > minEnd) {
      return cut;
    }
    cut = minEnd;
    while (cut < hardEnd && s[cut] !== " ") {
      cut += 1;
    }
    if (cut < hardEnd) {
      return cut;
    }
    return hardEnd;
  }

  private nextStartWithOverlap(
    s: string,
    chunkStart: number,
    cut: number,
    overlap: number,
  ): number {
    let pos = cut;
    let back = 0;
    while (pos > chunkStart && back < overlap) {
      pos -= 1;
      back += 1;
    }
    while (pos > chunkStart && s[pos - 1] !== " ") {
      pos -= 1;
    }
    if (pos <= chunkStart) {
      pos = cut;
    }
    while (pos < s.length && s[pos] === " ") {
      pos += 1;
    }
    return pos;
  }

}
