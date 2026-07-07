import { NBRequestKeys, NBEventKeys, NBAcquire } from "./constants";
import { createHandlerRegistries } from "../../shinka";

import type {
  NBHandlerRegistries,
  NBThisArgSetVars,
  NBThisArg,
} from "../../types";

export const nbHandlerRegistries: NBHandlerRegistries<any, any> =
  createHandlerRegistries();

const releaseFn = (
  { state, dispatchError, send, setVars, fifo }: NBThisArg<any, any>,
  onRelease: boolean,
) => {
  {
    if (!Object.hasOwn(state, "target")) return dispatchError("not locked");
    if (onRelease) clearTimeout(state.timeoutId!);

    delete state.timeoutId;
    delete state.target;

    const newVars = { send };
    for (const name of acquireTargets.get(state.target!)!) {
      const cb = setVars[name];
      if (cb) cb(newVars);
    }

    while (fifo.length) send(...fifo.pop()!);
  }
};

// === onRequest

const acquireTargets = new Map<NBAcquire, (keyof NBThisArgSetVars<any, any>)[]>(
  [
    [NBAcquire.BUS, ["user", "transport", "serializer", "limon"]],
    [NBAcquire.SERIALIZER, ["user", "bus", "transport", "limon"]],
    [NBAcquire.TRANSPORT, ["user", "bus", "serializer", "limon"]],
    [NBAcquire.LIMON, ["user", "bus", "transport", "serializer"]],
  ],
);

nbHandlerRegistries.onRequest(
  NBRequestKeys.ACQUIRE,
  ([target, timeout]: [NBAcquire, number], thisArg) => {
    const { state, dispatchError, fifoPush, setVars } = thisArg;
    if (Object.hasOwn(state, "target")) {
      dispatchError({
        where: "exclusiveLock",
        error: "already locked",
        target,
      });
      throw "already locked";
    }
    state.target = target;
    state.timeoutId = setTimeout(releaseFn, timeout, thisArg, false);
    const newVars = { send: fifoPush };
    for (const name of acquireTargets.get(target)!) {
      const cb = setVars[name];
      if (cb) cb(newVars);
    }
  },
);

// === onDataEvent

nbHandlerRegistries.onDataEvent(NBEventKeys.RELEASE, (_, thisArg) => {
  releaseFn(thisArg, true);
});
