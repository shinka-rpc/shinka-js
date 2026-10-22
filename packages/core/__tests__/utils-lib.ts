import type { EventListenerType } from "../src/listeners/types";

export const clientListenersKeys = [
  "connected",
  "connecting",
  "disconnected",
  "disconnecting",
  "error",
] as EventListenerType[];
