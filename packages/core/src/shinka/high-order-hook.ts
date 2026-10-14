import { Response } from "./response";
import type { ShinkaMeta } from "./types";

const highOrderHookSync = <SO, TO, TA, B, R>(
  cb: (body: B, thisArg: TA) => R | Response<SO, TO, R>,
  metadata?: ShinkaMeta<SO, TO>,
) =>
  metadata
    ? (body: B, thisArg: TA) => {
        try {
          const response = cb(body, thisArg);
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
  cb: (body: B, thisArg: TA) => R,
  metadata?: ShinkaMeta<SO, TO>,
) =>
  metadata
    ? async (body: B, thisArg: TA) => {
        try {
          const response = await cb(body, thisArg);
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

export default {
  Function: highOrderHookSync,
  AsyncFunction: highOrderHookAsync,
};
