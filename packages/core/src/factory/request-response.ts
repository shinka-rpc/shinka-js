import { sequence } from "@shinka-rpc/util";
import { Context } from "../context";

import type {
  REQID,
  RejectResolve,
  DataEventKey,
  MessageRequest,
  SendFn,
  MessageResponse,
  RequestHandler,
  ShinkaMeta,
  DispatchError,
} from "../types";
import type {
  MessageTypeAllRequest,
  MessageTypeAllResponseERR,
  MessageTypeAllResponseOK,
} from "../constants";

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

export const reqrsp = <SO, TO, TA>(
  requestType: MessageTypeAllRequest,
  responseTypes: [MessageTypeAllResponseERR, MessageTypeAllResponseOK],
  send: SendFn<SO, TO>,
  onRequest: RequestHandler<SO, TO, TA, any>,
  timeout: number,
) => {
  const pending: PendingMap = new Map();
  const timeouts: TimeoutMap = new Map();

  const vars: Partial<{ thisArg: TA; dispatchError: DispatchError }> = {};

  const setVars = (thisArg: TA, dispatchError: DispatchError) => {
    vars.thisArg = thisArg;
    vars.dispatchError = dispatchError;
  };

  const seq = sequence() as () => REQID;

  const onResponseOK = createOnResponse(pending, timeouts, 1, vars as any);
  const onResponseERR = createOnResponse(pending, timeouts, 0, vars as any);

  const onTimeout = (reqID: REQID) => {
    const message: MessageResponse<any> = [
      1, // any ResponseType. Used by `Bus.dispatch`, but doesn't matter here
      reqID,
      { message: "Request timeout", reqID },
    ];
    onResponseERR(message);
  };

  const request = <T>(
    key: DataEventKey,
    data: any,
    metadata?: ShinkaMeta<SO, TO>,
  ) => {
    const reqID = seq();
    const message: MessageRequest<any> = [requestType, reqID, key, data];
    send(message, metadata);
    return new Promise<T>((resolve, reject) => {
      pending.set(reqID, [reject, resolve]);
      timeouts.set(reqID, setTimeout(onTimeout, timeout, reqID));
    });
  };

  const onMessageRequest = (message: MessageRequest<any>) => {
    const [_, reqID, key, data] = message;
    const ctx = new Context(reqID, send, responseTypes);
    onRequest(key, data, ctx, vars.thisArg!, vars.dispatchError!);
  };

  return [setVars, request, onResponseOK, onResponseERR, onMessageRequest] as [
    typeof setVars,
    typeof request,
    typeof onResponseOK,
    typeof onResponseERR,
    typeof onMessageRequest,
  ];
};
