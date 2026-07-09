import type { NBAcquire } from "./constants";

export type NBThisArgState = {
  target?: NBAcquire;
  timeoutId?: ReturnType<typeof setTimeout>;
  nonce?: number;
};
