import type {
  ShinkaOn,
  Shinka,
  InternalHandlerThisArg,
} from "@shinka-rpc/core";

const { freeze: objectFreeze } = Object;

const taHandlerCache = new WeakMap<
  ShinkaOn<any, any, any>,
  (
    complete: (shinka: Shinka<any, any, any>) => Shinka<any, any, any>,
  ) => (
    thisArg: InternalHandlerThisArg<any, any, any>,
  ) => InternalHandlerThisArg<any, any, any>
>();

const handleCache = <K extends WeakKey, A, V>(
  cache: WeakMap<K, V>,
  factory: (key: K, ...args: A[]) => V,
  key: K,
  ...args: A[]
) => {
  let value = cache.get(key);
  if (value) return value;
  value = factory(key, ...args);
  cache.set(key, value);
  return value;
};

const taComplete = (
  thisArg: InternalHandlerThisArg<any, any, any>,
  complete: (shinka: Shinka<any, any, any>) => Shinka<any, any, any>,
) =>
  objectFreeze({
    ...thisArg,
    shinka: complete(thisArg.shinka),
    state: {},
  }) as InternalHandlerThisArg<any, any, any>;

const taHandler = (shinkaOn: ShinkaOn<any, any, any>) => {
  const taCache = new WeakMap<
    InternalHandlerThisArg<any, any, any>,
    InternalHandlerThisArg<any, any, any>
  >();
  return (complete: (shinka: Shinka<any, any, any>) => Shinka<any, any, any>) =>
    (thisArg: InternalHandlerThisArg<any, any, any>) =>
      handleCache(taCache, taComplete, thisArg, complete);
};

export const handleThisArg = (shinkaOn: ShinkaOn<any, any, any>) =>
  handleCache(taHandlerCache, taHandler, shinkaOn);
