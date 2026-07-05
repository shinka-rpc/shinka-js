export type Entry<T> = [T, Entry<T> | undefined];

type HeadAndLength<T> = {
  length: number;
  head: Entry<T> | undefined;
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
  let head = state.head!;
  for (let i = 0; i < popCount; i++) head = head[1]!;
  state.head = head;
  state.length = n;
};

export const mapFn = <T, M, TA, S extends HeadAndLength<T>>(
  state: S,
  thisArg: TA,
  cb: (val: T, thisArg: TA) => M,
) => {
  if (state.length === 0) return [];
  const ret = new Array<M>(state.length);

  let head = state.head;
  let i = 0;

  while (head) {
    const [val, next] = head;
    ret[i] = cb(val, thisArg);
    i++;
    head = next;
  }

  return ret;
};

export const forEachFn = <T, TA, S extends HeadAndLength<T>>(
  state: S,
  thisArg: TA,
  cb: (val: T, thisArg: TA) => void,
) => {
  let head = state.head;
  while (head) {
    const [val, next] = head;
    cb(val, thisArg);
    head = next;
  }
};

export const popFn = <T, S extends HeadAndLength<T>>(state: S) => {
  const { head } = state;
  if (head === undefined) return;
  state.length--;
  state.head = head[1];
  return head;
};

export function* iteratorFn<T, S extends HeadAndLength<T>>(state: S) {
  let head = state.head;
  while (head) {
    const [val, next] = head;
    yield val;
    head = next;
  }
}
