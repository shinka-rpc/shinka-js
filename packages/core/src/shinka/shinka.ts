import { reqrsp } from "./request-response";

import { createReqRegistry } from "./registry-request";
import { createEventRegistry } from "./registry-event";
import { createDispatchRequest, handlerRegistriesFactory } from "./util";
import type { MessageTypeGroup } from "./message-type";

import type { DispatchMap, Shinka, ShinkaOn } from "./types";
import { AbortFn } from "../types";

const { freeze: objectFreeze } = Object;

const handlerRegistriesBase = handlerRegistriesFactory(
  createReqRegistry,
  createEventRegistry,
);

export const createHandlerRegistries = <SO, TO, TA>() => {
  const {
    0: evGet,
    1: reqGet,
    2: onRequest,
    3: onDataEvent,
  } = handlerRegistriesBase<SO, TO, TA>();
  const dispatchRequest = createDispatchRequest<SO, TO, TA>(reqGet);
  return objectFreeze({
    evGet,
    dispatchRequest,
    onRequest,
    onDataEvent,
  }) satisfies ShinkaOn<SO, TO, TA>;
};

export type HandlerRegistries<SO, TO, TA> = ReturnType<
  typeof createHandlerRegistries<SO, TO, TA>
>;

export const completeShinka = <SO, TO, TA>(
  messageTypeGroup: MessageTypeGroup,
  dispatchMap: DispatchMap,
  responseTimeout: number,
  {
    evGet,
    onDataEvent,
    dispatchRequest,
    onRequest,
  }: HandlerRegistries<SO, TO, TA>,
) => {
  const {
    0: REQUEST,
    1: RESPONSE_OK,
    2: RESPONSE_ERR,
    3: EVENT,
  } = messageTypeGroup;

  const {
    0: onAbort,
    1: setVars,
    2: request,
    3: onSuccess,
    4: onError,
    5: onMessageRequest,
    6: dispatchDataEvent,
    7: dataEvent,
  } = reqrsp<SO, TO, TA, any>(
    REQUEST,
    EVENT,
    [RESPONSE_ERR, RESPONSE_OK],
    dispatchRequest,
    evGet,
    responseTimeout,
  );

  dispatchMap
    .set(REQUEST, onMessageRequest)
    .set(RESPONSE_OK, onSuccess)
    .set(RESPONSE_ERR, onError)
    .set(EVENT, dispatchDataEvent);

  return [
    onAbort,
    setVars,
    objectFreeze({
      onRequest,
      request,
      onDataEvent,
      dataEvent,
    }),
  ] as [AbortFn, typeof setVars, Shinka<SO, TO, TA>];
};

export const createOrCompleteShinka = <SO, TO, TA>(
  dispatchMap: DispatchMap,
  responseTimeout: number,
  messageTypeGroup: MessageTypeGroup,
  maybeHandlerRegistries?: HandlerRegistries<SO, TO, TA>,
) =>
  completeShinka(
    messageTypeGroup,
    dispatchMap,
    responseTimeout,
    maybeHandlerRegistries || createHandlerRegistries<SO, TO, TA>(),
  );

export const makeCreateOrCompleteShinka =
  (dispatchMap: DispatchMap, responseTimeout: number) =>
  <SO, TO, TA>(
    messageTypeGroup: MessageTypeGroup,
    maybeHandlerRegistries?: HandlerRegistries<SO, TO, TA>,
  ) =>
    createOrCompleteShinka<SO, TO, TA>(
      dispatchMap,
      responseTimeout,
      messageTypeGroup,
      maybeHandlerRegistries,
    );

export const setupHandlerRegistries = <SO, TO, TA, R>(
  fn: (shinkaOn: ShinkaOn<SO, TO, TA>) => R,
) => {
  const registries = createHandlerRegistries<SO, TO, TA>();
  const { onRequest, onDataEvent } = registries;
  return [registries, fn({ onRequest, onDataEvent })] as [
    HandlerRegistries<SO, TO, TA>,
    R,
  ];
};
