import { reqrsp } from "./factory/request-response";

import {
  createDispatchDataEvent,
  createDispatchRequest,
  createEventRegistry,
  createReqRegistry,
  asOnRequest,
} from "./factory/registry";

import type {
  MessageDataEvent,
  ShinkaMeta,
  DispatchMap,
  SendFn,
  DataEventKey,
  Shinka,
  ShinkaOn,
} from "./types";
import type { Bus } from "./bus";
import type { MessageTypeAllEvent, MessageTypeGroup } from "./constants";

const createEventSend =
  <SO, TO>(eventType: MessageTypeAllEvent, send: SendFn<SO, TO>) =>
  (key: DataEventKey, data: any, metadata?: ShinkaMeta<SO, TO>) => {
    const message: MessageDataEvent<any> = [eventType, data, key];
    send(message, metadata);
  };

export const createHandlerRegistries = <SO, TO, TA>() => {
  const [reqGet, reqSet] = createReqRegistry<SO, TO, TA, any, any>();
  const [evGet, onDataEvent] = createEventRegistry<TA, any>();
  const dispatchDataEvent = createDispatchDataEvent(evGet);
  const onRequest = asOnRequest(reqSet);
  const dispatchRequest = createDispatchRequest(reqGet);
  return Object.freeze({
    dispatchRequest,
    onRequest,
    dispatchDataEvent,
    onDataEvent,
  });
};

export type HandlerRegistries<SO, TO, TA> = ReturnType<
  typeof createHandlerRegistries<SO, TO, TA>
>;

export const complteShinka = <SO, TO, TA>(
  send: SendFn<SO, TO>,
  messageTypeGroup: MessageTypeGroup,
  dispatchMap: DispatchMap<TA>,
  responseTimeout: number,
  {
    dispatchRequest,
    onRequest,
    dispatchDataEvent,
    onDataEvent,
  }: HandlerRegistries<SO, TO, TA>,
) => {
  const [REQUEST, RESPONSE_OK, RESPONSE_ERR, EVENT] = messageTypeGroup;
  const [request, onResponseOK, onResponseERR, onMessageRequest] = reqrsp(
    REQUEST,
    [RESPONSE_ERR, RESPONSE_OK],
    send,
    dispatchRequest,
    responseTimeout,
  );
  const dataEvent = createEventSend(EVENT, send);

  dispatchMap.set(REQUEST, onMessageRequest);
  dispatchMap.set(RESPONSE_OK, onResponseOK);
  dispatchMap.set(RESPONSE_ERR, onResponseERR);
  dispatchMap.set(EVENT, dispatchDataEvent);

  return Object.freeze({
    onRequest,
    request,
    onDataEvent,
    dataEvent,
  }) as Shinka<SO, TO, TA>;
};

export const createOrCompleteShinka = <SO, TO, TA>(
  send: SendFn<SO, TO>,
  dispatchMap: DispatchMap<TA>,
  responseTimeout: number,
  messageTypeGroup: MessageTypeGroup,
  maybeHandlerRegistries?: HandlerRegistries<SO, TO, TA>,
) =>
  complteShinka(
    send,
    messageTypeGroup,
    dispatchMap,
    responseTimeout,
    maybeHandlerRegistries || createHandlerRegistries<SO, TO, TA>(),
  );

export const makeCreateOrCompleteShinka =
  <SO, TO, TA>(
    send: SendFn<SO, TO>,
    dispatchMap: DispatchMap<TA>,
    responseTimeout: number,
  ) =>
  (
    messageTypeGroup: MessageTypeGroup,
    maybeHandlerRegistries?: HandlerRegistries<SO, TO, TA>,
  ) =>
    createOrCompleteShinka<SO, TO, TA>(
      send,
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
    typeof registries,
    ReturnType<typeof fn>,
  ];
};
