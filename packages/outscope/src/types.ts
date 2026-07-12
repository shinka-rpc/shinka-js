export type OutScopeEventListener = () => void;
export type OutScopeListenerManager = (target: OutScopeEventListener) => void;
export type OutScope = {
  add: OutScopeListenerManager;
  remove: OutScopeListenerManager;
};
