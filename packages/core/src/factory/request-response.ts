import { sequence } from "@shinka-rpc/util/sequence";
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
  Response,
  ProcessData,
  RequestHandler,
} from "../types";

type SendMSG = (message: Message<any>) => void;
type AllowedMessageType = MessageType.REQUEST_INNER | MessageType.REQUEST_OUTER;

/**
 * Creates a request-response communication system for a bus instance.
 * This factory function sets up the necessary infrastructure for handling
 * request-response patterns in the bus communication system.
 *
 * @template B - The type of the bus instance extending CommonBus
 * @param thisArg - The bus instance to bind the request-response system to
 * @param message_type - The type of message to use (REQUEST_INNER or REQUEST_OUTER)
 * @param send - Function to send messages through the bus
 * @param onRequest - Handler function for incoming requests
 * @param timeout - Timeout duration for requests in milliseconds
 *
 * @returns A tuple containing:
 *  - request: Function to send requests and get responses
 *  - onResponse: Function to handle incoming responses
 *  - onMessageRequest: Function to handle incoming requests
 *
 * @example
 * ```typescript
 * const [request, onResponse, onMessageRequest] = reqrsp(
 *   bus,
 *   MessageType.REQUEST_INNER,
 *   sendMessage,
 *   handleRequest,
 *   5000
 * );
 *
 * // Send a request
 * const response = await request("myEvent", { data: "value" });
 * ```
 */
export const reqrsp = <B extends CommonBus>(
  thisArg: B,
  message_type: AllowedMessageType,
  send: SendMSG,
  onRequest: RequestHandler<B, any>,
  timeout: number,
) => {
  const pending = new Map<REQID, RejectResolve>();
  const seq = sequence() as () => REQID;

  /**
   * Sends a request and returns a promise that resolves with the response.
   *
   * @template T - The expected response type
   * @param key - The event key to send the request to
   * @param data - The data to send with the request
   * @returns A promise that resolves with the response of type T
   */
  const request = <T>(key: DataEventKey, data: any) => {
    const reqID = seq();
    const request: Request<any> = [reqID, [key, data]];
    const message: MessageRequest<any> = [message_type, request];
    send(message);
    return new Promise<T>((resolve, reject) =>
      pending.set(reqID, [reject, resolve]),
    );
  };

  /**
   * Handles incoming responses by resolving or rejecting the corresponding request promise.
   *
   * @param response - The response message containing status, request ID, and response body
   */
  const onResponse = (response: Response<any>) => {
    const [OK, reqID, body] = response;
    const callbacks = pending.get(reqID);

    if (callbacks === undefined) {
      return console.error({
        message: "No response handler found",
        reqID,
      });
    }

    const callback = callbacks[+OK];
    callback(body);
  };

  /**
   * Handles incoming requests by creating a new context and passing it to the request handler.
   *
   * @param request - The request message containing request ID and request body
   */
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
