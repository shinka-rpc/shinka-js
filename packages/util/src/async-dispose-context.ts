// @ts-expect-error: 2503
if (!Symbol.asyncDispose) Symbol.dispose = Symbol.for("Symbol.asyncDispose");

export type AsyncDisposeContext = AsyncDisposable & {
  aDispose: () => Promise<void>;
};

export const asyncDisposeContext = (aDispose: () => Promise<void>) =>
  Object.freeze({
    aDispose,
    [Symbol.asyncDispose]: aDispose,
  } as AsyncDisposeContext);
