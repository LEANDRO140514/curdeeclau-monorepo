import type { Request } from "express";
import pino, { type Logger } from "pino";

const defaultLog = pino({
  level: process.env.LOG_LEVEL ?? "info",
  name: "ycloud-webhook-verifier",
});

export type WebhookVerifyResult =
  | { ok: true }
  | { ok: false; reason: string };

export type YCloudWebhookVerifierDeps = {
  logger?: Logger;
  /**
   * Secreto configurado en dashboard (cuando exista verificación documentada).
   * Hoy no se usa para HMAC hasta fijar header/algoritmo en docs oficiales.
   */
  webhookSecret?: string;
  /**
   * Si true y `NODE_ENV=production`, rechaza requests si no hay verificación implementada.
   */
  rejectUnverifiedInProduction?: boolean;
};

/**
 * Verificación de autenticidad del webhook YCloud.
 *
 * TODO(ycloud): Cuando la documentación oficial fije nombre de header y algoritmo de firma,
 * implementar aquí y usar `webhookSecret`. No inventar esquemas de firma.
 */
export class YCloudWebhookVerifier {
  private readonly log: Logger;
  private readonly webhookSecret?: string;
  private readonly rejectUnverifiedInProduction: boolean;

  constructor(deps: YCloudWebhookVerifierDeps = {}) {
    this.log = (deps.logger ?? defaultLog).child({
      module: "YCloudWebhookVerifier",
    });
    this.webhookSecret = deps.webhookSecret?.trim() || undefined;
    this.rejectUnverifiedInProduction = deps.rejectUnverifiedInProduction ?? false;
  }

  verify(_req: Request): WebhookVerifyResult {
    const isProd = process.env.NODE_ENV === "production";

    if (this.webhookSecret && this.webhookSecret.length > 0) {
      this.log.warn(
        {
          event: "whatsapp_webhook_verification_skipped",
          reason: "secret_configured_verifier_not_implemented",
        },
        "YCLOUD_WEBHOOK_SECRET definido pero verificación firmada aún no cableada (TODO docs YCloud)",
      );
      if (isProd && this.rejectUnverifiedInProduction) {
        return {
          ok: false,
          reason: "verification_required_but_not_implemented",
        };
      }
      return { ok: true };
    }

    if (isProd && this.rejectUnverifiedInProduction) {
      this.log.error(
        {
          event: "whatsapp_webhook_verification_failed",
          reason: "no_secret_strict_mode",
        },
        "webhook rechazado: modo estricto sin secreto",
      );
      return { ok: false, reason: "no_webhook_secret" };
    }

    this.log.info(
      {
        event: "whatsapp_webhook_verification_skipped",
        reason: "no_webhook_secret_configured",
      },
      "webhook sin verificación criptográfica (configurar TODO cuando YCloud lo documente)",
    );
    return { ok: true };
  }
}
