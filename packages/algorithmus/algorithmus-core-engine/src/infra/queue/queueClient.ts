import { Queue } from "bullmq";
import IORedis from "ioredis";
import type { WhatsAppInboundJobPayload } from "./jobTypes";
import { WHATSAPP_INBOUND_JOB_NAME, WHATSAPP_INBOUND_QUEUE } from "./jobTypes";

/**
 * Conexión dedicada BullMQ (ioredis). Requisito: `maxRetriesPerRequest: null`.
 * Usar una instancia por Queue y otra por Worker.
 */
export function createBullMqConnection(redisUrl: string): IORedis {
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
}

export function createWhatsAppInboundQueue(connection: IORedis) {
  return new Queue<WhatsAppInboundJobPayload, void, typeof WHATSAPP_INBOUND_JOB_NAME>(
    WHATSAPP_INBOUND_QUEUE,
    {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    },
  );
}

export type WhatsAppInboundJobProducer = {
  add(payload: WhatsAppInboundJobPayload): Promise<void>;
};

export function createWhatsAppInboundJobProducer(
  queue: ReturnType<typeof createWhatsAppInboundQueue>,
): WhatsAppInboundJobProducer {
  return {
    async add(payload) {
      await queue.add(WHATSAPP_INBOUND_JOB_NAME, payload, {
        jobId: `${payload.tenantId}:${payload.inboundMessage.messageId}`,
      });
    },
  };
}
