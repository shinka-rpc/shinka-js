// @ts-expect-error: 2503
if (!Symbol.dispose) Symbol.dispose = Symbol.for("Symbol.dispose");

export type DisposeContext = Disposable & {
  dispose: () => void;
};

export const disposeContext = (dispose: () => void) =>
  Object.freeze({
    dispose,
    [Symbol.dispose]: dispose,
  } as DisposeContext);
