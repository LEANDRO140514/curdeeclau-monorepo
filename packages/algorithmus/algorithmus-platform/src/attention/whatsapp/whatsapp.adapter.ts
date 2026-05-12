import type { CoreInputEvent } from "../core-adapter/types";

export type WhatsappSimulationPayload = {
  from: string;
  text: string;
};

export class WhatsAppAdapter {
  constructor(
    private readonly options: Readonly<{ defaultTenantId: string }> = {
      defaultTenantId: "simulated-tenant",
    },
  ) {}

  normalize(payload: WhatsappSimulationPayload): CoreInputEvent {
    return {
      leadId: payload.from,
      tenantId: this.options.defaultTenantId,
      currentState: "INIT",
      message: payload.text,
    };
  }
}
