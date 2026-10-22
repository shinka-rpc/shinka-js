import { ReusablePromise } from "@shinka-rpc/concurrency";

export type IdentityKey =
  | string
  | number
  | boolean
  | symbol
  | null
  | undefined
  | void;

type Identity<A, K extends IdentityKey> = (arg: A) => K;
type Retrieve<A, K extends IdentityKey, T> = (arg: A, key: K) => Promise<T>;
type Read<A, K extends IdentityKey, T> = (arg: A, key: K) => T;
type Reset<A, K extends IdentityKey> = (arg: A, key: K) => void;

export type CreateSingleFlightProps<A, K extends IdentityKey, T> = {
  identity?: Identity<A, K>;
  retrieve: Retrieve<A, K, T>;
  read: Read<A, K, T>;
  reset: Reset<A, K>;
};

const waitFor = async (awaitable: ReusablePromise<void>) => {
  try {
    await awaitable;
  } catch {}
};

type StateEntry = [
  boolean,
  ReusablePromise<void>,
  boolean,
  ReusablePromise<void>,
];

const enum StateEntryIDX {
  IS_PENDING = 0,
  PENDING = 1,
  IS_INVALIDATING = 2,
  INVALIDATING = 3,
}

const createEntry = () =>
  [
    false,
    new ReusablePromise<void>(),
    false,
    new ReusablePromise<void>(),
  ] satisfies StateEntry;

const unboundRetrieve = async <A, K extends IdentityKey, T>(
  retrieve: Retrieve<A, K, T>,
  arg: A,
  key: K,
  state: StateEntry,
) => {
  try {
    state[StateEntryIDX.IS_PENDING] = true;
    state[StateEntryIDX.PENDING].reset();
    const result = await retrieve(arg, key);
    state[StateEntryIDX.PENDING].resolve();
    return result;
  } catch (e) {
    state[StateEntryIDX.PENDING].reject(e as any);
    throw e;
  } finally {
    state[StateEntryIDX.IS_PENDING] = false;
  }
};

const singleFlightInnerUnbound = async <A, K extends IdentityKey, T>(
  stateMap: Map<K, StateEntry>,
  doRetrieve: (arg: A, key: K, state: StateEntry) => Promise<T>,
  read: Read<A, K, T>,
  arg: A,
  key: K,
) => {
  if (!stateMap.has(key)) {
    const state = createEntry();
    stateMap.set(key, state);
    try {
      return await doRetrieve(arg, key, state);
    } catch (e) {
      stateMap.delete(key);
      throw e;
    }
  }

  const state = stateMap.get(key)!;

  if (state[StateEntryIDX.IS_INVALIDATING]) {
    await waitFor(state[StateEntryIDX.INVALIDATING]);
    return await singleFlightInnerUnbound(stateMap, doRetrieve, read, arg, key);
  }

  if (state[StateEntryIDX.IS_PENDING]) {
    await state[StateEntryIDX.PENDING];
    return read(arg, key);
  }

  return read(arg, key);
};

export const createSingleFlight = <A, K extends IdentityKey, T>({
  identity = (a: A) => a as any as K,
  read,
  retrieve,
  reset,
}: CreateSingleFlightProps<A, K, T>) => {
  const stateMap = new Map<K, StateEntry>();
  const doRetrieve = (unboundRetrieve<A, K, T>).bind(0, retrieve);
  const singleFlightInner = (singleFlightInnerUnbound<A, K, T>).bind(
    0,
    stateMap,
    doRetrieve,
    read,
  );

  const singleFlight = async (arg: A) =>
    await singleFlightInner(arg, identity(arg));

  const invalidate = async (arg: A) => {
    const key = identity(arg);

    if (!stateMap.has(key)) return;

    const state = stateMap.get(key)!;

    if (state[StateEntryIDX.IS_INVALIDATING])
      return await state[StateEntryIDX.INVALIDATING];

    state[StateEntryIDX.IS_INVALIDATING] = true;
    state[StateEntryIDX.INVALIDATING].reset();

    if (state[StateEntryIDX.IS_PENDING])
      await waitFor(state[StateEntryIDX.PENDING]);

    try {
      reset(arg, key);
      stateMap.delete(key);
      state[StateEntryIDX.PENDING].reset();
      state[StateEntryIDX.IS_PENDING] = false;
      state[StateEntryIDX.INVALIDATING].resolve();
    } catch (e) {
      state[StateEntryIDX.INVALIDATING].reject(e as any);
      throw e;
    } finally {
      state[StateEntryIDX.IS_INVALIDATING] = false;
    }
  };

  return [singleFlight, invalidate] as [
    (arg: A) => Promise<T>,
    (arg: A) => Promise<void>,
  ];
};
