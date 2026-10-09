import { Response } from "./response";
import type { Context } from "./context";
import type { ShinkaMeta } from "./types";

const requestRegistryHookSync =
  <SO, TO, TA, B, R>(
    cb: (body: B, thisArg: TA) => R | Response<SO, TO, R>,
    metadata?: ShinkaMeta<SO, TO>,
  ) =>
  (body: B, ctx: Context<SO, TO>, thisArg: TA) => {
    try {
      const response = cb(body, thisArg);
      response instanceof Response
        ? ctx.answer(response.value, { ...metadata, ...response.metadata })
        : ctx.answer(response, metadata);
    } catch (e) {
      e instanceof Response
        ? ctx.error(e.value, { ...metadata, ...e.metadata })
        : ctx.error(e, metadata);
    }
  };

const requestRegistryHookAsync =
  <SO, TO, TA, B, R>(
    cb: (body: B, thisArg: TA) => R,
    metadata?: ShinkaMeta<SO, TO>,
  ) =>
  async (body: B, ctx: Context<SO, TO>, thisArg: TA) => {
    try {
      const response = await cb(body, thisArg);
      response instanceof Response
        ? ctx.answer(response.value, { ...metadata, ...response.metadata })
        : ctx.answer(response, metadata);
    } catch (e) {
      e instanceof Response
        ? ctx.error(e.value, { ...metadata, ...e.metadata })
        : ctx.error(e, metadata);
    }
  };

export default {
  Function: requestRegistryHookSync,
  AsyncFunction: requestRegistryHookAsync,
};
