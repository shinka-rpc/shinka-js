import type { ShinkaEventListener, BaseShinkaEventListeners } from "../types";

const createBaseEventListeners =
  <S>(Type: new () => S) =>
  () =>
    ({
      connect: new Type(),
      disconnect: new Type(),
    }) as BaseShinkaEventListeners<S>;

export const createEventListeners = createBaseEventListeners(
  Set<ShinkaEventListener<any>>,
);

export const createEventListenersBanned = createBaseEventListeners(
  WeakSet<ShinkaEventListener<any>>,
);
