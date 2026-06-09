import type { TransportInitOptsMode } from "@shinka-rpc/core";

export default {
  "not-serialized": () => {
    throw new Error("invalid mode");
  },
  text: (worker) => (raw: string) => worker.postMessage(raw),
  binary: (worker) => (raw: Uint8Array) =>
    worker.postMessage(raw, [raw.buffer]),
} as Record<TransportInitOptsMode, (worker: Worker) => (raw: any) => void>;
