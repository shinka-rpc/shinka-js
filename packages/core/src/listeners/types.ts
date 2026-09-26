export type EventListenerType = "connect" | "disconnect" | "error";

export type ShinkaEventListener<B> = (bus: B, payload: any) => void;
export type ShinkaEventListenerSet<B> = Set<ShinkaEventListener<B>>;
export type ShinkaEventListenerWeakSet<B> = WeakSet<ShinkaEventListener<B>>;

export type BaseManageEventListener<TYPE, TARGET> = (
  type: TYPE,
  target: TARGET,
) => void;

export type ManageEventListenerPair<TYPE> = {
  add: BaseManageEventListener<TYPE, () => void>;
  remove: BaseManageEventListener<TYPE, () => void>;
};

export type ManageEventListener<B> = BaseManageEventListener<
  EventListenerType,
  ShinkaEventListener<B>
>;
