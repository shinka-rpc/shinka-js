import type { NBAcquire } from "../../const-enums";

export type RaceState = {
  target: NBAcquire;
  won: boolean;
};

export type NBThisArgState = {
  targetOwn?: NBAcquire;
  targetRemote?: NBAcquire;
  timeoutId?: ReturnType<typeof setTimeout>;
  nonces?: number[];
  race?: RaceState;
};
