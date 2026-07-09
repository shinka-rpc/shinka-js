import { Consensus } from "@shinka-rpc/consensus";

import { NBRequestKeys, NBEventKeys, NBAcquire } from "./constants";
import { consensusAll } from "../../consensus-protocol";

import { createHandlerRegistries } from "../../../shinka";

import type {
  NBHandlerRegistries,
  NBThisArgSetVars,
  NBThisArg,
} from "../../../types";

export const nbHandlerRegistries: NBHandlerRegistries<any, any> =
  createHandlerRegistries();

const releaseFn = (
  {
    state,
    dispatchError,
    send,
    setVars,
    q,
    raceResolvedEvent,
  }: NBThisArg<any, any>,
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

    if (raceResolvedEvent.isDone) while (q.length) send(...q.pop()!);
    else raceResolvedEvent.resolve();
  }
};

// === onRequest

const acquireTargets = new Map<NBAcquire, (keyof NBThisArgSetVars<any, any>)[]>(
  [
    [NBAcquire.BUS, ["user", "transport", "serializer", "limon"]],
    [NBAcquire.SERIALIZER, ["user", "bus", "transport", "limon"]],
    [NBAcquire.TRANSPORT, ["user", "bus", "serializer", "limon"]],
    [NBAcquire.LIMON, ["user", "bus", "transport", "serializer"]],
    [NBAcquire.NB, ["user", "bus", "transport", "serializer", "limon"]],
  ],
);

nbHandlerRegistries.onRequest(
  NBRequestKeys.ACQUIRE,
  ([target, timeout, ...nonces]: [NBAcquire, number, number], thisArg) => {
    const { state, qPush, setVars } = thisArg;
    if (Object.hasOwn(state, "nonces")) {
      const status = consensusAll(state.nonces!, nonces);
      if (status !== Consensus.OK) return status;
    }
    state.target = target;
    state.timeoutId = setTimeout(releaseFn, timeout, thisArg, false);
    const newVars = { send: qPush };
    for (const name of acquireTargets.get(target)!) {
      const cb = setVars[name];
      if (cb) cb(newVars);
    }
    return Consensus.OK;
  },
);

// === onDataEvent

nbHandlerRegistries.onDataEvent(NBEventKeys.RELEASE, (_, thisArg) => {
  releaseFn(thisArg, true);
});
