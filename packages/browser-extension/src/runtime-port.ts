import type { ServerBus, CompleteFN, CommonBus } from "@shinka-rpc/core";

export type CompleteCB = (port: chrome.runtime.Port) => CompleteFN;

export const messagePortFactory =
  (bus: ServerBus, complete: CompleteCB = () => () => {}) =>
  async (port: chrome.runtime.Port) => {
    const onconnect = async (bus: CommonBus) => {
      port.onMessage.addListener(bus.onMessage);
      port.onDisconnect.addListener(() => client.stop());
      const send = async (data: unknown) => port.postMessage(data);
      const close = async () => port.disconnect();
      return { send, close };
    };
    const client = await bus.onConnect(onconnect, complete(port));
  };
