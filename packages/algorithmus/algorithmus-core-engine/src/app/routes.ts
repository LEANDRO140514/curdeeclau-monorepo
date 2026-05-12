import type { Express, RequestHandler } from "express";

export type HttpRouteHandlers = {
  health: RequestHandler;
  whatsappWebhook: RequestHandler;
};

/**
 * Registro único de rutas HTTP (composition root monta el `app` y llama esto).
 */
export function registerHttpRoutes(
  app: Express,
  handlers: HttpRouteHandlers,
): void {
  app.get("/health", handlers.health);
  app.post("/webhooks/whatsapp", handlers.whatsappWebhook);
}
