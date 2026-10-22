// @ts-expect-error: 2503
if (!Symbol.asyncDispose) Symbol.dispose = Symbol.for("Symbol.asyncDispose");

export type AsyncDisposeContext = AsyncDisposable & {
  aDispose: () => Promise<void>;
};

const { freeze: objectFreeze } = Object;

export const asyncDisposeContext = (aDispose: () => Promise<void>) =>
  objectFreeze({
    aDispose,
    [Symbol.asyncDispose]: aDispose,
  } as AsyncDisposeContext);
