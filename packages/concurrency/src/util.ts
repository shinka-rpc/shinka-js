export type MaybeConstructor<T extends Object> = (new () => T) | T;

export const createOrUse = <T extends Object>(
  clsOrInstance: MaybeConstructor<T>,
) =>
  typeof clsOrInstance === "function" ? new clsOrInstance() : clsOrInstance;
