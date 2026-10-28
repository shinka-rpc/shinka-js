import type { IQueue } from "@shinka-rpc/collections";
import type { ReusablePromise } from "@shinka-rpc/concurrency";
import type { NB_FIFOEntry, NBThisArg, NBShinka } from "../types";
import type { ShinkaEventListener } from "../listeners/types";
import type {
  Message,
  ShinkaMeta,
  SendFn,
  ShinkaDoDataEvent,
  REQID,
} from "../shinka";
import { NBAcquire } from "./const-enums";
import { busEvents } from "./handlers/bus";
import { nbEvent } from "./handlers/non-blocking";

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
  dataEvent: ShinkaDoDataEvent<any, any>,
  varsReset: () => void,
  busStop: () => Promise<void>,
) => {
  busEvents.terminate(dataEvent);
  varsReset();
  busStop();
};

export type VarsBye = {
  bye: 0 | 1;
  closed: 0 | 1;
};

export const enum BusState {
  STOPPED = 0,
  STARTING = 1,
  STARTED = 2,
  STOPPING = 3,
}

export type TransitionVars = {
  state: BusState;
  transition: Promise<void> | null;
};

export function byeReset(this: VarsBye) {
  this.bye = 0;
}

export const onTerminated = (
  byeVars: VarsBye,
  resetTransportCloseDelegate: () => void,
  busStop: () => void,
) => {
  byeVars.closed = 1;
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

export function eventListenerCaller<B>(
  this: B,
  listener: ShinkaEventListener<B>,
  target: any,
) {
  listener(this, target);
}

export const createTransition = async (
  vars: TransitionVars,
  stateTarget: BusState,
  statePending: BusState,
  transitionFn: () => Promise<void>,
  dispatchTransition: () => void,
  rPromise: ReusablePromise<void>,
) => {
  while (vars.transition) {
    if (vars.state === statePending) return await vars.transition;
    else {
      try {
        await vars.transition;
      } catch (e) {}
    }
  }
  if (vars.state === stateTarget) return;
  // Next works as critical section
  // Rule: no `await` before `vars.transition` is set
  rPromise.reset();
  const transition = rPromise.then(transitionFn);
  vars.transition = transition; // <== since here await is allowed
  vars.state = statePending;
  await Promise.resolve();
  dispatchTransition();
  rPromise.resolve();
  return await transition;
};
