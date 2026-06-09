import type {
  ShinkaOn,
  TransportInitOpts,
  TransportInitOptsMode,
} from "@shinka-rpc/core";

export type DedicatedWorkerServerConnect = (messageEvent: MessageEvent) => void;

const makeSendRawFn = {
  "not-serialized": () => {
    throw new Error("invalid mode");
  },
  text: (targetOrigin) => (raw: string) => postMessage(raw, targetOrigin),
  binary: (targetOrigin) => (raw: Uint8Array) =>
    postMessage(raw, targetOrigin, [raw.buffer]),
} as Record<
  TransportInitOptsMode,
  (targetOrigin: string) => (raw: any) => void
>;

export const dedicatedWorkerServer =
  (targetOrigin = "/") =>
  <SO, TA>(shinka: ShinkaOn<SO, any, TA>) =>
  (
    onRawData: (data: any) => void,
    onClosed: () => void,
    opts: TransportInitOpts,
  ) => {
    addEventListener("message", (event) => onRawData(event.data));
    addEventListener("messageerror", onClosed);
    const send = makeSendRawFn[opts.mode](targetOrigin);
    return { send, close: async () => close(), instruction: {} };
  };
