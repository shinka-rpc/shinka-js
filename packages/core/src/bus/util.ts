import type { IQueue } from "@shinka-rpc/collections";
import type {
  Message,
  NB_FIFOEntry,
  ShinkaMeta,
  SendFn,
  NBThisArg,
  ShinkaDataEvent,
  NBShinka,
  ShinkaEventListener,
} from "../types";
import { NBAcquire } from "./const-enums";
import { busEvents } from "./handlers/bus";
import { nbEvent } from "./handlers/non-blocking";

export const clearState = (state: any) => () => {
  for (const k of Object.keys(state)) delete state[k];
};

export function FIFOPush<SO, TO>(
  this: IQueue<NB_FIFOEntry<SO, TO>>,
  message: Message<any>,
  metadata?: ShinkaMeta<SO, TO>,
) {
  this.push([message, metadata]);
}

export type DrainThis<SO, TO> = [IQueue<NB_FIFOEntry<SO, TO>>, SendFn<SO, TO>];

export const drain = <SO, TO>(
  queue: IQueue<NB_FIFOEntry<SO, TO>>,
  send: SendFn<SO, TO>,
) => {
  while (queue.length) send(...queue.pop()!);
};

export type AcquireMeThis<SO, TO> = [NBThisArg<SO, TO, any>, NBAcquire];

export const acquireMe = <SO, TO>(
  nbThisArg: NBThisArg<SO, TO, any>,
  nbAcquire: NBAcquire,
  timeout: number,
) => nbThisArg.lock.acquire(nbThisArg, nbAcquire, timeout);

export const gracefulShutdown = (
  dataEvent: ShinkaDataEvent<any, any>,
  varsReset: () => void,
  busStop: () => Promise<void>,
) => {
  busEvents.terminate(dataEvent);
  varsReset();
  busStop();
};

export type VarsBye = {
  bye: 0 | 1;
};

export function byeReset(this: VarsBye) {
  this.bye = 0;
}

export const onTerminated = (
  byeVars: VarsBye,
  resetTransportCloseDelegate: () => void,
  busStop: () => void,
) => {
  byeVars.bye = 0;
  resetTransportCloseDelegate();
  busStop();
};

export function nbEventAcquire<SO, TO>(
  this: NBShinka<SO, TO, any>,
  target: NBAcquire,
  timeout: number,
  nonces: number[],
) {
  return nbEvent.acquire(this.dataEvent, target, timeout, nonces);
}

export function nbEventAccept<SO, TO>(this: NBShinka<SO, TO, any>) {
  return nbEvent.accept(this.dataEvent);
}

export function nbEventRelease<SO, TO>(this: NBShinka<SO, TO, any>) {
  return nbEvent.release(this.dataEvent);
}

export const eventListenerCaller = <B>(
  listener: ShinkaEventListener<B>,
  thisArg: B,
  target: any,
) => listener(thisArg, target);
