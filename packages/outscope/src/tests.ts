import type { OutScope, OutScopeEventListener } from "@shinka-rpc/core";

export default () => {
  const outscopeState = new Set<OutScopeEventListener>();
  const outscope: OutScope = {
    add: outscopeState.add.bind(outscopeState),
    remove: outscopeState.delete.bind(outscopeState),
  };
  return { outscopeState, outscope };
};
