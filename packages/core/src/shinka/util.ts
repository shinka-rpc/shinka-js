import type { Context } from "./context";
import type {
  DataEventKey,
  ShinkaMeta,
  FnConstructorName,
  MetadataWithHint,
  DispatchError,
  ReqRegEntry,
  ReqRegEntryCb,
} from "./types";

const splitMetadataHint = <SO, TO>(
  metadataWithHint: MetadataWithHint<SO, TO>,
) => {
  const hint = metadataWithHint.hint;
  delete metadataWithHint.hint;
  return [metadataWithHint, hint] as [ShinkaMeta<SO, TO>?, FnConstructorName?];
};

export const separateMetadataHint = <SO, TO>(
  metadataWithHint?: MetadataWithHint<SO, TO>,
) =>
  (metadataWithHint ? splitMetadataHint(metadataWithHint) : [,]) as [
    ShinkaMeta<SO, TO>?,
    FnConstructorName?,
  ];

export const createRegistry = <K, V, H = V>(valHook?: (val: H) => V) => {
  const registry = new Map<K, V>();
  const get = registry.get.bind(registry);
  const set = valHook
    ? (key: K, val: H) => registry.set(key, valHook(val))
    : (registry.set.bind(registry) as any as (key: K, val: H) => Map<K, V>);
  return [get, set] as [typeof get, typeof set];
};

type MaybeReqHandler<SO, TO, TA> =
  | ((
      body: any,
      ctx: Context<SO, TO>,
      thisArg: TA,
      dispatchError: DispatchError,
    ) => any)
  | undefined;

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
  ) => {
    const cb = getRequest(key);
    cb
      ? cb(body, ctx, thisArg, dispatchError)
      : dispatchError({ type: "no request handler", key });
  };

export const asOnRequest =
  <TO, SO, TA, B, R>(
    reqSet: (key: DataEventKey, val: ReqRegEntry<SO, TO, TA, B, R>) => void,
  ) =>
  (
    key: DataEventKey,
    cb: (body: any, thisArg: TA) => any,
    metadataWithHint?: MetadataWithHint<SO, TO>,
  ) => {
    const { 0: metadata, 1: hint } = separateMetadataHint(metadataWithHint);
    reqSet(key, [cb, metadata, hint]);
  };

export type Hooks = {
  Function: <SO, TO, TA, B, R>(
    cb: ReqRegEntryCb<TA, B, R>,
    metadata?: ShinkaMeta<SO, TO>,
  ) => any;
  AsyncFunction: <SO, TO, TA, B, R>(
    cb: ReqRegEntryCb<TA, B, R>,
    metadata?: ShinkaMeta<SO, TO>,
  ) => any;
};

export const makeRequestRegistryHook =
  (hooks: Hooks) =>
  <SO, TO, TA, B, R>({
    0: cb,
    1: metadata,
    2: hint,
  }: ReqRegEntry<SO, TO, TA, B, R>) =>
    hooks[hint || (cb.constructor.name as FnConstructorName)](cb, metadata);
