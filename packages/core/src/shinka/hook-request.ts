import { Response } from "./response";
import type { Context } from "./context";
import type {
  ShinkaOnRequestMeta,
  FnConstructorName,
  ShinkaOnRequestHandlerBase,
  DisposeTimeout,
} from "./types";

const requestRegistryHookSync =
  <SO, TO, TA, B, R>(
    cb: ShinkaOnRequestHandlerBase<TA, B, R>,
    metadata?: ShinkaOnRequestMeta<SO, TO>,
  ) =>
  (
    body: B,
    ctx: Context<SO, TO>,
    thisArg: TA,
    signal: AbortSignal,
    dTimeout: DisposeTimeout,
  ) => {
    const disposeTimeout = dTimeout(metadata?.timeout);
    try {
      const response = cb(body, thisArg, { signal });
      response instanceof Response
        ? ctx.answer(response.value, { ...metadata, ...response.metadata })
        : ctx.answer(response, metadata);
    } catch (e) {
      e instanceof Response
        ? ctx.error(e.value, { ...metadata, ...e.metadata })
        : ctx.error(e, metadata);
    } finally {
      disposeTimeout();
    }
  };

const requestRegistryHookAsync =
  <SO, TO, TA, B, R>(
    cb: ShinkaOnRequestHandlerBase<TA, B, R>,
    metadata?: ShinkaOnRequestMeta<SO, TO>,
  ) =>
  async (
    body: B,
    ctx: Context<SO, TO>,
    thisArg: TA,
    signal: AbortSignal,
    dTimeout: DisposeTimeout,
  ) => {
    const disposeTimeout = dTimeout(metadata?.timeout);
    try {
      const response = await cb(body, thisArg, { signal });
      response instanceof Response
        ? ctx.answer(response.value, { ...metadata, ...response.metadata })
        : ctx.answer(response, metadata);
    } catch (e) {
      e instanceof Response
        ? ctx.error(e.value, { ...metadata, ...e.metadata })
        : ctx.error(e, metadata);
    } finally {
      disposeTimeout();
    }
  };

export type RequestHooks = Record<
  FnConstructorName,
  (
    cb: ShinkaOnRequestHandlerBase<any, any, any>,
    metadata?: ShinkaOnRequestMeta<any, any>,
  ) => (
    body: any,
    ctx: Context<any, any>,
    thisArg: any,
    signal: AbortSignal,
    dTimeout: DisposeTimeout,
  ) => any
>;

export default {
  Function: requestRegistryHookSync,
  AsyncFunction: requestRegistryHookAsync,
} as RequestHooks;
