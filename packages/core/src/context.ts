import { MessageType } from "./constants";

import type { Message, Response, MessageResponse } from "./types";
import type { CommonBus } from "./common";

/**
 * Context class represents the context of a request being handled.
 * It provides methods to send responses back to the requester and manages request timeouts.
 *
 * @template B - The type of bus this context is associated with
 * @class Context
 */
export class Context<B extends CommonBus> {
  #reqID!: number;
  bus!: B;
  #sendMessage!: (message: Message<any>) => void;
  #answerGeneric!: (code: boolean, data: any) => void;
  #timeoutId!: NodeJS.Timeout | null;

  /**
   * Creates a new instance of Context.
   *
   * @param reqID - The unique identifier for this request
   * @param bus - The bus instance associated with this context
   * @param sendMessage - Function to send messages through the bus
   * @param timeout - Timeout duration in milliseconds (0 for no timeout)
   */
  constructor(
    reqID: number,
    bus: B,
    sendMessage: (message: any) => void,
    timeout: number,
  ) {
    this.#reqID = reqID;
    this.bus = bus;
    this.#sendMessage = sendMessage;
    this.#answerGeneric = this.#answerGenericOK;
    if (timeout) this.#timeoutId = setTimeout(this.close, timeout);
  }

  /**
   * Internal method to handle successful response sending.
   * Clears the timeout and sends the response message.
   * @private
   * @param code - Response status code (true for success)
   * @param data - Response data to send
   */
  #answerGenericOK(code: boolean, data: any) {
    if (this.#timeoutId !== null) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
    }
    const response: Response<any> = [code, this.#reqID, data];
    const message: MessageResponse<any> = [
      MessageType.RESPONSE_OUTER,
      response,
    ];
    this.#sendMessage(message);
    this.#answerGeneric = this.#answerGenericERR;
  }

  /**
   * Internal method to handle error cases when trying to send multiple responses.
   * @private
   * @param code - Response status code
   * @param data - Response data
   * @throws Error if attempting to send multiple responses
   */
  #answerGenericERR(code: boolean, data: any) {
    throw new Error(
      JSON.stringify({ msg: "Already answered", reqID: this.#reqID }),
    );
  }

  /**
   * Sends a successful response back to the requester.
   *
   * @param data - The response data to send
   * @throws Error if attempting to send multiple responses
   */
  answer(data: any) {
    this.#answerGeneric(true, data);
  }

  /**
   * Sends an error response back to the requester.
   * If the error is an Error instance, it will be logged with a stack trace.
   *
   * @param data - The error data to send
   * @throws Error if attempting to send multiple responses
   */
  error(data: any) {
    if (data instanceof Error) console.trace(data);
    this.#answerGeneric(false, data);
  }

  /**
   * Closes the request context and sends a default error response if not already answered.
   * This is called automatically when the request timeout is reached.
   *
   * @param msg - Optional error message (defaults to "CLOSED")
   */
  close = (msg: any = "CLOSED") => {
    // FIXME
    if (this.#answerGeneric === this.#answerGenericOK) this.error(msg);
  };
}
