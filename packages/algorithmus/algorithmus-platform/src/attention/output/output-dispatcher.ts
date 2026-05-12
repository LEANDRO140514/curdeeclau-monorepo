import type { CoreOutputEvent } from "../core-adapter/types";
import type { ISender } from "./sender.interface";

export type OutputChannel = "whatsapp";

export type OutputDispatcherSenders = Readonly<{
  whatsapp: ISender;
}>;

export class OutputDispatcher {
  constructor(private readonly senders: OutputDispatcherSenders) {}

  async dispatch(input: {
    coreOutput: CoreOutputEvent;
    channel: OutputChannel;
    externalId: string;
  }): Promise<void> {
    const messages = [input.coreOutput.messageToSend];

    for (const text of messages) {
      switch (input.channel) {
        case "whatsapp":
          await this.senders.whatsapp.sendMessage(input.externalId, text);
          break;
        default: {
          const _exhaustive: never = input.channel;
          void _exhaustive;
        }
      }
    }
  }
}
