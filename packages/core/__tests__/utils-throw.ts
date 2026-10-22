import {
  Client,
  type TransportClient,
  type TransportInstance,
  type SerializerRoot,
  type DeserializerFn,
  type LiMon,
  type OutScope,
  type OutScopeEventListener,
} from "../src";
import type { EventListenerType } from "../src/listeners/types";
import { clientListenersKeys } from "./utils-lib";

const dummy = () => {};
const aDummy = async () => {};

export const makeClientListener = (
  results: [any, any][],
  client: Client<any, any>,
  key: EventListenerType,
) => client.addEventListener(key, (_, data) => results.push([key, data]));

const throwsIf =
  <T, A extends Parameters<any>, R>(
    flags: Set<T>,
    flag: T,
    e: any,
    ok: (...args: A) => R,
  ) =>
  (...args: A) => {
    if (flags.has(flag)) throw e;
    return ok(...args);
  };

const aThrowsIf =
  <T, A extends Parameters<any>, R>(
    flags: Set<T>,
    flag: T,
    e: any,
    ok: (...args: A) => Promise<R>,
  ) =>
  async (...args: A) => {
    if (flags.has(flag)) throw e;
    return await ok(...args);
  };

const incCounter =
  <T extends Record<string, number>, A extends Parameters<any>, R>(
    counters: T,
    key: keyof T,
    cb: (...args: A) => R,
  ) =>
  (...args: A) => {
    counters[key]++;
    return cb(...args);
  };

export const enum ThrowOutScope {
  ADD = 1,
  RM = 2,
}

type ThrowOutScopeCounter = {
  add: number;
  remove: number;
};

const throwOutScope = (
  props: { o: Set<ThrowOutScope> },
  counter: ThrowOutScopeCounter,
) => {
  const outscopeState = new Set<OutScopeEventListener>();
  const outscope: OutScope = {
    add: incCounter(
      counter,
      "add",
      throwsIf(
        props.o,
        ThrowOutScope.ADD,
        "OUTSCOPE_ADD",
        outscopeState.add.bind(outscopeState),
      ),
    ),
    remove: incCounter(
      counter,
      "remove",
      throwsIf(
        props.o,
        ThrowOutScope.RM,
        "OUTSCOPE_RM",
        outscopeState.delete.bind(outscopeState),
      ),
    ),
  };
  return { outscopeState, outscope };
};

type ThrowTransportClientCounter = {
  init: number;
  ready: number;
  close: number;
};

type ThrowTransportClientOpts = {
  onReady: "sync" | "async";
};

export const enum ThrowClientTransport {
  INIT = 1,
  READY = 2,
  SEND = 3,
  CLOSE = 4,
}

export const throwTransportClient = (
  props: { o: Set<ThrowClientTransport> },
  counter: ThrowTransportClientCounter,
  { onReady: onReadyOpt }: ThrowTransportClientOpts = { onReady: "sync" },
) =>
  ((shinkaOn) => {
    return () => {
      counter.init++;
      if (props.o.has(ThrowClientTransport.INIT)) throw "TRANSPORT_INIT";

      const onReadyFn =
        onReadyOpt === "sync"
          ? throwsIf(
              props.o,
              ThrowClientTransport.READY,
              "TRANSPORT_READY",
              dummy,
            )
          : aThrowsIf(
              props.o,
              ThrowClientTransport.READY,
              "TRANSPORT_READY_ASYNC",
              aDummy,
            );

      const send = throwsIf(
        props.o,
        ThrowClientTransport.SEND,
        "TRANSPORT_SEND",
        dummy,
      );
      const onReady = incCounter(counter, "ready", onReadyFn);

      const close = incCounter(
        counter,
        "close",
        aThrowsIf(
          props.o,
          ThrowClientTransport.CLOSE,
          "TRANSPORT_CLOSE",
          aDummy,
        ),
      );

      return {
        send,
        onReady,
        close,
        instruction: { hi: true, bye: true },
        context: null,
      } satisfies TransportInstance<any, any>;
    };
  }) satisfies TransportClient<any, any, any, any>;

export const enum ThrowSerializer {
  INIT = 1,
  READY = 2,
  STOP = 3,
}

type ThrowSerializerCounter = {
  init: number;
  ready: number;
  stop: number;
};

type ThrowSerializerOpts = {
  onReady: "sync" | "async";
};

