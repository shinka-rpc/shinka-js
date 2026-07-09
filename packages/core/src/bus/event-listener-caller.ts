import type { ShinkaEventListener } from "../types";

export type EventListenerCallerThis<B> = readonly [
  ShinkaEventListener<B>,
  B,
  any,
];

export function eventListenerCaller<B>(this: EventListenerCallerThis<B>) {
  this[0](this[1], this[2]);
}
