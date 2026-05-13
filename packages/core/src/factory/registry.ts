import { Response } from "../response";
import { AsyncFunctionType } from "../constants";
import type { DataEventKey, ShinkaMeta } from "../types";
import type { Context } from "../context";
import type { CommonBus } from "../common";

export const requestRegistryHook = <TA extends CommonBus, B, R>({
  cb,
  metadata,
}: {
  cb: (body: B, thisArg: TA) => R;
  metadata?: ShinkaMeta;
}) => {
  return cb instanceof AsyncFunctionType
    ? async (body: B, ctx: Context<TA>) => {
        try {
          const response = await cb(body, ctx.bus);
          response instanceof Response
            ? ctx.answer(response.value, { ...metadata, ...response.metadata })
            : ctx.answer(response, metadata);
        } catch (e) {
          e instanceof Response
            ? ctx.error(e.value, { ...metadata, ...e.metadata })
            : ctx.error(e, metadata);
        }
      }
    : (body: B, ctx: Context<TA>) => {
        try {
          const response = cb(body, ctx.bus);
          response instanceof Response
            ? ctx.answer(response.value, { ...metadata, ...response.metadata })
            : ctx.answer(response, metadata);
        } catch (e) {
          e instanceof Response
            ? ctx.error(e.value, { ...metadata, ...e.metadata })
            : ctx.error(e, metadata);
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
    { cb: (body: B, thisArg: TA) => R; metadata?: ShinkaMeta }
  >(requestRegistryHook<TA, B, R>);

export type ReqRegistryType = ReturnType<typeof createReqRegistry>;

export const createEventRegistry = <T extends CommonBus, B>() =>
  createRegistry<DataEventKey, (data: B, thisArg: T) => void>();

export type EventRegistryType = ReturnType<typeof createEventRegistry>;

export const asOnRequest =
  <TA extends CommonBus>(
    reqSet: (
      key: DataEventKey,
      val: {
        cb: (body: any, thisArg: TA) => any;
        metadata?: ShinkaMeta;
      },
    ) => void,
  ) =>
  (
    key: DataEventKey,
    cb: (data: any, thisArg: TA) => any,
    metadata?: ShinkaMeta,
  ) =>
    reqSet(key, { cb, metadata });
