import express from "express";
import { CoreAdapterService } from "../attention/core-adapter/core-adapter.service";
import { OutputDispatcher } from "../attention/output/output-dispatcher";
import { WhatsAppSender } from "../attention/output/whatsapp.sender";
import { WhatsAppAdapter } from "../attention/whatsapp/whatsapp.adapter";
import { createWhatsappWebhookRouter } from "../routes/whatsapp.webhook";
import { createPlatformOrchestrator } from "./createPlatformOrchestrator";

const app = express();
const PORT = process.env.PORT || 3000;

const orchestrator = createPlatformOrchestrator();

const whatsappWebhookDeps = {
  adapter: new WhatsAppAdapter(),
  coreAdapter: new CoreAdapterService(orchestrator),
  outputDispatcher: new OutputDispatcher({ whatsapp: new WhatsAppSender() }),
};

app.get("/", (_req, res) => {
  res.send("Algorithmus Platform running");
});

app.use(createWhatsappWebhookRouter(whatsappWebhookDeps));

app.listen(PORT, () => {
  console.log(`[Platform] Server running on port ${PORT}`);
});
