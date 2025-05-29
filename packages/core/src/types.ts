import type { Context } from "./context";
import type { MessageType } from "./constants";
import type { CommonBus } from "./common";

export type REQID = number;
export type DataEventKey = string | number | boolean;
export type Request<B> = [REQID, B];
export type Response<B> = [boolean, REQID, B];
export type DataEvent<B> = [DataEventKey, B];
export type ProcessData<B> = [DataEventKey, B];
export type DataEventHandler<TA extends CommonBus, B> = (
  key: DataEventKey,
  data: B,
  thisArg: TA,
) => void;

export type RequestHandler<TA extends CommonBus, B> = (
  key: DataEventKey,
  body: B,
  context: Context<TA>,
) => void;

export type MessageRequestBase<T, B> = [T, Request<B>];
export type MessageRequest<B> = MessageRequestBase<
  MessageType.REQUEST_OUTER | MessageType.REQUEST_INNER,
  B
>;
export type MessageResponseBase<T, B> = [T, Response<B>];
export type MessageResponse<B> = MessageResponseBase<
  MessageType.RESPONSE_OUTER | MessageType.RESPONSE_INNER,
  B
>;

export type MessageEventBase<T, B> = [T, DataEvent<B>];
export type MessageEvent<B> = MessageEventBase<
  MessageType.EVENT_OUTER | MessageType.EVENT_INNER,
  B
>;

export type Message<B> =
  | MessageRequest<B>
  | MessageResponse<B>
  | MessageEvent<B>;

export type GenericSerializer<I, O> = {
  serialize: (data: I) => O;
  deserialize: (data: O) => I;
};

export type Serializer = GenericSerializer<Message<any>, any>;

export type StrictRegistry<C> = {
  register: (target: C) => void;
  unregister: (target: C) => void;
};

export type Registry<C> = {
  register?: (target: C) => void;
  unregister?: (target: C) => void;
};

export type FactoryData = {
  send: (data: any) => void;
  close: () => Promise<void>;
};

export type SerializedData = string | Uint8Array;
export type OnMessageSerialized = (data: SerializedData) => void;

export type FactoryClient<B> = (bus: B) => Promise<FactoryData>;

export type CompleteFN = (bus: CommonBus) => void;

export type RejectResolve = [(reason?: any) => void, (value: any) => void];
