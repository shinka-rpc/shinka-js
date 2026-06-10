import type { ShinkaEventListener } from "./types";

export type MicroTaskHelperThis<B> = readonly [ShinkaEventListener<B>, B];

export function microTaskHelper<B>(this: MicroTaskHelperThis<B>) {
  this[0](this[1]);
}
