import type { ShinkaConnectEventListener } from "./types";

export type MicroTaskHelperThis<B> = [ShinkaConnectEventListener<B>, B];

export function microTaskHelper<B>(this: MicroTaskHelperThis<B>) {
  this[0](this[1]);
}
