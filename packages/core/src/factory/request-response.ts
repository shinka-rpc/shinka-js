import { sequence } from "@shinka-rpc/util";
import { MessageType } from "../constants";
import { Context } from "../context";
import { CommonBus } from "../common";
import type {
  REQID,
  RejectResolve,
  Request,
  DataEventKey,
  MessageRequest,
  Message,
  ResponseType,
  ProcessData,
  RequestHandler,
  ShinkaMeta,
} from "../types";

type SendMSG = (message: Message<any>, metadata?: ShinkaMeta) => void;
type AllowedMessageType = MessageType.REQUEST_INNER | MessageType.REQUEST_OUTER;

export const reqrsp = <B extends CommonBus>(
  thisArg: B,
  message_type: AllowedMessageType,
  send: SendMSG,
  onRequest: RequestHandler<B, any>,
  timeout: number,
) => {
  const pending = new Map<REQID, RejectResolve>();
  const seq = sequence() as () => REQID;

  const request = <T>(key: DataEventKey, data: any, metadata?: ShinkaMeta) => {
    const reqID = seq();
    const request: Request<any> = [reqID, [key, data]];
    const message: MessageRequest<any> = [message_type, request];
    send(message, metadata);
    return new Promise<T>((resolve, reject) =>
      pending.set(reqID, [reject, resolve]),
    );
  };

  const onResponse = (response: ResponseType<any>) => {
    const [OK, reqID, body] = response;
    const callbacks = pending.get(reqID);

    if (callbacks === undefined) {
      return console.error({
        message: "No response handler found",
        reqID,
      });
    }

    pending.delete(reqID);
    const callback = callbacks[+OK];
    callback(body);
  };

  const onMessageRequest = (request: Request<any>) => {
    const [reqID, body] = request;
    const [key, data] = body as ProcessData<any>;
    const ctx = new Context(reqID, thisArg, send, timeout);
    onRequest(key, data, ctx);
  };

  return [request, onResponse, onMessageRequest] as [
    typeof request,
    typeof onResponse,
    typeof onMessageRequest,
  ];
};
