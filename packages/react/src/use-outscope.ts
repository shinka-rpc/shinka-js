import type { OutScope, OutScopeEventListener } from "@shinka-rpc/core";
import { useOnce } from "./use-once";

function cleanupFn(this: Set<OutScopeEventListener>) {
  while (this.size)
    for (const cb of Array.from(this)) {
      cb();
      this.delete(cb);
    }
}

export const useOutScope = (cb: (outscope: OutScope) => void) =>
  useOnce(() => {
    const handlers = new Set<OutScopeEventListener>();
    const cleanup = cleanupFn.bind(handlers);
    self.addEventListener("beforeunload", cleanup);

    const add = handlers.add.bind(handlers);
    const remove = handlers.delete.bind(handlers);

    cb({ add, remove } satisfies OutScope);

    return () => {
      cleanup();
      self.removeEventListener("beforeunload", cleanup);
    };
  });
