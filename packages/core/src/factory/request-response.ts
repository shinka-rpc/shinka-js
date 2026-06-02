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
} from "../types";
import type {
  MessageTypeAllRequest,
  MessageTypeAllResponseERR,
  MessageTypeAllResponseOK,
} from "../constants";

const createOnResponse =
  <TA>(pending: Map<REQID, RejectResolve>, OK: 0 | 1) =>
  (message: MessageResponse<any>, thisArg: TA) => {
    const [_, reqID, body] = message;
    const callbacks = pending.get(reqID);

    if (callbacks === undefined) {
      return console.error({
        message: "No response handler found",
        reqID,
      });
    }

    pending.delete(reqID);
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
  const pending = new Map<REQID, RejectResolve>();
  const seq = sequence() as () => REQID;

  const request = <T>(
    key: DataEventKey,
    data: any,
    metadata?: ShinkaMeta<SO, TO>,
  ) => {
    const reqID = seq();
    const message: MessageRequest<any> = [requestType, reqID, key, data];
    send(message, metadata);
    return new Promise<T>((resolve, reject) =>
      pending.set(reqID, [reject, resolve]),
    );
  };

  const onResponseOK = createOnResponse<TA>(pending, 1);
  const onResponseERR = createOnResponse<TA>(pending, 0);

  const onMessageRequest = (message: MessageRequest<any>, thisArg: TA) => {
    const [_, reqID, key, data] = message;
    const ctx = new Context(reqID, send, thisArg, timeout, responseTypes);
    onRequest(key, data, ctx);
  };

  return [request, onResponseOK, onResponseERR, onMessageRequest] as [
    typeof request,
    typeof onResponseOK,
    typeof onResponseERR,
    typeof onMessageRequest,
  ];
};
