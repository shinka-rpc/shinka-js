import {
  Response,
  TransportInitOpts,
  type CommonBus,
  type ClientBus,
  type SerializerFactory,
  type TransportRoot,
  type TransportFactory,
  type SerializedData,
  type ShinkaOn,
  SerializerRoot,
} from "@shinka-rpc/core";

export const mkPipe = (delay = 0) => {
  let onTimeout = (value: any) => {};
  const send = (value: any) => setTimeout(onTimeout, delay, value);
  const dispatch = (cb: (value: any) => void) => {
    onTimeout = cb;
  };
  return [send, dispatch] as [typeof send, typeof dispatch];
};

export const mkPipePair = (delay1: number, delay2: number) => {
  const [send1, dispatch1] = mkPipe(delay1);
  const [send2, dispatch2] = mkPipe(delay2);
  return [
    [send1, dispatch2],
    [send2, dispatch1],
  ] as [ReturnType<typeof mkPipe>, ReturnType<typeof mkPipe>];
};

export const fakeTransportClient = <SO, B extends CommonBus<SO, any>>(
  pipe: ReturnType<typeof mkPipe>,
  key: string,
  results: Record<string, any>[],
) => {
  const tf: TransportFactory<any> = async (
    onRawData: (data: SerializedData) => void,
    opts: TransportInitOpts,
  ) => {
    const [send_, dispatch] = pipe;
    const close = async () => {};
    const send = (value: unknown, opts: any) => {
      results.push({ key: `${key}-transport`, opts });
      send_(value);
    };
    dispatch(onRawData);
    return { send, close, instruction: {} };
  };
  return (() => [tf]) as TransportRoot<SO, any, B>;
};

export const createMockSerializerAsync = <TO, B>(
  key: string,
  results: Record<string, any>[],
) =>
  (() => [
    (async () => ({
      serialize: async (data: unknown, opts: any) => {
        results.push({ key: `${key}-serializer-async`, opts });
        return data;
      },
      deserialize: async (data: unknown) => data,
      transportInitOpts: { mode: "not-serialized" },
      typeHints: { serialize: "AsyncFunction", deserialize: "AsyncFunction" },
    })) as SerializerFactory<any>,
  ]) as SerializerRoot<any, TO, B>;

export const createMockSerializerSync = <TO, B>(
  key: string,
  results: Record<string, any>[],
) =>
  (() => [
    (() => ({
      serialize: async (data: unknown, opts: any) => {
        results.push({ key: `${key}-serializer-sync`, opts });
        return data;
      },
      deserialize: async (data: unknown) => data,
      transportInitOpts: { mode: "not-serialized" },
      typeHints: { serialize: "AsyncFunction", deserialize: "AsyncFunction" },
    })) as SerializerFactory<any>,
  ]) as SerializerRoot<any, TO, B>;

export const createSyncHandler = (
  bus: ShinkaOn<any, any, any>,
  results: Record<string, any>[],
) =>
  bus.onRequest(
    "bus1-sync",
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
  bus: ClientBus<any, any>,
  results: Record<string, any>[],
) =>
  bus.onRequest(
    "bus1-async",
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

export const createMockBusService =
  (KEY: string, bus: ClientBus<any, any> | CommonBus<any, any>) =>
  (arg: any, simple: Boolean, ok: Boolean, withOpts: Boolean) =>
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
