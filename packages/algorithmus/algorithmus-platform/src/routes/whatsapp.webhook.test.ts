import assert from "node:assert/strict";
import type { Request, Response } from "express";
import { type Orchestrator } from "@core/core/orchestrator/Orchestrator";
import type { CoreInputEvent } from "../attention/core-adapter/types";
import { CoreAdapterService } from "../attention/core-adapter/core-adapter.service";
import { OutputDispatcher } from "../attention/output/output-dispatcher";
import { WhatsAppAdapter } from "../attention/whatsapp/whatsapp.adapter";
import { handleWhatsappWebhook } from "./whatsapp.webhook";

async function main(): Promise<void> {
  const adapter = new WhatsAppAdapter({ defaultTenantId: "tenant-test" });

  const orchestrator = {
    async process(event: CoreInputEvent) {
      assert.equal(event.leadId, "+15550001");
      assert.equal(event.message, "hola");
      return {
        initial: { nextState: "INIT", action: "reply" },
        final: { nextState: "INIT", action: "reply" },
        messageToSend: `reply:${event.message}`,
      };
    },
  } as unknown as Orchestrator;

  const coreAdapter = new CoreAdapterService(orchestrator);
  const sends: { to: string; message: string }[] = [];
  const outputDispatcher = new OutputDispatcher({
    whatsapp: {
      async sendMessage(to: string, message: string): Promise<void> {
        sends.push({ to, message });
      },
    },
  });

  const req = { body: { from: "+15550001", text: "hola" } } as Request;
  const res = createMockResponse();

  await handleWhatsappWebhook(
    { adapter, coreAdapter, outputDispatcher },
    req,
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.deepEqual(sends, [{ to: "+15550001", message: "reply:hola" }]);
  console.log("[whatsapp.webhook.test] ok");
}

function createMockResponse(): Response & { statusCode: number; body: unknown } {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res as unknown as Response;
    },
    json(payload: unknown) {
      res.body = payload;
      return res as unknown as Response;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

void main();
