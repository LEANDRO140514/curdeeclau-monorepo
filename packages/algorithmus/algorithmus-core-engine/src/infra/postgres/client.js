"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.getPool = getPool;
exports.query = query;
const pg_1 = require("pg");
function requireDatabaseUrl() {
    const url = process.env.DATABASE_URL;
    if (typeof url !== "string" || !url.trim()) {
        throw new Error("[postgres] DATABASE_URL no está definida o está vacía en el entorno.");
    }
    return url.trim();
}
let poolInstance;
/**
 * Pool singleton (una instancia por proceso). Usala para transacciones (`connect()`)
 * o listeners; para consultas puntuales preferí `query()`.
 */
function getPool() {
    if (!poolInstance) {
        poolInstance = new pg_1.Pool({
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
exports.pool = new Proxy({}, {
    get(_target, prop) {
        const instance = getPool();
        const value = Reflect.get(instance, prop, instance);
        if (typeof value === "function") {
            return value.bind(instance);
        }
        return value;
    },
});
/**
 * Ejecuta SQL parametrizado usando el pool compartido.
 */
async function query(text, params) {
    const p = getPool();
    if (params === undefined) {
        return p.query(text);
    }
    return p.query(text, params);
}
