import {
  type Orchestrator,
  type OrchestratorProcessResult,
} from "@core/core/orchestrator/Orchestrator";
import type { ICoreAdapter } from "./core-adapter.interface";
import type { CoreInputEvent, CoreOutputEvent } from "./types";

export class CoreAdapterService implements ICoreAdapter {
  constructor(private readonly orchestrator: Orchestrator) {}

  async handle(event: CoreInputEvent): Promise<CoreOutputEvent> {
    const raw = await this.orchestrator.process(event);
    return this.toCoreOutputEvent(raw);
  }

  private toCoreOutputEvent(raw: OrchestratorProcessResult): CoreOutputEvent {
    return {
      initial: raw.initial,
      final: raw.final,
      llmResponse: raw.llmResponse,
      messageToSend: raw.messageToSend,
      fsmPersisted: raw.fsmPersisted,
      fsmPersistenceOutcome: raw.fsmPersistenceOutcome,
      internalDiagnostics: raw.internalDiagnostics,
    };
  }
}
