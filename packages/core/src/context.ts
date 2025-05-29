import { MessageType } from "./constants";

import type { Message, Response, MessageResponse } from "./types";
import type { CommonBus } from "./common";

export class Context<B extends CommonBus> {
  #reqID!: number;
  bus!: B;
  #sendMessage!: (message: Message<any>) => void;
  #answerGeneric!: (code: boolean, data: any) => void;
  #timeoutId!: NodeJS.Timeout | null;

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

  #answerGenericERR(code: boolean, data: any) {
    throw new Error(
      JSON.stringify({ msg: "Already answered", reqID: this.#reqID }),
    );
  }

  answer(data: any) {
    this.#answerGeneric(true, data);
  }

  error(data: any) {
    if (data instanceof Error) console.trace(data);
    this.#answerGeneric(false, data);
  }

  close = (msg: any = "CLOSED") => {
    // FIXME
    if (this.#answerGeneric === this.#answerGenericOK) this.error(msg);
  };
}
