import type { TransportInitOpts, ShinkaOnBus } from "@shinka-rpc/core";
import makeSendRawFn from "@shinka-rpc/libtransport-message-port-send";

export const sharedWorkerClient =
  (create: () => SharedWorker) =>
  <SO>(shinka: ShinkaOnBus<SO, any>) =>
  (
    onRawData: (data: any) => void,
    onClosed: () => void,
    opts: TransportInitOpts,
  ) => {
    const instance = create();
    instance.port.onmessage = onRawData;
    instance.port.onmessageerror = onClosed;
    const close = async () => instance.port.close();
    const send = makeSendRawFn[opts.mode](instance.port);
    return { send, close, instruction: {} };
  };
