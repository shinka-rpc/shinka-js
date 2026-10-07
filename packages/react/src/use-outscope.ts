import type { OutScope, OutScopeEventListener } from "@shinka-rpc/core";
import { useOnce } from "./use-once";

function cleanupFn(this: Set<OutScopeEventListener>) {
  while (this.size)
    for (const cb of Array.from(this)) {
      this.delete(cb);
      try {
        cb();
      } catch (e) {
        console.trace(e);
      }
    }
}

export const useOutScope = (cb: (outscope: OutScope) => void) =>
  useOnce(() => {
    const handlers = new Set<OutScopeEventListener>();
    const cleanup = cleanupFn.bind(handlers);
    addEventListener("beforeunload", cleanup);

    const add = handlers.add.bind(handlers);
    const remove = handlers.delete.bind(handlers);

    cb({ add, remove } satisfies OutScope);

    return () => {
      cleanup();
      removeEventListener("beforeunload", cleanup);
    };
  });