export const throwSerializer = (
  props: { o: Set<ThrowSerializer> },
  counter: ThrowSerializerCounter,
  { onReady: onReadyOpt }: ThrowSerializerOpts = { onReady: "sync" },
) =>
  ((shinkaOn) => {
    return (thisArg, opts) => {
      counter.init++;
      if (props.o.has(ThrowSerializer.INIT)) throw "SERIALIZER_INIT";

      const onReadyFn =
        onReadyOpt === "sync"
          ? throwsIf(props.o, ThrowSerializer.READY, "SERIALIZER_READY", dummy)
          : aThrowsIf(
              props.o,
              ThrowSerializer.READY,
              "SERIALIZER_READY_ASYNC",
              aDummy,
            );

      return {
        serialize: dummy,
        deserialize: dummy as DeserializerFn<any, any>,
        onReady: incCounter(counter, "ready", onReadyFn),
        stop: incCounter(
          counter,
          "stop",
          throwsIf(props.o, ThrowSerializer.STOP, "SERIALIZER_STOP", dummy),
        ),
        transportInitOpts: {
          mode: "text",
          mime: { type: "application", subtype: "fake" },
        },
        typeHints: { serialize: "Function", deserialize: "Function" },
      };
    };
  }) satisfies SerializerRoot<any, any, any>;

export const enum ThrowLimon {
  INIT = 1,
  START = 2,
  STOP = 3,
}

type ThrowLimonCounter = {
  init: number;
  start: number;
  stop: number;
};

type ThrowLimonOpts = {
  enabled: boolean;
};

export const throwLimon = (
  props: { o: Set<ThrowLimon> },
  counter: ThrowLimonCounter,
  opts: ThrowLimonOpts = { enabled: true },
) =>
  opts.enabled
    ? (((shinkaOn) => {
        return (thisArg) => {
          counter.init++;
          if (props.o.has(ThrowLimon.INIT)) throw "LIMON_INIT";

          const start = incCounter(
            counter,
            "start",
            throwsIf(props.o, ThrowLimon.START, "LIMON_START", dummy),
          );
          const stop = incCounter(
            counter,
            "stop",
            throwsIf(props.o, ThrowLimon.STOP, "LIMON_STOP", dummy),
          );
          return { start, stop };
        };
      }) as LiMon<any, any, any>)
    : null;

type ThrowClientCounters = {
  transport: ThrowTransportClientCounter;
  serializer: ThrowSerializerCounter;
  limon: ThrowLimonCounter;
  outscope: ThrowOutScopeCounter;
};

type ThrowClientOpts = {
  transport?: ThrowTransportClientOpts;
  serializer?: ThrowSerializerOpts;
  limon?: ThrowLimonOpts;
};

export const doClientTest = (
  transport: Iterable<ThrowClientTransport>,
  serializer: Iterable<ThrowSerializer>,
  limon: Iterable<ThrowLimon>,
  outscopeFlags: Iterable<ThrowOutScope>,
  opts: ThrowClientOpts = {},
) => {
  const results: [
    EventListenerType | "caught_start" | "caught_stop" | "success",
    any,
  ][] = [];

  const props = {
    transport: { o: new Set(transport) },
    serializer: { o: new Set(serializer) },
    limon: { o: new Set(limon) },
    outscope: { o: new Set(outscopeFlags) },
  };

  const counters: ThrowClientCounters = {
    transport: { init: 0, ready: 0, close: 0 },
    serializer: { init: 0, ready: 0, stop: 0 },
    limon: { init: 0, start: 0, stop: 0 },
    outscope: { add: 0, remove: 0 },
  };

  const { outscope, outscopeState } = throwOutScope(
    props.outscope,
    counters.outscope,
  );

  const client = new Client({
    outscope,
    transport: throwTransportClient(
      props.transport,
      counters.transport,
      opts.transport,
    ),
    serializer: throwSerializer(
      props.serializer,
      counters.serializer,
      opts.serializer,
    ),
    limon: throwLimon(props.limon, counters.limon, opts.limon),
  });

  clientListenersKeys.forEach(makeClientListener.bind(0, results, client));

  const runner = async () => {
    try {
      await client.start();
      results.push(["success", null]);
    } catch (e) {
      results.push(["caught_start", e]);
    }

    try {
      await client.stop();
    } catch (e) {
      results.push(["caught_stop", e]);
    }
  };

  return { results, props, runner, counters, outscopeState };
};
