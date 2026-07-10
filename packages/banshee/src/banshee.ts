/**
 * Banshee doesn't kill, but she comes to people who will die soon
 */

import { delegate } from "@shinka-rpc/util";

import type { OnBansheeWail, BansheeEnvironment } from "./types";

const notConfigured = () => {
  throw new Error("banshee has not been configured");
};

type BansheeState = BansheeEnvironment & {
  registry: FinalizationRegistry<() => void>;
};

const cleanupCallback = (eventHandler: () => void) => {
  state.rm(eventHandler);
  eventHandler();
};

const state: BansheeState =
  process.env.NODE_ENV === "development"
    ? (() => {
        // should be removed by bundler
        const sym = Symbol.for("@shinka-rpc/banshee:state");
        // @ts-expect-error: 7015
        if (Object.hasOwn(self, sym)) return self[sym] as BansheeState;
        const newState: BansheeState = {
          registry: new FinalizationRegistry(cleanupCallback),
          add: notConfigured,
          rm: notConfigured,
        };
        // @ts-expect-error: 7015
        self[sym] = newState;
        return newState;
      })()
    : {
        registry: new FinalizationRegistry(cleanupCallback),
        add: notConfigured,
        rm: notConfigured,
      };

type CreateDieThis = readonly [WeakRef<any>, () => void, () => void];

type BansheeEventHandlerThis = readonly [WeakRef<OnBansheeWail>, () => void];

function bansheeEventHandler(this: BansheeEventHandlerThis) {
  this[1]();
  const onBansheeWail = this[0].deref();
  if (onBansheeWail) onBansheeWail();
}

function createDie(this: CreateDieThis, callOnWail = true) {
  state.registry.unregister(this[0].deref());
  state.rm(this[1]);
  if (callOnWail) this[1]();
  this[2]();
}

const dummy = () => {};

export const configure = (env: BansheeEnvironment) => Object.assign(state, env);

export const banshee = (target: any, onWail: OnBansheeWail) => {
  const { call, set, reset } = delegate(dummy);
  const onWailRef = new WeakRef(onWail);
  set(bansheeEventHandler.bind([onWailRef, reset]));
  state.registry.register(target, call);
  state.add(call);
  return createDie.bind([new WeakRef(target), call, reset]);
};
