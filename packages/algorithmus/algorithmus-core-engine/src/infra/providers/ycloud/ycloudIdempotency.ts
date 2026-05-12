import pino, { type Logger } from "pino";
import { getRedis } from "../../redis/client";

const defaultLog = pino({
  level: process.env.LOG_LEVEL ?? "info",
  name: "ycloud-idempotency",
});

export type YCloudInboundIdempotencyDeps = {
  getRedis: typeof getRedis;
  logger?: Logger;
  ttlSec: number;
};

/**
 * Evita doble procesamiento de webhooks duplicados (mismo tenant + messageId).
 */
export class YCloudInboundIdempotency {
  private readonly connect: typeof getRedis;
  private readonly log: Logger;
  private readonly ttlSec: number;

  constructor(deps: YCloudInboundIdempotencyDeps) {
    this.connect = deps.getRedis;
    this.log = (deps.logger ?? defaultLog).child({
      module: "YCloudInboundIdempotency",
    });
    this.ttlSec = deps.ttlSec;
  }

  /**
   * @returns `acquired` si este worker debe procesar; `duplicate` si ya fue visto.
   */
  async tryAcquire(
    tenantId: string,
    messageId: string,
    traceId: string,
  ): Promise<"acquired" | "duplicate"> {
    const key = `wa:inbound:${tenantId.trim()}:${messageId.trim()}`;
    const log = this.log.child({ trace_id: traceId, tenant_id: tenantId });

    try {
      const redis = await this.connect();
      const result = await redis.set(key, "1", {
        NX: true,
        EX: this.ttlSec,
      });

      if (result === null) {
        return "duplicate";
      }

      log.info(
        {
          event: "whatsapp_idempotency_acquired",
          message_id: messageId.trim(),
        },
        "idempotency lock acquired",
      );
      return "acquired";
    } catch (err) {
      log.error(
        {
          event: "ycloud_idempotency_error",
          error: err instanceof Error ? err.message : String(err),
        },
        "idempotency redis error; proceeding without dedup",
      );
      return "acquired";
    }
  }
}
