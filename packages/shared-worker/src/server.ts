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
  eventListeners,
) => {
  const swEventHandler = (connectEvent: Event) => {
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
        port.onmessage = (ev) => onRawData(ev.data);
        port.onmessageerror = onClosed;
        return { send, close, instruction: {} };
      },
    );
  };
  eventListeners.add("connect", () =>
    addEventListener("connect", swEventHandler),
  );
  eventListeners.add("predisconnect", () =>
    removeEventListener("connect", swEventHandler),
  );
}) as TransportServer<any, any>;
