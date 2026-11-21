import type { DisposeCb } from "./types";

const frCleanup = (dispose: DisposeCb) => dispose();

export const busProxyFR = new FinalizationRegistry(frCleanup);

export const PoolExtraSym = Symbol.for("@shinka-rpc/core:pool:initExtra");
