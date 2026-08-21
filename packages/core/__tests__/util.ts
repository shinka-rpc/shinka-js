import {
  Response,
  type TransportFactory,
  type TransportClient,
  type ShinkaOn,
  type ShinkaDo,
  type SerializerRoot,
  type InternalHandlerThisArg,
} from "../src";

export const mkPipe = (delay = 0) => {
  let onTimeout = (value: any) => {};
  const send = (value: any) => setTimeout(onTimeout, delay, value);
  const dispatch = (cb: (value: any) => void) => {
    onTimeout = cb;
  };
  return [send, dispatch] as [typeof send, typeof dispatch];
};

export const mkPipePair = (delay1: number, delay2: number) => {
  const { 0: send1, 1: dispatch1 } = mkPipe(delay1);
  const { 0: send2, 1: dispatch2 } = mkPipe(delay2);
  return [
    [send1, dispatch2],
    [send2, dispatch1],
  ] as [ReturnType<typeof mkPipe>, ReturnType<typeof mkPipe>];
};

export const fakeTransportClient = <SO>(
  pipe: ReturnType<typeof mkPipe>,
  key: string,
  results: Record<string, any>[],
  setThisArg: (TA: InternalHandlerThisArg<any, any, any>) => void = () => {},
) => {
  const tf: TransportFactory<any, any, any> = async (
    thisArg,
    onRawData,
    onClosed,
    opts,
  ) => {
    setThisArg(thisArg);
    const { 0: send_, 1: dispatch } = pipe;
    const close = async () => {};
    const send = (value: unknown, opts: any) => {
      results.push({ key: `${key}-transport`, opts });
      send_(value);
    };
    dispatch(onRawData);
    return { send, close, instruction: {} };
  };
  return (() => tf) as TransportClient<SO, any, any>;
};

export const createMockSerializerAsync = <TO, B>(
  key: string,
  results: Record<string, any>[],
  setThisArg: (TA: InternalHandlerThisArg<any, any, any>) => void = () => {},
) =>
  ((shinkaOn) => async (thisArg, opts) => {
    setThisArg(thisArg);
    return {
      serialize: async (data: unknown, opts: any) => {
        results.push({ key: `${key}-serializer-async`, opts });
        return data;
      },
      deserialize: async (data: unknown) => data,
      transportInitOpts: { mode: "not-serialized" },
      typeHints: { serialize: "AsyncFunction", deserialize: "AsyncFunction" },
    };
  }) as SerializerRoot<any, TO, any>;

export const createMockSerializerSync = <TO, B>(
  key: string,
  results: Record<string, any>[],
  setThisArg: (TA: InternalHandlerThisArg<any, any, any>) => void = () => {},
) =>
  ((shinkaOn) => (thisArg, opts) => {
    setThisArg(thisArg);
    return {
      serialize: async (data: unknown, opts: any) => {
        results.push({ key: `${key}-serializer-sync`, opts });
        return data;
      },
      deserialize: async (data: unknown) => data,
      transportInitOpts: { mode: "not-serialized" },
      typeHints: { serialize: "AsyncFunction", deserialize: "AsyncFunction" },
    };
  }) as SerializerRoot<any, TO, any>;

export const createSyncHandler = (
  key: string,
  bus: ShinkaOn<any, any, any>,
  results: Record<string, any>[],
) =>
  bus.onRequest(
    key,
    ([arg, simple, ok]: any) => {
      results.push({ key: "sync-request", arg });
      const result = simple
        ? "bus1-simple-response-send"
        : new Response("nested-response-send", {
            serialize: "sync-serialize",
            transport: "sync-transport",
          });
      if (ok) return result;
      else throw result;
    },
    {
      serialize: "sync-serialize-default",
      transport: "sync-transport-default",
    },
  );

export const createAsyncHandler = (
  key: string,
  bus: ShinkaOn<any, any, any>,
  results: Record<string, any>[],
) =>
  bus.onRequest(
    key,
    async ([arg, simple, ok]: any) => {
      results.push({ key: "async-request", arg });
      const result = simple
        ? "simple-response-send"
        : new Response("nested-response-send", {
            serialize: "async-serialize",
            transport: "async-transport",
          });
      if (ok) return result;
      else throw result;
    },
    {
      serialize: "async-serialize-default",
      transport: "async-transport-default",
    },
  );

export const createDataEventHandler = (
  key: string,
  bus: ShinkaOn<any, any, any>,
  results: Record<string, any>[],
) =>
  bus.onDataEvent(key, (arg: any) => {
    results.push({ key: "data-event", arg });
  });

export const createMockBusService =
  (KEY: string) =>
  (
    bus: ShinkaDo<any, any>,
    arg: any,
    simple: Boolean,
    ok: Boolean,
    withOpts: Boolean,
  ) =>
    bus.request(
      KEY,
      [arg, simple, ok],
      withOpts
        ? {
            serialize: `${KEY}-req-serialize`,
            transport: `${KEY}-req-transport`,
          }
        : undefined,
    );
