import { Consensus } from "@shinka-rpc/consensus";
import { StateType, FSMEventType } from "../const-enums";
import { onTimeout, idleState } from "../lifecycle";
import { apply, transition } from "../targets";
import type {
  AnyNBThisArg,
  LocalAcquireEventData,
  AcceptEventData,
  FSMEventHandler,
  RequestedState,
  NBThisArgBaseMixin,
  LockedLocalState,
  RemoteAcquireEventData,
  Pending,
  Locked,
  ConsensusMixin,
  LocalReleaseEventData,
  TimeoutEventData,
  LockedRemoteState,
  RemoteReleaseEventData,
  ResolveReject,
  SemaphoreCTXMixin,
  RaceStateWon1,
  RaceStateWon2,
  StateKey,
  StopEventData,
  WithTimeout,
  RaceStateLose1,
  RaceStateLose2,
} from "../types";

const idle = new Map<FSMEventType, FSMEventHandler>();
const requested = new Map<FSMEventType, FSMEventHandler>();
const lockedLocal = new Map<FSMEventType, FSMEventHandler>();
const lockedRemote = new Map<FSMEventType, FSMEventHandler>();
const raceWon1 = new Map<FSMEventType, FSMEventHandler>();
const raceWon2 = new Map<FSMEventType, FSMEventHandler>();
const raceLose1 = new Map<FSMEventType, FSMEventHandler>();
const raceLose2 = new Map<FSMEventType, FSMEventHandler>();

export const FSM = new Map<StateType, Map<FSMEventType, FSMEventHandler>>([
  [StateType.IDLE, idle],
  [StateType.REQUESTED, requested],
  [StateType.LOCKED_LOCAL, lockedLocal],
  [StateType.LOCKED_REMOTE, lockedRemote],
  [StateType.RACE_WON_1, raceWon1],
  [StateType.RACE_WON_2, raceWon2],
  [StateType.RACE_LOSE_1, raceLose1],
  [StateType.RACE_LOSE_2, raceLose2],
]);

const acquireEvent = (thisArg: AnyNBThisArg) => {
  const {
    api: {
      e: { acquire },
    },
    state,
    responseTimeout,
  } = thisArg;
  const local = state.local as Pending & WithTimeout;
  const { 0: createNonces } = state.base.protocol;
  const nonces = createNonces();
  const timeoutId = setTimeout(
    onTimeout,
    responseTimeout,
    thisArg,
    responseTimeout,
    "local",
  );
  const { target, timeout } = local;
  Object.assign(local, { nonces, timeoutId });
  acquire(target, timeout, nonces);
};

const clearTimeoutFor = (thisArg: AnyNBThisArg, key: StateKey) => {
  const { timeoutId } = thisArg.state[key]! as WithTimeout;
  clearTimeout(timeoutId);
};

const doStop = (thisArg: AnyNBThisArg) => {
  Object.assign(thisArg.state, idleState);
  thisArg.q.clear();
  thisArg.bus.stop();
};

const warnOnTimeout = (
  thisArg: AnyNBThisArg,
  { timeout, key }: TimeoutEventData,
) => thisArg.dispatchError(`Timeout ${key} happened in ${timeout}ms`);

const timeoutHandler = (thisArg: AnyNBThisArg, data: TimeoutEventData) => {
  // console.log("TIMEOUT", thisArg.bus.extra);
  warnOnTimeout(thisArg, data);
  doStop(thisArg);
};

const makeStopHandler =
  (key: StateKey) => (thisArg: AnyNBThisArg, data: StopEventData) => {
    // console.log("STOP", thisArg.bus.extra);
    clearTimeoutFor(thisArg, key);
    doStop(thisArg);
  };

const stopLocal = makeStopHandler("local");
const stopRemote = makeStopHandler("remote");

// IDLE --> ...

idle.set(
  FSMEventType.LOCAL_ACQUIRE,
  (thisArg: AnyNBThisArg, data: LocalAcquireEventData) => {
    // console.log("IDLE -> REQUESTED", thisArg.bus.extra);
    const local = { ...data, nonces: null, timeoutId: null } as any;
    const nextState: Partial<RequestedState> = {
      state: StateType.REQUESTED,
      local,
    };
    Object.assign(thisArg.state, nextState);
    acquireEvent(thisArg);
  },
);

