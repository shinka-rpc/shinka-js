import type { DisposeCb } from "./types";

const frCleanup = (dispose: DisposeCb) => dispose();

export const busProxyFR = new FinalizationRegistry(frCleanup);
