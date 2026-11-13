import { sleep } from "@shinka-rpc/util";
import type { IBus } from "@shinka-rpc/core";

export type ReconnectIntervalFn = (n: number) => number;

export const reconnect = (
  bus: IBus<any, any>,
  intervalFn: ReconnectIntervalFn,
) => {
  let n = 0,
    enabled = false,
    abort = new AbortController();

  const onDisconnected = () => {
    sleep(intervalFn(n), { signal: abort.signal })
      .then(() => bus.start().catch(() => n++))
      .catch();
  };

  const doAbort = (reason?: any) => {
    abort.abort(reason);
    abort = new AbortController();
  };

  const onConnected = () => {
    n = 0;
    doAbort();
  };

  const enable = () => {
    if (enabled) return;
    bus.addEventListener("disconnected", onDisconnected);
    bus.addEventListener("connected", onConnected);
    enabled = true;
  };

  const disable = () => {
    if (!enabled) return;
    bus.removeEventListener("disconnected", onDisconnected);
    bus.removeEventListener("connected", onConnected);
    doAbort();
    enabled = false;
  };

  enable();

  return { enable, disable };
};
