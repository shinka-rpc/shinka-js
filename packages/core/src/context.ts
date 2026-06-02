import type { Message, MessageResponse, ShinkaMeta } from "./types";
import type { MessageTypeAllResponse } from "./constants";

export class Context<SO, TO, TA> {
  private reqID!: number;
  private messageTypes!: [MessageTypeAllResponse, MessageTypeAllResponse];
  private sendMessage!: (message: Message<any>, opts?: any) => void;
  public thisArg!: TA;
  //
  private answerGeneric!: (
    messageType: MessageTypeAllResponse,
    data: any,
    metadata?: ShinkaMeta<SO, TO>,
  ) => void;
  private timeoutId!: ReturnType<typeof setTimeout> | null;

  constructor(
    reqID: number,
    sendMessage: (message: any) => void,
    thisArg: TA,
    timeout: number,
    messageTypes: [MessageTypeAllResponse, MessageTypeAllResponse],
  ) {
    this.reqID = reqID;
    this.sendMessage = sendMessage;
    this.thisArg = thisArg;
    this.answerGeneric = this.answerGenericOK;
    this.messageTypes = messageTypes;
    if (timeout) this.timeoutId = setTimeout(this.close, timeout);
  }

  private answerGenericOK(
    messageType: MessageTypeAllResponse,
    data: any,
    metadata?: ShinkaMeta<SO, TO>,
  ) {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    const message: MessageResponse<any> = [messageType, this.reqID, data];
    this.sendMessage(message, metadata);
    this.answerGeneric = this.answerGenericERR;
  }

  private answerGenericERR(
    messageType: MessageTypeAllResponse,
    data: any,
    metadata?: ShinkaMeta<SO, TO>,
  ) {
    throw new Error(
      JSON.stringify({ msg: "Already answered", reqID: this.reqID }),
    );
  }

  answer(data: any, metadata?: ShinkaMeta<SO, TO>) {
    this.answerGeneric(this.messageTypes[1], data, metadata);
  }

  error(data: any, metadata?: ShinkaMeta<SO, TO>) {
    if (data instanceof Error) console.trace(data);
    this.answerGeneric(this.messageTypes[0], data, metadata);
  }

  close = (msg: any = "CLOSED", metadata?: ShinkaMeta<SO, TO>) => {
    // FIXME
    if (this.answerGeneric === this.answerGenericOK) this.error(msg, metadata);
  };
}
