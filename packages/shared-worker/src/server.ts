import type {
  Bus,
  TransportServer,
  ShinkaOn,
  InternalHandlerThisArg,
  TransportConnectFn,
  TransportInitOpts,
} from "@shinka-rpc/core";
import makeSendRawFn from "@shinka-rpc/libtransport-message-port-send";

export const sharedWorkerServer = ((
  shinkaOn: ShinkaOn<any, any, InternalHandlerThisArg<any, any, Bus<any, any>>>,
  connect: TransportConnectFn<
    any,
    InternalHandlerThisArg<any, any, Bus<any, any>>
  >,
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
