import type { TransportInitOptsMode } from "@shinka-rpc/core";

export interface HasPostMessage {
  postMessage(message: any, transfer: Transferable[]): void;
  postMessage(message: any, options?: StructuredSerializeOptions): void;
}

export default {
  "not-serialized": () => {
    throw new Error("invalid mode");
  },
  text: (port) => (raw: string) => port.postMessage(raw),
  binary: (port) => (raw: Uint8Array) => port.postMessage(raw, [raw.buffer]),
} as Record<
  TransportInitOptsMode,
  (port: HasPostMessage) => (raw: any) => void
>;
