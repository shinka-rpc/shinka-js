import type {
  Message,
  MessageResponse,
  ShinkaMeta,
  REQID,
  MapPop,
  ReqRspLocalEntry,
} from "./types";
import type { MessageTypeAllResponse } from "./message-type";

type AnswerCb<SO, TO> = (data: any, metadata?: ShinkaMeta<SO, TO>) => void;

export class Context<SO, TO> {
  #reqID: REQID;
  #sendMessage: (message: Message<any>, opts?: any) => void;
  #mapPop: MapPop<REQID, ReqRspLocalEntry>;

  #answerGeneric: (
    messageType: MessageTypeAllResponse,
    data: any,
    metadata?: ShinkaMeta<SO, TO>,
  ) => void;

  answer: AnswerCb<SO, TO>;
  error: AnswerCb<SO, TO>;

  constructor(
    reqID: REQID,
    sendMessage: (message: any) => void,
    {
      0: responseErr,
      1: responseOK,
    }: [MessageTypeAllResponse, MessageTypeAllResponse],
    mapPop: MapPop<REQID, any>,
  ) {
    this.#reqID = reqID;
    this.#sendMessage = sendMessage;
    this.#answerGeneric = this.#answerGenericOK;
    this.#mapPop = mapPop;
    this.answer = this.#baseAnswer.bind(this, responseOK);
    this.error = this.#baseAnswer.bind(this, responseErr);
  }

  #answerGenericOK(
    messageType: MessageTypeAllResponse,
    data: any,
    metadata?: ShinkaMeta<SO, TO>,
  ) {
    const message: MessageResponse<any> = [messageType, this.#reqID, data];
    this.#answerGeneric = this.#answerGenericERR;
    this.#cleanup();
    this.#sendMessage(message, metadata);
  }

  #answerGenericERR(
    messageType: MessageTypeAllResponse,
    data: any,
    metadata?: ShinkaMeta<SO, TO>,
  ) {
    throw { message: "Already answered", reqID: this.#reqID };
  }

  #answerGenericVOID() {}

  #baseAnswer(
    messageType: MessageTypeAllResponse,
    data: any,
    metadata?: ShinkaMeta<SO, TO>,
  ) {
    // `this.#answerGeneric` is overridable. This is why this function exists
    this.#answerGeneric(messageType, data, metadata);
  }

  #cleanup() {
    const localEntry = this.#mapPop(this.#reqID);
    if (localEntry) {
      const { 1: localTimeoutId } = localEntry;
      clearTimeout(localTimeoutId);
    }
  }

  abort = () => {
    this.#answerGeneric = this.#answerGenericVOID;
    this.#cleanup();
  };
}
