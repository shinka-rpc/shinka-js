import { MessageType } from "./constants";

import type {
  Message,
  ResponseType,
  MessageResponse,
  ShinkaMeta,
} from "./types";
import type { CommonBus } from "./common";

export class Context<B extends CommonBus> {
  #reqID!: number;
  bus!: B;
  #sendMessage!: (message: Message<any>, opts?: any) => void;
  //
  #answerGeneric!: (code: boolean, data: any, metadata?: ShinkaMeta) => void;
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

  #answerGenericOK(code: boolean, data: any, metadata?: ShinkaMeta) {
    if (this.#timeoutId !== null) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
    }
    const response: ResponseType<any> = [code, this.#reqID, data];
    const message: MessageResponse<any> = [
      MessageType.RESPONSE_OUTER,
      response,
    ];
    this.#sendMessage(message, metadata);
    this.#answerGeneric = this.#answerGenericERR;
  }

  #answerGenericERR(code: boolean, data: any, metadata?: ShinkaMeta) {
    throw new Error(
      JSON.stringify({ msg: "Already answered", reqID: this.#reqID }),
    );
  }

  answer(data: any, metadata?: ShinkaMeta) {
    this.#answerGeneric(true, data, metadata);
  }

  error(data: any, metadata?: ShinkaMeta) {
    if (data instanceof Error) console.trace(data);
    this.#answerGeneric(false, data, metadata);
  }

  close = (msg: any = "CLOSED", metadata?: ShinkaMeta) => {
    // FIXME
    if (this.#answerGeneric === this.#answerGenericOK)
      this.error(msg, metadata);
  };
}
