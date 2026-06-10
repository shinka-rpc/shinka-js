import type { ShinkaEventListener } from "./types";

export type MicroTaskHelperThis<B> = readonly [ShinkaEventListener<B>, B, any];

export function microTaskHelper<B>(this: MicroTaskHelperThis<B>) {
  this[0](this[1], this[2]);
}
