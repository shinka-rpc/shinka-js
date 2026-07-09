import { busEvents } from "./handlers/bus";
import type { ShinkaDataEvent } from "../types";

type GracefulShutdownThis = readonly [
  ShinkaDataEvent<any, any>,
  () => void,
  () => Promise<void>,
];

export function gracefulShutdown(this: GracefulShutdownThis) {
  busEvents.terminate(this[0]);
  this[1]();
  this[2]();
}
