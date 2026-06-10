import type {
  ShinkaOnBus,
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
  <SO>(shinka: ShinkaOnBus<SO, any>) =>
  (
    onRawData: (data: any) => void,
    onClosed: () => void,
    opts: TransportInitOpts,
  ) => {
    const messageHandler = (event: MessageEvent) => onRawData(event.data);
    addEventListener("message", messageHandler);
    addEventListener("messageerror", onClosed);
    const send = makeSendRawFn[opts.mode](targetOrigin);
    const _close = async () => {
      removeEventListener("message", messageHandler);
      removeEventListener("messageerror", onClosed);
      close();
    };
    return { send, close: _close, instruction: {} };
  };
