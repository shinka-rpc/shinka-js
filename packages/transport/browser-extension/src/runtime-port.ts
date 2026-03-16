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
    const transport = async (
      bus: CommonBus,
      api: TransportAPI,
      opts: TransportInitOpts,
    ) => {
      port.onMessage.addListener(bus.onMessage);
      port.onDisconnect.addListener(() => client.stop());
      self.addEventListener("beforeunload", api.bye);
      const send = async (data: unknown) => port.postMessage(data);
      const close = async () => {
        // chrome-specific issue: worker stops unexpectedly
        self.removeEventListener("beforeunload", api.bye);
        port.disconnect();
      };
      return { send, close };
    };
    const client = await bus.connect({ transport, complete: complete(port) });
  };
