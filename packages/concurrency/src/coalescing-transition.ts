import { ReusablePromise } from "./reusable-promise";

type CoalescingTransitionState<T> = [T, Promise<any> | null];

const tryCall = <A extends any[]>(cb: (...args: A) => void, ...args: A) => {
  try {
    cb(...args);
  } catch (e) {
    console.trace(e);
  }
};

export const createCoalescingTransition = <T>(initialState: T) => {
  const state: CoalescingTransitionState<T> = [initialState, null];
  const getState = () => state[0];
  const coalescingTransition = (
    stateTarget: T,
    statePending: T,
    transitionFn: () => void | Promise<void>,
    dispatchBegin: () => void,
    dispatchOK: () => void,
    dispatchErr: (err: any) => void,
  ) => {
    const rPromise = new ReusablePromise<T>();
    const wrapTransitionFn = async (previousState: T) => {
      tryCall(dispatchBegin);
      try {
        await transitionFn();
        state[0] = stateTarget;
        tryCall(dispatchOK);
      } catch (e) {
        state[0] = previousState;
        tryCall(dispatchErr, e);
        throw e;
      } finally {
        state[1] = null;
      }
    };
    return async () => {
      while (state[1]) {
        if (state[0] === statePending) return await state[1];
        else {
          try {
            await state[1];
          } catch (e) {}
        }
      }
      if (state[0] === stateTarget) return;
      rPromise.reset();
      const transition = rPromise.then(wrapTransitionFn);
      const previousState = state[0];
      state[1] = transition;
      state[0] = statePending;
      await Promise.resolve();
      rPromise.resolve(previousState);
      return await transition;
    };
  };

  return [getState, coalescingTransition] as const;
};

type CoalescingTransitionEntry<T> = ReturnType<
  typeof createCoalescingTransition<T>
>;

export type CoalescingTransition<T> = CoalescingTransitionEntry<T>[1];