idle.set(
  FSMEventType.REMOTE_ACQUIRE,
  (thisArg: AnyNBThisArg, { target, timeout }: RemoteAcquireEventData) => {
    // console.log("IDLE -> LOCKED_REMOTE", thisArg.bus.extra);
    const timeoutId = setTimeout(
      onTimeout,
      timeout,
      thisArg,
      timeout,
      "remote",
    );
    const remote: Locked & ConsensusMixin = {
      target,
      timeoutId,
      consensus: Consensus.WON,
    };
    const nextState: LockedRemoteState = {
      state: StateType.LOCKED_REMOTE,
      local: null,
      remote,
    };
    apply(thisArg, target, "lock");
    Object.assign(thisArg.state, nextState);
    thisArg.api.e.accept();
  },
);

idle.set(FSMEventType.STOP, () => 0);

// REQUESTED --> ...

requested.set(
  FSMEventType.ACCEPT,
  (thisArg: AnyNBThisArg, data: AcceptEventData) => {
    // console.log("REQUESTED -> LOCKED_LOCAL", thisArg.bus.extra);
    clearTimeoutFor(thisArg, "local");
    const state = thisArg.state as RequestedState & NBThisArgBaseMixin;
    const { timeout, target, resolve } = state.local;
    const timeoutId = setTimeout(onTimeout, timeout, thisArg, timeout, "local");
    const nextState: LockedLocalState = {
      state: StateType.LOCKED_LOCAL,
      local: { timeoutId, target },
      remote: null,
    };
    apply(thisArg, target, "lock");
    Object.assign(state, nextState);
    resolve();
  },
);

requested.set(
  FSMEventType.REMOTE_ACQUIRE,
  (thisArg: AnyNBThisArg, data: RemoteAcquireEventData) => {
    const { state } = thisArg;
    const {
      local,
      base: {
        protocol: { 1: resolver },
      },
    } = state as NBThisArgBaseMixin & RequestedState;
    clearTimeout(local.timeoutId);
    const consensus = resolver(local.nonces, data.nonces);
    switch (consensus) {
      case Consensus.WON: {
        // console.log("REQUESTED -> RACE_WON_1", thisArg.bus.extra);
        const { timeout: localTimeout, target: localTarget, resolve } = local;
        const timeoutId = setTimeout(
          onTimeout,
          localTimeout,
          thisArg,
          localTimeout,
          "remote",
        );
        apply(thisArg, localTarget, "lock");
        const nextRemote: Locked = {
          timeoutId,
          target: data.target,
        };
        const nextState: Partial<RaceStateWon1> = {
          state: StateType.RACE_WON_1,
          remote: nextRemote,
        };
        Object.assign(thisArg.state, nextState);
        return resolve();
      }
      case Consensus.LOSE: {
        // console.log("REQUESTED -> RACE_LOSE_1", thisArg.bus.extra);
        const { timeout: localTimeout } = data;
        const timeoutId = setTimeout(
          onTimeout,
          localTimeout,
          thisArg,
          localTimeout,
          "local",
        );
        apply(thisArg, data.target, "lock");
        const nextLocal: Locked & ResolveReject = {
          timeoutId,
          target: local.target,
          resolve: local.resolve,
          reject: local.reject,
        };
        const nextState: RaceStateLose1 = {
          state: StateType.RACE_LOSE_1,
          local: nextLocal,
          remote: data,
        };
        return Object.assign(thisArg.state, nextState);
      }
      case Consensus.UNKNOWN: {
        // console.log("REQUESTED -> REQUESTED", thisArg.bus.extra);
        thisArg.state.remote = data;
        return acquireEvent(thisArg);
      }
      default:
        thisArg.dispatchError("Wrong consensus calculated");
    }
  },
);

requested.set(FSMEventType.TIMEOUT, timeoutHandler);
requested.set(FSMEventType.STOP, stopLocal);

// LOCKED_LOCAL --> ...

lockedLocal.set(
  FSMEventType.LOCAL_RELEASE,
  (thisArg: AnyNBThisArg, { semaphoreCtx, resolve }: LocalReleaseEventData) => {
    // console.log("LOCKED_LOCAL -> IDLE", thisArg.bus.extra);
    const { timeoutId, target } = thisArg.state.local! as Locked;
    queueMicrotask(thisArg.api.e.release);
    clearTimeout(timeoutId);
    apply(thisArg, target, "release");
    Object.assign(thisArg.state, idleState);
    semaphoreCtx.dispose();
    resolve();
    thisArg.q.drain();
  },
);

lockedLocal.set(FSMEventType.TIMEOUT, timeoutHandler);
lockedLocal.set(FSMEventType.STOP, stopLocal);

