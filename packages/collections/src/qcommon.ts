import type { MapFn, ForEachFn } from "./types";

export type Entry<T> = [T, Entry<T> | null];

type HeadAndLength<T> = {
  length: number;
  head: Entry<T> | null;
};

export const shrink = <T, S extends HeadAndLength<T>>(
  n: number,
  state: S,
  clean: (state: S) => void,
) => {
  if (!Number.isInteger(n) || n < 0) throw new Error(`invalid length: ${n}`);
  if (n >= state.length) return;
  if (n === 0) clean(state);
  const popCount = n - state.length;
  let { head } = state;
  for (let i = 0; i < popCount; i++) head = head![1]!;
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
  clean: (state: S) => void,
) => {
  const { head } = state;
  if (head === null) return clean(state) as undefined;
  state.length--;
  state.head = head[1];
  return head[0];
};

export function* iteratorFn<T, S extends HeadAndLength<T>>(state: S) {
  let { head } = state;
  while (head) {
    yield head[0];
    head = head[1];
  }
}
