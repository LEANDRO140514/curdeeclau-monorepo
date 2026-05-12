const FALLBACK_PINECONE_DIMENSION = 1536;

let cachedDim: number | null = null;

/**
 * Dimensión esperada del índice Pinecone y de los embeddings (`PINECONE_DIMENSION`).
 * Debe coincidir con el modelo de embedding (p. ej. text-embedding-3-small → 1536).
 * Valor cacheado en memoria tras la primera lectura (el entorno no suele cambiar en runtime).
 */
export function getExpectedPineconeDimension(): number {
  if (cachedDim !== null) {
    return cachedDim;
  }

  const value = Number(
    process.env.PINECONE_DIMENSION ?? FALLBACK_PINECONE_DIMENSION,
  );

  cachedDim =
    Number.isFinite(value) && value > 0 ? value : FALLBACK_PINECONE_DIMENSION;

  return cachedDim;
}
