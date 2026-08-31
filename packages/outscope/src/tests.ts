import type { OutScope, OutScopeEventListener } from "@shinka-rpc/core";

type State = Set<OutScopeEventListener>;

export const testListeners: State =
  process.env.NODE_ENV === "development"
    ? (() => {
        // should be removed by bundler
        const sym = Symbol.for("@shinka-rpc/outscope/tests:listeners");
        // @ts-expect-error: 7015
        if (Object.hasOwn(self, sym)) return self[sym] as State;
        const newState: State = new Set();
        // @ts-expect-error: 7015
        self[sym] = newState;
        return newState;
      })()
    : new Set();

export default {
  add: testListeners.add.bind(testListeners),
  remove: testListeners.delete.bind(testListeners),
} satisfies OutScope;
