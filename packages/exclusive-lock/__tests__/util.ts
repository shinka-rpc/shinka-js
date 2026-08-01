import type { AnyNBThisArg } from "../src";
import { FIFO, type IQueue } from "../../collections";
import {
  type NBSetSendFn,
  type NBThisArgSetVars,
  type NBVars,
  type SendFn,
  type IBus,
  type nbAPI,
  ExclusiveLock,
} from "../../core/src";
import { Semaphore, ReusablePromise } from "../../concurrency";

export type Log = { action: string; args?: any };

const noNoNo = () => {
  throw 0;
};

const mockBus = (q: IQueue<Log>) =>
  ({
    start: async () => q.push({ action: "bus-starting" }),
    stop: async () => q.push({ action: "bus-stopping" }),
    restart: async () => q.push({ action: "bus-restarting" }),
    ping: async () => noNoNo(),
    addEventListener: noNoNo,
    removeEventListener: noNoNo,
    extra: {},
    request: noNoNo,
    dataEvent: noNoNo,
  }) as IBus<any, any>;

export const createMockNBThisArg = (lock: ExclusiveLock<any, any, any>) => {
  const actions = new FIFO<Log>();

  const q = {
    drain: () => actions.push({ action: "q-drain" }),
    clear: () => actions.push({ action: "q-clear" }),
  };

  const dispatchError = (e: any) => {
    console.error(e);
    actions.push({ action: "dispatch-error", args: e });
  };

  // ===

  const semaphoreOriginal = new Semaphore({ waiters: FIFO, capacity: 1 });

  const semaphore = {
    acquire: async () => {
      try {
        actions.push({ action: "semaphore-acquire-begin" });
        const ctx = await semaphoreOriginal.acquire();
        actions.push({ action: "semaphore-acquire-done" });
        return ctx;
      } catch (e) {
        actions.push({ action: "semaphore-acquire-fail", args: e });
        throw e;
      }
    },
    rejectPending: () => {
      actions.push({ action: "semaphore-reject-pending" });
      semaphoreOriginal.rejectPending();
    },
    get value() {
      return semaphoreOriginal.value;
    },
    get capacity() {
      return semaphoreOriginal.capacity;
    },
    set capacity(value: number) {
      semaphoreOriginal.capacity = value;
    },
  } as any as Semaphore;

  // const raceResolvedEvent = new ReusablePromise<void>();
  // raceResolvedEvent.resolve();
  // const concurrent = { semaphore, raceResolvedEvent };

  // === api ===

  const evAcquire = () => actions.push({ action: "ev-acquire" });
  const evAccept = () => actions.push({ action: "ev-accept" });
  const evRelease = () => actions.push({ action: "ev-release" });

  const api: nbAPI = {
    r: {},
    e: { acquire: evAcquire, accept: evAccept, release: evRelease },
  };

  // === vars

  const sendLocked: SendFn<any, any> = (message, metadata) =>
    actions.push({ action: "send-locked", args: { message, metadata } });

  const sendReleased: SendFn<any, any> = (message, metadata) =>
    actions.push({ action: "send-released", args: { message, metadata } });

  const sendMap = new Map<SendFn<any, any>, string>([
    [sendLocked, "locked"],
    [sendReleased, "released"],
  ]);

  const varSet =
    (key: keyof NBThisArgSetVars<any, any, any>) =>
    ({ send }: Partial<NBSetSendFn<any, any>>) => {
      actions.push({
        action: "set-vars",
        args: { key, send: sendMap.get(send!) },
      });
    };

  const vars: NBVars<any, any, any> = {
    set: {
      user: varSet("user"),
      bus: varSet("bus"),
      transport: varSet("transport"),
      serializer: varSet("serializer"),
      limon: varSet("limon"),
      nb: varSet("nb"),
    },
    val: { lock: { send: sendLocked }, release: { send: sendReleased } },
  };

  // ===

  const thisArg: AnyNBThisArg = {
    q,
    // concurrent,
    semaphore,
    vars,
    lock,
    exclusiveLock: noNoNo,
    api,
    state: {} as any,
    dispatchError,
    bus: mockBus(actions),
    shinka: {
      onRequest: noNoNo,
      onDataEvent: noNoNo,
      request: noNoNo,
      dataEvent: noNoNo,
    },
    responseTimeout: 5000,
  };

  lock.start(thisArg);

  return { actions, thisArg };
};
