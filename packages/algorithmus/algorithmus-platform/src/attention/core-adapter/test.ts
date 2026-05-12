import { type Orchestrator } from "@core/core/orchestrator/Orchestrator";
import { CoreAdapterService } from "./core-adapter.service";
import type { CoreInputEvent, CoreOutputEvent } from "./types";

async function main(): Promise<void> {
  const orchestrator = {
    async process(event: CoreInputEvent): Promise<CoreOutputEvent> {
      return {
        initial: { nextState: "INIT", action: "reply" },
        final: { nextState: "INIT", action: "reply" },
        messageToSend: `echo:${event.message}`,
      };
    },
  } as unknown as Orchestrator;

  const adapter = new CoreAdapterService(orchestrator);
  const out = await adapter.handle({
    leadId: "l1",
    tenantId: "t1",
    currentState: "INIT",
    message: "hola",
  });

  console.log("[core-adapter/test]", out.messageToSend);
}

void main();
