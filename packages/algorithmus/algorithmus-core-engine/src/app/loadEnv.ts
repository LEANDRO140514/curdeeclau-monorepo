/**
 * Load `.env` before other app code reads `process.env`. Import this module first
 * in process entry points (`server.ts`, `whatsappWorker.ts`).
 */
import { config } from "dotenv";
import { syncRedisUrlToEnv } from "../config/redisUrl";

config();
syncRedisUrlToEnv();
