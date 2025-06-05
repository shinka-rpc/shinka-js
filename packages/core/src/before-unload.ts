import type { ClientBus } from "./client";
import type { ServerBus } from "./server";

export const registerBeforeUnload = (bus: ClientBus | ServerBus) =>
  self.addEventListener("beforeunload", bus.willDie);
