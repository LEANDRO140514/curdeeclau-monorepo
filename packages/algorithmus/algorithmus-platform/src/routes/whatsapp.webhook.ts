import { Router, json } from "express";
import type { Request, Response } from "express";
import type { CoreAdapterService } from "../attention/core-adapter/core-adapter.service";
import type { OutputDispatcher } from "../attention/output/output-dispatcher";
import type {
  WhatsappSimulationPayload,
  WhatsAppAdapter,
} from "../attention/whatsapp/whatsapp.adapter";

export type WhatsappWebhookDeps = {
  adapter: WhatsAppAdapter;
  coreAdapter: CoreAdapterService;
  outputDispatcher: OutputDispatcher;
};

export function createWhatsappWebhookRouter(deps: WhatsappWebhookDeps): Router {
  const router = Router();
  router.use(json());
  router.post("/webhook/whatsapp", (req, res, next) => {
    void handleWhatsappWebhook(deps, req, res).catch(next);
  });
  return router;
}

export async function handleWhatsappWebhook(
  deps: WhatsappWebhookDeps,
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = parseBody(req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: "invalid body" });
    return;
  }

  const { from, text } = parsed.value;
  const coreInput = deps.adapter.normalize({ from, text });
  const coreOutput = await deps.coreAdapter.handle(coreInput);
  await deps.outputDispatcher.dispatch({
    coreOutput,
    channel: "whatsapp",
    externalId: from,
  });

  res.status(200).json({ ok: true });
}

function parseBody(
  body: unknown,
): { ok: true; value: WhatsappSimulationPayload } | { ok: false } {
  if (body === null || typeof body !== "object") {
    return { ok: false };
  }
  const o = body as Record<string, unknown>;
  if (typeof o.from !== "string" || typeof o.text !== "string") {
    return { ok: false };
  }
  return { ok: true, value: { from: o.from, text: o.text } };
}
