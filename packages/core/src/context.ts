import type { Message, MessageResponse, ShinkaMeta } from "./types";
import type { MessageTypeAllResponse } from "./constants";

export class Context<SO, TO> {
  #reqID!: number;
  #messageTypes!: [MessageTypeAllResponse, MessageTypeAllResponse];
  #sendMessage!: (message: Message<any>, opts?: any) => void;

  #answerGeneric!: (
    messageType: MessageTypeAllResponse,
    data: any,
    metadata?: ShinkaMeta<SO, TO>,
  ) => void;

  constructor(
    reqID: number,
    sendMessage: (message: any) => void,
    messageTypes: [MessageTypeAllResponse, MessageTypeAllResponse],
  ) {
    this.#reqID = reqID;
    this.#sendMessage = sendMessage;
    this.#answerGeneric = this.#answerGenericOK;
    this.#messageTypes = messageTypes;
  }

  #answerGenericOK(
    messageType: MessageTypeAllResponse,
    data: any,
    metadata?: ShinkaMeta<SO, TO>,
  ) {
    const message: MessageResponse<any> = [messageType, this.#reqID, data];
    this.#sendMessage(message, metadata);
    this.#answerGeneric = this.#answerGenericERR;
  }

  #answerGenericERR(
    messageType: MessageTypeAllResponse,
    data: any,
    metadata?: ShinkaMeta<SO, TO>,
  ) {
    throw { message: "Already answered", reqID: this.#reqID };
  }

  answer(data: any, metadata?: ShinkaMeta<SO, TO>) {
    this.#answerGeneric(this.#messageTypes[1], data, metadata);
  }

  error(data: any, metadata?: ShinkaMeta<SO, TO>) {
    if (data instanceof Error) console.trace(data);
    this.#answerGeneric(this.#messageTypes[0], data, metadata);
  }
}
