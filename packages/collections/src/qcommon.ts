import type { MapFn, ForEachFn } from "./types";

export type Entry<T> = [T, Entry<T> | null];

type HeadAndLength<T> = {
  length: number;
  head: Entry<T> | null;
};

const { assign: objectAssign, freeze: objectFreeze } = Object;

export function restoreInitialState<T extends {}>(this: T, state: T) {
  objectAssign(state, this);
}

export const truncateFn = <T, S extends HeadAndLength<T>>(
  n: number,
  state: S,
  resetState: (state: S) => void,
) => {
  if (!Number.isInteger(n) || n < 0) throw new Error(`invalid length: ${n}`);
  if (n >= state.length) return;
  if (n === 0) return resetState(state);
  const popCount = state.length - n;
  let { head } = state,
    nextHead;
  for (let i = 0; i < popCount; i++) {
    nextHead = head![1]!;
    head!.fill(null);
    head = nextHead;
  }
  state.head = head;
  state.length = n;
};

export const mapFn = <T, M, TA, S extends HeadAndLength<T>>(
  state: S,
  thisArg: TA,
  cb: MapFn<T, TA, M>,
) => {
  if (state.length === 0) return [];
  const ret = new Array<M>(state.length);
  let { head } = state,
    i = 0;

  while (head) {
    ret[i++] = cb(head[0], thisArg);
    head = head[1];
  }

  return ret;
};

export const forEachFn = <T, TA, S extends HeadAndLength<T>>(
  state: S,
  thisArg: TA,
  cb: ForEachFn<T, TA>,
) => {
  let { head } = state;
  while (head) {
    cb(head[0], thisArg);
    head = head[1];
  }
};

export const popFn = <T, S extends HeadAndLength<T>>(
  state: S,
  resetState: (state: S) => void,
) => {
  const { head } = state;
  if (head === null) return resetState(state) as undefined;
  state.length--;
  state.head = head[1];
  const value = head[0];
  head.fill(null);
  return value;
};

// iterator ===

const emptyIteration = objectFreeze({ done: true });

const nextFn = <T>(head: Entry<T> | null) => {
  let value: T;
  return () => {
    if (head === null) return emptyIteration;
    value = head[0];
    head = head[1];
    return { value };
  };
};

function returnThis<T>(this: T) {
  return this;
}

export const iteratorFn = <T, S extends HeadAndLength<T>>(state: S) => {
  const next = nextFn(state.head);
  return { next, [Symbol.iterator]: returnThis } as IterableIterator<
    T,
    void,
    void
  >;
};
