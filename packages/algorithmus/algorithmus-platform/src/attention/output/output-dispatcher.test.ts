import type { CoreOutputEvent } from "../core-adapter/types";
import { OutputDispatcher } from "./output-dispatcher";
import type { ISender } from "./sender.interface";

class SpySender implements ISender {
  readonly calls: { to: string; message: string }[] = [];

  async sendMessage(to: string, message: string): Promise<void> {
    this.calls.push({ to, message });
  }
}

async function main(): Promise<void> {
  const spy = new SpySender();
  const dispatcher = new OutputDispatcher({ whatsapp: spy });

  const coreOutput: CoreOutputEvent = {
    initial: { nextState: "INIT", action: "reply" },
    final: { nextState: "INIT", action: "reply" },
    messageToSend: "hola desde core",
  };

  await dispatcher.dispatch({
    coreOutput,
    channel: "whatsapp",
    externalId: "+1234567890",
  });

  if (spy.calls.length !== 1) {
    throw new Error(`Expected 1 send, got ${spy.calls.length}`);
  }
  const [first] = spy.calls;
  if (
    first === undefined ||
    first.to !== "+1234567890" ||
    first.message !== "hola desde core"
  ) {
    throw new Error("Sender was not invoked with expected payload");
  }

  console.log("[output-dispatcher/test] ok");
}

void main();
