import type { DataEventKey } from "../types";
import type { Context } from "../context";
import type { CommonBus } from "../common";

const AsyncFunctionType = (async () => {}).constructor;

/**
 * Creates a request handler that wraps a callback function with proper error handling and response management.
 * The handler automatically handles both synchronous and asynchronous callbacks, ensuring proper response
 * sending and error handling.
 *
 * @template TA - The type of bus this handler is associated with
 * @template B - The type of request body
 * @template R - The type of response
 * @param cb - The callback function to handle the request
 * @returns A request handler function that manages the request lifecycle
 *
 * @example
 * ```typescript
 * // Synchronous handler
 * const handler = requestRegistryHook((data, bus) => {
 *   return processData(data);
 * });
 *
 * // Asynchronous handler
 * const asyncHandler = requestRegistryHook(async (data, bus) => {
 *   const result = await fetchData(data);
 *   return result;
 * });
 * ```
 */
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

/**
 * Creates a registry with get and set functions for managing key-value pairs.
 * The registry supports value transformation through an optional hook function.
 *
 * @template K - The type of keys in the registry
 * @template V - The type of values in the registry
 * @template H - The type of values before transformation (defaults to V)
 * @param valHook - Optional function to transform values before storing them
 * @returns A tuple containing get and set functions for the registry
 *
 * @example
 * ```typescript
 * // Create a simple registry
 * const [get, set] = createRegistry<string, number>();
 * set("key", 42);
 * get("key"); // returns 42
 *
 * // Create a registry with value transformation
 * const [getTransformed, setTransformed] = createRegistry<string, string, number>(
 *   (val) => val.toString()
 * );
 * setTransformed("key", 42);
 * getTransformed("key"); // returns "42"
 * ```
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
