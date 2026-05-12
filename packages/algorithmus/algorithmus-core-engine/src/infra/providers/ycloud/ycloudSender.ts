import pino, { type Logger } from "pino";
import type { OutboundChannelMessage } from "../../../core/channels/outboundMessage";
import type { YCloudClient } from "./ycloudClient";
import type { YCloudSendDirectlyTextBody } from "./ycloudTypes";

const defaultLog = pino({
  level: process.env.LOG_LEVEL ?? "info",
  name: "ycloud-sender",
});

const SEND_PATH = "/whatsapp/messages/sendDirectly";

/** Límite práctico de cuerpo de texto WhatsApp (evita rechazos silenciosos en API). */
const WHATSAPP_TEXT_BODY_MAX = 4096;

export type YCloudSenderDeps = {
  client: YCloudClient;
  logger?: Logger;
  /** Número remitente registrado en YCloud (WhatsApp Business). */
  defaultFrom: string;
};

/**
 * Traduce contrato interno → API YCloud sendDirectly (solo texto).
 */
export class YCloudSender {
  private readonly client: YCloudClient;
  private readonly log: Logger;
  private readonly defaultFrom: string;

  constructor(deps: YCloudSenderDeps) {
    this.client = deps.client;
    this.log = (deps.logger ?? defaultLog).child({ module: "YCloudSender" });
    this.defaultFrom = deps.defaultFrom;
  }

  /** @returns `true` si YCloud aceptó el envío; `false` si la API falló (no lanza). */
  async sendText(message: OutboundChannelMessage): Promise<boolean> {
    const log = this.log.child({
      trace_id: message.traceId,
      tenant_id: message.tenantId,
    });

    const textTruncated = message.text.length > WHATSAPP_TEXT_BODY_MAX;
    const bodyText = message.text.slice(0, WHATSAPP_TEXT_BODY_MAX);

    const body: YCloudSendDirectlyTextBody = {
      from: this.defaultFrom,
      to: message.to.trim(),
      type: "text",
      text: {
        body: bodyText,
      },
    };

    if (textTruncated) {
      log.warn(
        {
          event: "whatsapp_outbound_text_truncated",
          original_length: message.text.length,
          max: WHATSAPP_TEXT_BODY_MAX,
        },
        "outbound text truncated for WhatsApp limit",
      );
    }

    const result = await this.client.postJson(SEND_PATH, body, message.traceId);

    if (!result.ok) {
      log.error(
        {
          event: "whatsapp_outbound_failed",
          error: result.error,
          status: result.status,
          response_preview: result.bodyText.slice(0, 200),
          to_preview: message.to.slice(0, 8),
        },
        "whatsapp outbound failed",
      );
      return false;
    }

    log.info(
      {
        event: "whatsapp_outbound_sent",
        status: result.status,
        to_preview: message.to.slice(0, 8),
        text_preview: bodyText.slice(0, 80),
        text_length: bodyText.length,
        text_truncated: textTruncated,
      },
      "whatsapp outbound sent",
    );
    return true;
  }
}
