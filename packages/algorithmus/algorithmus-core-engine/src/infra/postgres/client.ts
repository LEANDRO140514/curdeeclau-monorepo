import {
  Pool,
  type QueryResult,
  type QueryResultRow,
} from "pg";

export type { QueryResult, QueryResultRow } from "pg";

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (typeof url !== "string" || !url.trim()) {
    throw new Error(
      "[postgres] DATABASE_URL no está definida o está vacía en el entorno.",
    );
  }
  return url.trim();
}

let poolInstance: Pool | undefined;

/**
 * Pool singleton (una instancia por proceso). Usala para transacciones (`connect()`)
 * o listeners; para consultas puntuales preferí `query()`.
 */
export function getPool(): Pool {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: requireDatabaseUrl(),
    });
    poolInstance.on("error", (err) => {
      console.error("[postgres] error inesperado en el pool", err);
    });
  }
  return poolInstance;
}

/**
 * Misma instancia que `getPool()`, expuesta como objeto `Pool` para APIs que esperan
 * `pool.query` / `pool.connect` sin llamar a una función.
 */
export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop: keyof Pool | symbol) {
    const instance = getPool();
    const value = Reflect.get(instance, prop, instance) as unknown;
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(instance);
    }
    return value;
  },
});

/**
 * Ejecuta SQL parametrizado usando el pool compartido.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  const p = getPool();
  if (params === undefined) {
    return p.query<T>(text);
  }
  return p.query<T>(text, params as any[]);
}
