/**
 * Banshee doesn't kill, but she comes to people who will die soon
 */

import { delegate } from "./delegate";

type EventListener = () => void;
type ManageEventListener = (target: EventListener) => void;

let listeners: [ManageEventListener, ManageEventListener];

// @ts-expect-error: 2307
if (process.env.BASE_URL) {
  listeners = [
    (target: EventListener) => self.removeEventListener("beforeunload", target),
    (target: EventListener) => self.addEventListener("beforeunload", target),
  ];
  // @ts-expect-error: 2591
} else if (process.env.NODE_ENV === "test") {
  listeners = [
    // @ts-expect-error: 7017
    (target: EventListener) => globalThis.TESTHANDLERS?.delete(target),
    // @ts-expect-error: 7017
    (target: EventListener) => globalThis.TESTHANDLERS?.add(target),
  ];
} else {
  const shutdownCallbacks = new Set<EventListener>();
  const sigHandler = () => {
    for (const cb of shutdownCallbacks) queueMicrotask(cb);
    shutdownCallbacks.clear();
  };
  // @ts-expect-error: 2591
  process.on("SIGINT", sigHandler);
  // @ts-expect-error: 2591
  process.on("SIGTERM", sigHandler);
  listeners = [
    (target: EventListener) => shutdownCallbacks.delete(target),
    (target: EventListener) => shutdownCallbacks.add(target),
  ];
}

export type OnBansheeWail = () => void;

const cleanupCallback = (eventHandler: () => void) => {
  listeners[0](eventHandler);
  eventHandler();
};

const registry = new FinalizationRegistry(cleanupCallback);

type Token = {};

type CreateDieThis = readonly [Token, () => void, () => void];

type BansheeEventHandlerThis = readonly [WeakRef<OnBansheeWail>, () => void];

function bansheeEventHandler(this: BansheeEventHandlerThis) {
  this[0].deref()!();
  this[1]();
}

function createDie(this: CreateDieThis, callOnWail = true) {
  registry.unregister(this[0]);
  listeners[0](this[1]);
  if (callOnWail) this[1]();
  this[2]();
}

const dummy = () => {};

export const banshee = (target: any, onWail: OnBansheeWail) => {
  const { call, set, reset } = delegate(dummy);
  const onWailRef = new WeakRef(onWail);
  set(bansheeEventHandler.bind([onWailRef, reset]));
  const token: Token = {};
  registry.unregister(target);
  registry.register(target, call, token);
  listeners[1](call);
  return createDie.bind([token, call, reset]);
};
