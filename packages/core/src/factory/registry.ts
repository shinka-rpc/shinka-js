import type { DataEventKey } from "../types";
import type { Context } from "../context";
import type { CommonBus } from "../common";

const AsyncFunctionType = (async () => {}).constructor;

export const requestRegistryHook = <TA extends CommonBus, B, R>(
  cb: (body: B, thisArg: TA) => R,
) => {
  return cb instanceof AsyncFunctionType
    ? async (body: B, ctx: Context<TA>) => {
        try {
          ctx.answer(await cb(body, ctx.bus));
        } catch (e) {
          ctx.error(e);
        }
      }
    : (body: B, ctx: Context<TA>) => {
        try {
          ctx.answer(cb(body, ctx.bus));
        } catch (e) {
          ctx.error(e);
        }
      };
};

const dummy = <I, O>(v: I) => v as any as O;

export const createRegistry = <K, V, H = V>(
  valHook: (val: H) => V = dummy<H, V>,
) => {
  const registry = new Map<K, V>();
  const get = registry.get.bind(registry);
  const set = (key: K, val: H) => {
    registry.set(key, valHook(val));
  };
  return [get, set] as [(key: K) => V | undefined, (key: K, val: H) => void];
};

type MaybeReqHandler<T extends CommonBus> =
  | ((body: any, ctx: Context<T>) => any)
  | undefined;

export const createRequestHandler =
  <T extends CommonBus>(
    getRequest: (key: DataEventKey) => MaybeReqHandler<T>,
  ) =>
  (key: DataEventKey, body: any, ctx: Context<T>) => {
    const cb = getRequest(key);
    if (!cb) return console.error("NO REQUEST HANDLER");
    cb(body, ctx);
  };

type MaybeEventHandler<T extends CommonBus> =
  | ((body: any, thisArg: T) => void)
  | undefined;

export const createEventHandler =
  <T extends CommonBus, B>(
    getDataEvent: (key: DataEventKey) => MaybeEventHandler<T>,
  ) =>
  (key: DataEventKey, body: B, thisArg: T) => {
    const cb = getDataEvent(key);
    if (!cb) return console.error("NO EVENT HANDLER");
    cb(body, thisArg);
  };

export const createReqRegistry = <TA extends CommonBus, B, R>() =>
  createRegistry<
    DataEventKey,
    (body: B, ctx: Context<TA>) => void,
    (body: B, thisArg: TA) => R
  >(requestRegistryHook<TA, B, R>);

export type ReqRegistryType = ReturnType<typeof createReqRegistry>;

export const createEventRegistry = <T extends CommonBus, B>() =>
  createRegistry<DataEventKey, (data: B, thisArg: T) => void>();

export type EventRegistryType = ReturnType<typeof createEventRegistry>;