// LOCKED_REMOTE --> ...

lockedRemote.set(
  FSMEventType.REMOTE_RELEASE,
  (thisArg: AnyNBThisArg, data: RemoteReleaseEventData) => {
    // console.log("LOCKED_REMOTE -> IDLE", thisArg.bus.extra);
    const { timeoutId, target } = thisArg.state.remote as Locked;
    clearTimeout(timeoutId);
    apply(thisArg, target, "release");
    Object.assign(thisArg.state, idleState);
    thisArg.q.drain();
  },
);

lockedRemote.set(FSMEventType.TIMEOUT, timeoutHandler);
lockedRemote.set(FSMEventType.STOP, stopRemote);

// RACE_WON_1 --> ...

raceWon1.set(
  FSMEventType.LOCAL_RELEASE,
  (
    thisArg: AnyNBThisArg,
    { reject, resolve, semaphoreCtx }: LocalReleaseEventData,
  ) => {
    // console.log("RACE_WON_1 -> RACE_WON_2", thisArg.bus.extra);
    const { local, remote } = thisArg.state as RaceStateWon1;
    clearTimeout(remote.timeoutId);
    const { timeout } = local;
    const nextLocal: SemaphoreCTXMixin & ResolveReject = {
      reject,
      resolve,
      semaphoreCtx,
    };
    const nextRemote: Locked = {
      timeoutId: setTimeout(onTimeout, timeout, thisArg, timeout, "remote"),
      target: remote!.target,
    };
    const nextState: RaceStateWon2 = {
      state: StateType.RACE_WON_2,
      local: nextLocal,
      remote: nextRemote,
    };

    transition(thisArg, local.target, remote.target);
    Object.assign(thisArg.state, nextState);
    thisArg.api.e.release();
  },
);

raceWon1.set(FSMEventType.TIMEOUT, timeoutHandler);
raceWon1.set(FSMEventType.STOP, stopRemote);

// RACE_WON_2 --> ...

raceWon2.set(
  FSMEventType.REMOTE_RELEASE,
  (thisArg: AnyNBThisArg, data: RemoteReleaseEventData) => {
    // console.log("RACE_WON_2 -> IDLE", thisArg.bus.extra);
    const { local, remote } = thisArg.state as RaceStateWon2;
    const { semaphoreCtx, resolve } = local;
    clearTimeout(remote.timeoutId);
    apply(thisArg, remote.target, "release");
    Object.assign(thisArg.state, idleState);
    resolve();
    semaphoreCtx.dispose();
    thisArg.q.drain();
  },
);

raceWon2.set(FSMEventType.TIMEOUT, timeoutHandler);
raceWon1.set(FSMEventType.STOP, stopRemote);

// RACE_LOSE_1 --> ...

raceLose1.set(
  FSMEventType.REMOTE_RELEASE,
  (thisArg: AnyNBThisArg, data: RemoteReleaseEventData) => {
    // console.log("RACE_LOSE_1 -> RACE_LOSE_2", thisArg.bus.extra);
    const { local, remote } = thisArg.state as RaceStateLose1;
    clearTimeout(local.timeoutId);
    const { timeout } = remote;
    const { resolve } = local;
    const nextRemote: Locked = {
      timeoutId: setTimeout(onTimeout, timeout, thisArg, timeout, "remote"),
      target: remote!.target,
    };
    const nextState: RaceStateLose2 = {
      state: StateType.RACE_LOSE_2,
      local: null,
      remote: nextRemote,
    };
    transition(thisArg, remote.target, local.target);
    Object.assign(thisArg.state, nextState);
    resolve();
  },
);

raceLose1.set(FSMEventType.TIMEOUT, timeoutHandler);
raceWon1.set(FSMEventType.STOP, stopLocal);

// RACE_LOSE_2 --> ...

raceLose2.set(
  FSMEventType.LOCAL_RELEASE,
  (thisArg: AnyNBThisArg, { semaphoreCtx, resolve }: LocalReleaseEventData) => {
    // console.log("RACE_LOSE_2 -> IDLE", thisArg.bus.extra);
    const { remote } = thisArg.state as RaceStateLose2;
    clearTimeout(remote.timeoutId);
    apply(thisArg, remote.target, "release");
    Object.assign(thisArg.state, idleState);
    resolve();
    semaphoreCtx.dispose();
    thisArg.q.drain();
  },
);

raceLose2.set(FSMEventType.TIMEOUT, timeoutHandler);
raceWon1.set(FSMEventType.STOP, stopRemote);
