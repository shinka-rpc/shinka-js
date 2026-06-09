import type { ShinkaOn, TransportInitOpts } from "@shinka-rpc/core";
import makeSendRawFn from "@shinka-rpc/libtransport-message-port-send";

export const dedicatedWorkerClient =
  (create: () => Worker) =>
  <SO, TA>(shinka: ShinkaOn<SO, any, TA>) =>
  (
    onRawData: (data: any) => void,
    onClosed: () => void,
    opts: TransportInitOpts,
  ) => {
    const instance = create();
    instance.onmessage = onRawData;
    instance.onmessageerror = onClosed;
    const close = async () => instance.terminate();
    const send = makeSendRawFn[opts.mode](instance);
    return { send, close, instruction: {} };
  };
