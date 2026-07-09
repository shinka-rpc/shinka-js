import { reqrsp } from "./factory/request-response";

import {
  createDispatchRequest,
  createEventRegistry,
  createReqRegistry,
  asOnRequest,
} from "./factory/registry";

import type { DispatchMap, Shinka, ShinkaOn } from "./types";
import type { MessageTypeGroup } from "./factory/message-type";

export const createHandlerRegistries = <SO, TO, TA>() => {
  const [reqGet, reqSet] = createReqRegistry<SO, TO, TA, any, any>();
  const [evGet, onDataEvent] = createEventRegistry<TA, any>();
  const onRequest = asOnRequest(reqSet);
  const dispatchRequest = createDispatchRequest(reqGet);
  return Object.freeze({
    evGet,
    dispatchRequest,
    onRequest,
    onDataEvent,
  });
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
  const [REQUEST, RESPONSE_OK, RESPONSE_ERR, EVENT] = messageTypeGroup;

  const [
    setVars,
    request,
    onSuccess,
    onError,
    onMessageRequest,
    dispatchDataEvent,
    dataEvent,
  ] = reqrsp(
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
    setVars,
    Object.freeze({
      onRequest,
      request,
      onDataEvent,
      dataEvent,
    }),
  ] as [typeof setVars, Shinka<SO, TO, TA>];
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
  <SO, TO, TA>(dispatchMap: DispatchMap, responseTimeout: number) =>
  (
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
    ReturnType<typeof fn>,
  ];
};
