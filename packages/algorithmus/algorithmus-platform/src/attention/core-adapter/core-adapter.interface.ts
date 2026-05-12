import type { CoreInputEvent, CoreOutputEvent } from "./types";

export interface ICoreAdapter {
  handle(event: CoreInputEvent): Promise<CoreOutputEvent>;
}
