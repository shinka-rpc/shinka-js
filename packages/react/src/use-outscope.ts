import type { OutScope, OutScopeEventListener } from "@shinka-rpc/core";
import { useOnce } from "./use-once";

export const useOutScope = (cb: (outscope: OutScope) => void) =>
  useOnce(() => {
    const handlers = new Set<OutScopeEventListener>();

    const add = handlers.add.bind(handlers);
    const remove = handlers.delete.bind(handlers);

    cb({ add, remove } satisfies OutScope);

    return () => {
      while (handlers.size)
        for (const cb of Array.from(handlers)) {
          cb();
          handlers.delete(cb);
        }
    };
  });
