import type { Shinka, InternalHandlerThisArg } from "@shinka-rpc/core";
import { handleCache } from "@shinka-rpc/util";

const { freeze: objectFreeze } = Object;

const buildTA = (
  wrap: (shinka: Shinka<any, any, any>) => Shinka<any, any, any>,
  thisArg: InternalHandlerThisArg<any, any, any>,
) =>
  objectFreeze({
    ...thisArg,
    shinka: wrap(thisArg.shinka),
    state: {},
  }) as InternalHandlerThisArg<any, any, any>;

export default (
  wrap: (shinka: Shinka<any, any, any>) => Shinka<any, any, any>,
) =>
  (handleCache<
    InternalHandlerThisArg<any, any, any>,
    InternalHandlerThisArg<any, any, any>
  >).bind(0, new WeakMap(), buildTA.bind(0, wrap));
