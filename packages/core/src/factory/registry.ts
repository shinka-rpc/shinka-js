import { Response } from "../response";
import type { DataEventKey, ShinkaMeta } from "../types";
import type { Context } from "../context";
import type { CommonBus } from "../common";

const AsyncFunctionType = (async () => {}).constructor;

/**
 * Creates a request handler that wraps a callback function with proper error handling and response management.
 * The handler automatically handles both synchronous and asynchronous callbacks, ensuring proper response
 * sending and error handling. It also supports Response objects with metadata.
 *
 * @template TA - The type of bus this handler is associated with
 * @template B - The type of request body
 * @template R - The type of response
 * @param options - Configuration options for the request handler
 * @param options.cb - The callback function to handle the request
 * @param options.metadata - Optional metadata to merge with response metadata
 * @returns A request handler function that manages the request lifecycle
 *
 * @example
 * ```typescript
 * // Synchronous handler
 * const handler = requestRegistryHook({
 *   cb: (data, bus) => processData(data)
 * });
 *
 * // Asynchronous handler with metadata
 * const asyncHandler = requestRegistryHook({
 *   cb: async (data, bus) => await fetchData(data),
 *   metadata: { transport: "transportOptions", serialize: "serializeOptions" }
 * });
 * ```
 */
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

/**
 * Creates a registry with get and set functions for managing key-value pairs.
 * The registry supports value transformation through an optional hook function.
 *
 * @template K - The type of keys in the registry
 * @template V - The type of values in the registry
 * @template H - The type of values before transformation (defaults to V)
 * @param valHook - Optional function to transform values before storing them
 * @returns A tuple containing get and set functions for the registry
 */
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

/**
 * Creates a request handler function that looks up and executes request callbacks from a registry.
 * This function provides a standardized way to handle incoming requests by delegating to registered handlers.
 *
 * @template T - The type of bus this handler is associated with
 * @param getRequest - Function to retrieve request handlers from the registry
 * @returns A function that handles requests by looking up and executing the appropriate handler
 */
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

/**
 * Creates an event handler function that looks up and executes event callbacks from a registry.
 * This function provides a standardized way to handle incoming events by delegating to registered handlers.
 *
 * @template T - The type of bus this handler is associated with
 * @template B - The type of event body
 * @param getDataEvent - Function to retrieve event handlers from the registry
 * @returns A function that handles events by looking up and executing the appropriate handler
 */
export const createEventHandler =
  <T extends CommonBus, B>(
    getDataEvent: (key: DataEventKey) => MaybeEventHandler<T>,
  ) =>
  (key: DataEventKey, body: B, thisArg: T) => {
    const cb = getDataEvent(key);
    if (!cb) return console.error("NO EVENT HANDLER");
    cb(body, thisArg);
  };

/**
 * Creates a request registry with get and set functions for managing request handlers.
 * The registry automatically wraps callbacks with proper error handling and response management.
 *
 * @template TA - The type of bus this registry is associated with
 * @template B - The type of request body
 * @template R - The type of response
 * @returns A tuple containing get and set functions for the request registry
 */
export const createReqRegistry = <TA extends CommonBus, B, R>() =>
  createRegistry<
    DataEventKey,
    (body: B, ctx: Context<TA>) => void,
    { cb: (body: B, thisArg: TA) => R; metadata?: ShinkaMeta }
  >(requestRegistryHook<TA, B, R>);

export type ReqRegistryType = ReturnType<typeof createReqRegistry>;

/**
 * Creates an event registry with get and set functions for managing event handlers.
 * The registry stores event callbacks that can be executed when events are received.
 *
 * @template T - The type of bus this registry is associated with
 * @template B - The type of event body
 * @returns A tuple containing get and set functions for the event registry
 */
export const createEventRegistry = <T extends CommonBus, B>() =>
  createRegistry<DataEventKey, (data: B, thisArg: T) => void>();

export type EventRegistryType = ReturnType<typeof createEventRegistry>;

/**
 * Creates a convenience function that adapts a request registry setter to accept separate callback and metadata parameters.
 * This provides a more ergonomic API for registering request handlers.
 *
 * @template TA - The type of bus this adapter is associated with
 * @param reqSet - The request registry setter function
 * @returns A function that accepts separate key, callback, and metadata parameters
 */
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
