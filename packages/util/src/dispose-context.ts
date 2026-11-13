// @ts-expect-error: 2503
if (!Symbol.dispose) Symbol.dispose = Symbol.for("Symbol.dispose");

export type DisposeContext = Disposable & {
  dispose: () => void;
};

const { freeze: objectFreeze } = Object;

export const disposeContext = (dispose: () => void) =>
  objectFreeze({
    dispose,
    [Symbol.dispose]: dispose,
  } as DisposeContext);
