/// <reference types="node" />

import type { BansheeEnvironment, BansheeEventListener } from "../types";

const shutdownCallbacks = new Set<BansheeEventListener>();
const sigHandler = () => {
  for (const cb of shutdownCallbacks) queueMicrotask(cb);
  shutdownCallbacks.clear();
};
process.on("SIGINT", sigHandler);
process.on("SIGTERM", sigHandler);

export default {
  add: (target) => shutdownCallbacks.add(target),
  rm: (target) => shutdownCallbacks.delete(target),
} as BansheeEnvironment;
