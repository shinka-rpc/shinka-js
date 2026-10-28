import type { Context } from "./context";
import type {
  DataEventKey,
  FnConstructorName,
  ShinkaOnRequestMeta,
  DispatchError,
  ReqRegEntry,
  ShinkaOnRequestHandlerBase,
  EvRegEntry,
  MetaTypeHint,
  ShinkaOnDataEventHandler,
  ShinkaOnRequestHandler,
  ShinkaOnDataEventMeta,
  MaybeReqHandler,
  DisposeTimeout,
} from "./types";

export const createRegistry = <K, V, H = V>(valHook?: (val: H) => V) => {
  const registry = new Map<K, V>();
  const get = registry.get.bind(registry);
  const set = valHook
    ? (key: K, val: H) => {
        registry.set(key, valHook(val));
      }
    : (registry.set.bind(registry) as any as (key: K, val: H) => Map<K, V>);
  return [get, set] as [typeof get, typeof set];
};

export type AbstractRegistryType<K, V, H> = typeof createRegistry<K, V, H>;

export const createDispatchRequest =
  <SO, TO, TA>(
    getRequest: (key: DataEventKey) => MaybeReqHandler<SO, TO, TA>,
  ) =>
  (
    key: DataEventKey,
    body: any,
    ctx: Context<SO, TO>,
    thisArg: TA,
    dispatchError: DispatchError,
    signal: AbortSignal,
    dTimeout: DisposeTimeout,
  ) => {
    const cb = getRequest(key);
    cb
      ? cb(body, ctx, thisArg, signal, dTimeout)
      : dispatchError({ type: "no request handler", key });
  };

const asOnRequest =
  <SO, TO, TA, B, R>(
    reqSet: (key: DataEventKey, val: ReqRegEntry<SO, TO, TA, B, R>) => void,
  ) =>
  (
    key: DataEventKey,
    cb: ShinkaOnRequestHandler<TA>,
    metadata?: ShinkaOnRequestMeta<SO, TO>,
  ) =>
    reqSet(key, [cb, metadata]);

const asOnDataEvent =
  <TA>(evSet: (key: DataEventKey, val: EvRegEntry<TA>) => void) =>
  (
    key: DataEventKey,
    cb: ShinkaOnDataEventHandler<TA>,
    metadata?: ShinkaOnDataEventMeta,
  ) =>
    evSet(key, [cb, metadata]);

export const makeRegistryHook =
  <CB extends (...args: any) => any, M extends MetaTypeHint, R>(
    hooks: Record<FnConstructorName, (cb: CB, metadata?: M) => R>,
  ) =>
  ({ 0: cb, 1: metadata }: [CB, M | undefined]) =>
    hooks[metadata?.hint || (cb.constructor.name as FnConstructorName)](
      cb,
      metadata,
    );

export const handlerRegistriesFactory =
  <RH extends (...args: any) => any, EH extends (...args: any) => any>(
    createRequestRegistry: () => [
      (key: unknown) => RH | undefined,
      (
        key: unknown,
        val: [
          ShinkaOnRequestHandlerBase<any, any, any>,
          ShinkaOnRequestMeta<any, any> | undefined,
        ],
      ) => void,
    ],
    createEventRegistry: () => [
      (key: unknown) => EH | undefined,
      (
        key: unknown,
        val: [ShinkaOnDataEventHandler<any>, ShinkaOnDataEventMeta | undefined],
      ) => void,
    ],
  ) =>
  <SO, TO, TA>() => {
    const { 0: reqGet, 1: reqSet } = createRequestRegistry();
    const { 0: evGet, 1: evSet } = createEventRegistry();
    const onRequest = asOnRequest<SO, TO, TA, any, any>(reqSet);
    const onDataEvent = asOnDataEvent<TA>(evSet);
    return [evGet, reqGet, onRequest, onDataEvent] as [
      typeof evGet,
      typeof reqGet,
      typeof onRequest,
      typeof onDataEvent,
    ];
  };
