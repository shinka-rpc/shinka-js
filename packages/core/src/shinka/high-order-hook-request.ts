import { Response } from "./response";
import type {
  ShinkaOnRequestMeta,
  ShinkaOnRequestHandlerBase,
  TaskCTL,
  FnConstructorName,
} from "./types";

const highOrderHookSync = <SO, TO, TA, B, R>(
  cb: ShinkaOnRequestHandlerBase<TA, B, R>,
  metadata?: ShinkaOnRequestMeta<SO, TO>,
) =>
  metadata
    ? (body: B, thisArg: TA, taskCtl: TaskCTL) => {
        try {
          const response = cb(body, thisArg, taskCtl);
          if (response instanceof Response)
            response.metadata = { ...metadata, ...response.metadata };
          return response;
        } catch (e) {
          if (e instanceof Response)
            e.metadata = { ...metadata, ...e.metadata };
          throw e;
        }
      }
    : cb;

const highOrderHookAsync = <SO, TO, TA, B, R>(
  cb: ShinkaOnRequestHandlerBase<TA, B, R>,
  metadata?: ShinkaOnRequestMeta<SO, TO>,
) =>
  metadata
    ? ((async (body: B, thisArg: TA, taskCtl: TaskCTL) => {
        try {
          const response = await cb(body, thisArg, taskCtl);
          if (response instanceof Response)
            response.metadata = { ...metadata, ...response.metadata };
          return response;
        } catch (e) {
          if (e instanceof Response)
            e.metadata = { ...metadata, ...e.metadata };
          throw e;
        }
      }) as ShinkaOnRequestHandlerBase<TA, B, R>)
    : cb;

export type HighOrderHook = (
  cb: ShinkaOnRequestHandlerBase<any, any, any>,
  metadata?: ShinkaOnRequestMeta<any, any>,
) => ShinkaOnRequestHandlerBase<any, any, any>;

export default {
  Function: highOrderHookSync,
  AsyncFunction: highOrderHookAsync,
} as Record<FnConstructorName, HighOrderHook>;
