/**
 * This is like `@shinka-rpc/util:delegate`
 */

import type { ManageEventListenerPair } from "../types";

export const createEventListenerPair = <ET extends string | symbol>(
  eventListenerFactory: () => Record<ET, Set<(...args: any) => void>>,
) => {
  const listeners = eventListenerFactory();

  const add = (type: ET, cb: (...args: any) => void) => {
    listeners[type].add(cb);
  };

  const remove = (type: ET, cb: (...args: any) => void) => {
    listeners[type].delete(cb);
  };

  // Internal
  const call = (type: ET, ...args: any) => {
    for (const cb of listeners[type]) cb(...args);
  };

  // External API
  const all: ManageEventListenerPair<ET> = Object.freeze({ add, remove });

  return [all, call] as [typeof all, typeof call];
};
