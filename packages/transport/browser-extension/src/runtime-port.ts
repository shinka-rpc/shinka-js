import type {
  ServerBus,
  CompleteFN,
  CommonBus,
  TransportAPI,
  TransportInitOpts,
} from "@shinka-rpc/core";

export type CompleteCB = (port: chrome.runtime.Port) => CompleteFN<CommonBus>;

export const messagePortTransport =
  (bus: ServerBus, complete: CompleteCB = () => () => {}) =>
  async (port: chrome.runtime.Port) => {
    const transport = async (bus: CommonBus, opts: TransportInitOpts) => {
      port.onMessage.addListener(bus.onMessage);
      port.onDisconnect.addListener(() => client.stop());
      const send = async (data: unknown) => port.postMessage(data);
      const close = async () => port.disconnect();
      return { send, close, instruction: { hi: true } };
    };
    const client = await bus.connect({ transport, complete: complete(port) });
  };
