import { sequence } from "@shinka-rpc/util";
import { Context } from "./context";

import type {
  REQID,
  RejectResolve,
  DataEventKey,
  MessageRequest,
  MessageDataEvent,
  MessageResponse,
  RequestHandler,
  ShinkaMeta,
  DispatchError,
  ShinkaVars,
} from "../types";
import type {
  MessageTypeAllRequest,
  MessageTypeAllError,
  MessageTypeAllSuccess,
  MessageTypeAllEvent,
} from "./message-type";

type PendingMap = Map<REQID, RejectResolve>;
type TimeoutMap = Map<REQID, ReturnType<typeof setTimeout>>;

const createOnResponse =
  <TA>(
    pending: PendingMap,
    timeouts: TimeoutMap,
    OK: 0 | 1,
    vars: { thisArg: TA; dispatchError: DispatchError },
  ) =>
  (message: MessageResponse<any>) => {
    const [_, reqID, body] = message;
    const callbacks = pending.get(reqID);

    if (callbacks === undefined)
      return vars.dispatchError({
        message: "No response handler found",
        reqID,
      });

    clearTimeout(timeouts.get(reqID));
    pending.delete(reqID);
    timeouts.delete(reqID);

    const callback = callbacks[OK];
    callback(body);
  };

type MaybeEventHandler<TA> =
  | ((body: any, thisArg: TA, dispatchError: DispatchError) => void)
  | undefined;

export const reqrsp = <SO, TO, TA>(
  requestType: MessageTypeAllRequest,
  eventType: MessageTypeAllEvent,
  responseTypes: [MessageTypeAllError, MessageTypeAllSuccess],
  onRequest: RequestHandler<SO, TO, TA, any>,
  getDataEvent: (key: DataEventKey) => MaybeEventHandler<TA>,
  timeout: number,
) => {
  const pending: PendingMap = new Map();
  const timeouts: TimeoutMap = new Map();

  const vars: Partial<ShinkaVars<SO, TO, TA>> = {};

  const setVars = (newVars: Partial<ShinkaVars<SO, TO, TA>>) =>
    Object.assign(vars, newVars);

  const seq = sequence() as () => REQID;

  const onSuccess = createOnResponse(pending, timeouts, 1, vars as any);
  const onError = createOnResponse(pending, timeouts, 0, vars as any);

  const onTimeout = (reqID: REQID) => {
    const message: MessageResponse<any> = [
      1, // any ResponseType. Used by `Bus.dispatch`, but doesn't matter here
      reqID,
      { message: "Request timeout", reqID },
    ];
    onError(message);
  };

  const request = <T>(
    key: DataEventKey,
    data: any,
    metadata?: ShinkaMeta<SO, TO>,
  ) => {
    const reqID = seq();
    const message: MessageRequest<any> = [requestType, reqID, key, data];
    vars.send!(message, metadata);
    return new Promise<T>((resolve, reject) => {
      pending.set(reqID, [reject, resolve]);
      timeouts.set(reqID, setTimeout(onTimeout, timeout, reqID));
    });
  };

  const onMessageRequest = (message: MessageRequest<any>) => {
    const [_, reqID, key, data] = message;
    const ctx = new Context(reqID, vars.send!, responseTypes);
    onRequest(key, data, ctx, vars.thisArg!, vars.dispatchError!);
  };

  const dispatchEvent = (message: MessageDataEvent<any>) => {
    const [_, body, key] = message;
    const cb = getDataEvent(key);
    if (!cb) return vars.dispatchError!({ type: "no event handler", key });
    cb(body, vars.thisArg!, vars.dispatchError!);
  };

  const eventSend = (
    key: DataEventKey,
    data: any,
    metadata?: ShinkaMeta<SO, TO>,
  ) => {
    const message: MessageDataEvent<any> = [eventType, data, key];
    vars.send!(message, metadata);
  };

  return [
    setVars,
    request,
    onSuccess,
    onError,
    onMessageRequest,
    dispatchEvent,
    eventSend,
  ] as [
    typeof setVars,
    typeof request,
    typeof onSuccess,
    typeof onError,
    typeof onMessageRequest,
    typeof dispatchEvent,
    typeof eventSend,
  ];
};
