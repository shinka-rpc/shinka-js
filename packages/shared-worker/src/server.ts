import type {
  TransportServer,
  ShinkaOnBus,
  TransportConnectFnBus,
  TransportInitOpts,
} from "@shinka-rpc/core";
import makeSendRawFn from "@shinka-rpc/libtransport-message-port-send";

export const sharedWorkerServer = ((
  shinkaOn: ShinkaOnBus<any, any>,
  connect: TransportConnectFnBus<any, any>,
) =>
  addEventListener("connect", (connectEvent: Event) => {
    const port = (connectEvent as any as MessageEvent)
      .source as any as MessagePort;
    const close = async () => port.close();
    connect(
      (
        onRawData: (data: any) => void,
        onClosed: () => void,
        opts: TransportInitOpts,
      ) => {
        const send = makeSendRawFn[opts.mode](port);
        port.onmessage = onRawData;
        port.onmessageerror = onClosed;
        return { send, close, instruction: {} };
      },
    );
  })) as TransportServer<any, any>;
