import type { NBAcquire, NBThisArg } from "@shinka-rpc/core";
import type { ConsensusProtocol, Consensus } from "@shinka-rpc/consensus";
import type { StateType, FSMEventType } from "./const-enums";
import type { DisposeContext } from "@shinka-rpc/util";

export type Nonces = ReturnType<ConsensusProtocol[0]>;
export type SetTimeout = ReturnType<typeof setTimeout>;

export type StateKey = "local" | "remote";
export type ActKey = "lock" | "release";

export type ResolveReject = {
  resolve: (value?: any) => void;
  reject: (reason: any) => void;
};

export type AcquireRequestProps = {
  nonces: Nonces;
  target: NBAcquire;
  timeout: number;
};

export type WithTimeout = {
  timeoutId: SetTimeout;
};

export type Pending = AcquireRequestProps;
export type Locked = WithTimeout & { target: NBAcquire };
export type ConsensusMixin = { consensus: Consensus };
export type SemaphoreCTXMixin = { semaphoreCtx: DisposeContext };

export type IdleState = {
  state: StateType.IDLE;
  local: null;
  remote: null;
};

export type RequestedState = {
  state: StateType.REQUESTED;
  local: Pending & WithTimeout & ResolveReject;
  remote: null;
};

export type LockedLocalState = {
  state: StateType.LOCKED_LOCAL;
  local: Locked;
  remote: null;
};

export type LockedRemoteState = {
  state: StateType.LOCKED_REMOTE;
  local: null;
  remote: Locked;
};

export type RaceStateWon1 = {
  state: StateType.RACE_WON_1;
  local: Pending;
  remote: Locked;
};

export type RaceStateWon2 = {
  state: StateType.RACE_WON_2;
  local: ResolveReject & SemaphoreCTXMixin;
  remote: Locked;
};

export type RaceStateLose1 = {
  state: StateType.RACE_LOSE_1;
  local: Locked & ResolveReject;
  remote: Pending;
};

export type RaceStateLose2 = {
  state: StateType.RACE_LOSE_2;
  local: null;
  remote: Locked;
};

export type FSMState =
  | IdleState
  | RequestedState
  | LockedLocalState
  | LockedRemoteState
  | RaceStateWon1
  | RaceStateWon2
  | RaceStateLose1
  | RaceStateLose2;

export type NBThisArgBaseOnStart = {
  protocol: ConsensusProtocol;
};

export type NBThisArgBase = NBThisArgBaseOnStart & {};

export type NBThisArgBaseMixin = { base: NBThisArgBase };

export type NBThisArgState = NBThisArgBaseMixin & FSMState;

// ===

export type LocalAcquireEventData = Omit<AcquireRequestProps, "nonces"> &
  ResolveReject;
export type LocalAcquireEvent = [
  FSMEventType.LOCAL_ACQUIRE,
  LocalAcquireEventData,
];

export type AcceptEventData = null;
export type AcceptEvent = [FSMEventType.ACCEPT, AcceptEventData];

export type RemoteAcquireEventData = AcquireRequestProps;
export type RemoteAcquireEvent = [
  FSMEventType.REMOTE_ACQUIRE,
  RemoteAcquireEventData,
];

export type LocalReleaseEventData = {
  semaphoreCtx: DisposeContext;
} & ResolveReject;
export type LocalReleaseEvent = [
  FSMEventType.LOCAL_RELEASE,
  LocalReleaseEventData,
];

export type RemoteReleaseEventData = null;
export type RemoteReleaseEvent = [
  FSMEventType.REMOTE_RELEASE,
  RemoteReleaseEventData,
];

export type TimeoutEventData = {
  timeout: number;
  key: StateKey;
};
export type TimeoutEvent = [FSMEventType.TIMEOUT, TimeoutEventData];

export type StopEventData = null;
export type StopEvent = [FSMEventType.STOP, StopEventData];

export type FSMEvent =
  | LocalAcquireEvent
  | AcceptEvent
  | RemoteAcquireEvent
  | LocalReleaseEvent
  | RemoteReleaseEvent
  | TimeoutEvent
  | StopEvent;

export type AnyNBThisArg = NBThisArg<any, any, NBThisArgState>;

export type GenericFSMEventHandler<T> = (
  thisArg: AnyNBThisArg,
  data: T,
) => void;

export type FSMEventHandler =
  | GenericFSMEventHandler<LocalAcquireEventData>
  | GenericFSMEventHandler<AcceptEventData>
  | GenericFSMEventHandler<RemoteAcquireEventData>
  | GenericFSMEventHandler<LocalReleaseEventData>
  | GenericFSMEventHandler<RemoteReleaseEventData>
  | GenericFSMEventHandler<TimeoutEventData>
  | GenericFSMEventHandler<StopEventData>;
