import { Pinecone } from "@pinecone-database/pinecone";

const ENV_API_KEY = "PINECONE_API_KEY";
const ENV_INDEX_HOST = "PINECONE_INDEX_HOST";

function requireEnv(name: string): string {
  const raw = process.env[name];
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) {
    throw new Error(
      `[pinecone] Variable de entorno obligatoria ausente o vacía: ${name}`,
    );
  }
  return value;
}

/** Host sin protocolo ni barra final (formato esperado por el data plane). */
function normalizeIndexHost(host: string): string {
  return host
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "")
    .trim();
}

let pineconeSingleton: Pinecone | null = null;
let indexSingleton: ReturnType<Pinecone["index"]> | null = null;

/**
 * Cliente Pinecone lazy + singleton. Usa el host del índice directamente (sin resolver por nombre en cada llamada).
 */
export function getPineconeIndex(): ReturnType<Pinecone["index"]> {
  if (indexSingleton) {
    return indexSingleton;
  }

  const apiKey = requireEnv(ENV_API_KEY);
  const hostRaw = requireEnv(ENV_INDEX_HOST);
  const host = normalizeIndexHost(hostRaw);

  pineconeSingleton = new Pinecone({ apiKey });
  indexSingleton = pineconeSingleton.index({ host });

  return indexSingleton;
}
