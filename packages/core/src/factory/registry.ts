import { Response } from "../response";
import type {
  DataEventKey,
  ShinkaMeta,
  FnConstructorName,
  MetadataWithHint,
  DispatchError,
} from "../types";
import type { Context } from "../context";

const separateMetadataHint = <SO, TO>(
  metadataWithHint?: MetadataWithHint<SO, TO>,
) =>
  metadataWithHint
    ? ([
        {
          transport: metadataWithHint.transport,
          serialize: metadataWithHint.serialize,
        },
        metadataWithHint.hint,
      ] as [ShinkaMeta<SO, TO>?, FnConstructorName?])
    : [undefined, undefined];

const requestRegistryHookSync =
  <SO, TO, TA, B, R>(
    cb: (body: B, thisArg: TA) => R | Response<SO, TO, R>,
    metadata?: ShinkaMeta<SO, TO>,
  ) =>
  (body: B, ctx: Context<SO, TO>, thisArg: TA) => {
    try {
      const response = cb(body, thisArg);
      response instanceof Response
        ? ctx.answer(response.value, { ...metadata, ...response.metadata })
        : ctx.answer(response, metadata);
    } catch (e) {
      e instanceof Response
        ? ctx.error(e.value, { ...metadata, ...e.metadata })
        : ctx.error(e, metadata);
    }
  };

const requestRegistryHookAsync =
  <SO, TO, TA, B, R>(
    cb: (body: B, thisArg: TA) => R,
    metadata?: ShinkaMeta<SO, TO>,
  ) =>
  async (body: B, ctx: Context<SO, TO>, thisArg: TA) => {
    try {
      const response = await cb(body, thisArg);
      response instanceof Response
        ? ctx.answer(response.value, { ...metadata, ...response.metadata })
        : ctx.answer(response, metadata);
    } catch (e) {
      e instanceof Response
        ? ctx.error(e.value, { ...metadata, ...e.metadata })
        : ctx.error(e, metadata);
    }
  };

export const requestRegistryHook = <SO, TO, TA, B, R>({
  cb,
  metadata,
  hint,
}: {
  cb: (body: B, thisArg: TA) => R;
  metadata?: ShinkaMeta<SO, TO>;
  hint?: FnConstructorName;
}) => {
  if (!hint) hint = cb.constructor.name as FnConstructorName;
  return hint === "AsyncFunction"
    ? requestRegistryHookAsync(cb, metadata)
    : requestRegistryHookSync(cb, metadata);
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
    if (!cb) return dispatchError({ type: "no request handler", key });
    cb(body, ctx, thisArg, dispatchError);
  };

export const createReqRegistry = <SO, TO, TA, B, R>() =>
  createRegistry<
    DataEventKey,
    (
      body: B,
      ctx: Context<SO, TO>,
      thisArg: TA,
      dispatchError: DispatchError,
    ) => void,
    {
      cb: (body: B, thisArg: TA) => R;
      metadata?: ShinkaMeta<SO, TO>;
      hint?: FnConstructorName;
    }
  >(requestRegistryHook<SO, TO, TA, B, R>);

export type ReqRegistryType = ReturnType<typeof createReqRegistry>;

export const createEventRegistry = <TA, B>() =>
  createRegistry<DataEventKey, (data: B, thisArg: TA) => void>();

export type EventRegistryType = ReturnType<typeof createEventRegistry>;

export const asOnRequest =
  <TO, SO, TA>(
    reqSet: (
      key: DataEventKey,
      val: {
        cb: (body: any, thisArg: TA) => any;
        metadata?: ShinkaMeta<SO, TO>;
        hint?: FnConstructorName;
      },
    ) => void,
  ) =>
  (
    key: DataEventKey,
    cb: (body: any, thisArg: TA) => any,
    metadataWithHint?: MetadataWithHint<SO, TO>,
  ) => {
    const [metadata, hint] = separateMetadataHint(metadataWithHint);
    reqSet(key, { cb, metadata, hint });
  };
