/// <reference types="node" />

import type { OutScope, OutScopeEventListener } from "@shinka-rpc/core";

const shutdownCallbacks = new Set<OutScopeEventListener>();

process.on("exit", () => {
  for (const cb of shutdownCallbacks) queueMicrotask(cb);
  shutdownCallbacks.clear();
});

export default {
  add: (target) => shutdownCallbacks.add(target),
  remove: (target) => shutdownCallbacks.delete(target),
} satisfies OutScope;
