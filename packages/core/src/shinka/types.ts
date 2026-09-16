import type { Context } from "./context";
import type {
  MessageType,
  MessageTypeAllRequest,
  MessageTypeAllResponse,
  MessageTypeAllEvent,
} from "./message-type";

export type FnConstructorName = "Function" | "AsyncFunction";

export type REQID = number;
export type DataEventKey = string | number | boolean;
export type Request<B> = [REQID, DataEventKey, B];
export type ResponseType<B> = [REQID, B];
export type DataEvent<B> = [B, DataEventKey];

export type MessageRequestBase<M extends MessageType, B> = [M, ...Request<B>];

export type MessageRequest<B> = MessageRequestBase<MessageTypeAllRequest, B>;
export type MessageResponseBase<M extends MessageType, B> = [
  M,
  ...ResponseType<B>,
];

export type MessageResponse<B> = MessageResponseBase<MessageTypeAllResponse, B>;

export type MessageDataEventBase<M extends MessageType, B> = [
  M,
  ...DataEvent<B>,
];

export type MessageDataEvent<B> = MessageDataEventBase<MessageTypeAllEvent, B>;

export type Message<B> =
  | MessageRequest<B>
  | MessageResponse<B>
  | MessageDataEvent<B>;

export type MessageDispatchHandler<M> = (message: M) => void;

export type DispatchMap = Map<
  MessageType,
  | MessageDispatchHandler<MessageRequest<any>>
  | MessageDispatchHandler<MessageResponse<any>>
  | MessageDispatchHandler<MessageDataEvent<any>>
>;

export type ShinkaMeta<SO, TO> = {
  transport?: TO;
  serialize?: SO;
};

export type SendFn<SO, TO> = (
  message: Message<any>,
  metadata?: ShinkaMeta<SO, TO>,
) => void;

export type DispatchError = (error: any) => void;

export type ShinkaVars<SO, TO, TA> = {
  thisArg: TA;
  send: SendFn<SO, TO>;
  dispatchError: DispatchError;
};

export type ShinkaVarsSetter<SO, TO, TA> = (
  vars: Partial<ShinkaVars<SO, TO, TA>>,
) => void;

export type MetadataWithHint<SO, TO> = ShinkaMeta<SO, TO> & {
  hint?: FnConstructorName;
};

export type ShinkaOnRequest<SO, TO, TA> = (
  key: DataEventKey,
  cb: (data: any, thisArg: TA) => any,
  metadataWithHint?: MetadataWithHint<SO, TO>,
) => void;

export type ShinkaDoRequest<SO, TO> = <T>(
  key: DataEventKey,
  data: any,
  metadata?: ShinkaMeta<SO, TO>,
) => Promise<T>;

export type ShinkaOnDataEvent<TA> = (
  key: DataEventKey,
  val: (data: any, thisArg: TA) => void,
) => void;

export type ShinkaDoDataEvent<SO, TO> = (
  event: DataEventKey,
  data: any,
  metadata?: ShinkaMeta<SO, TO>,
) => void;

export type ShinkaOn<SO, TO, TA> = {
  onRequest: ShinkaOnRequest<SO, TO, TA>;
  onDataEvent: ShinkaOnDataEvent<TA>;
};

export type ShinkaDo<SO, TO> = {
  request: ShinkaDoRequest<SO, TO>;
  dataEvent: ShinkaDoDataEvent<SO, TO>;
};

export type Shinka<SO, TO, TA> = ShinkaOn<SO, TO, TA> & ShinkaDo<SO, TO>;
export type RejectResolve = [(reason?: any) => void, (value: any) => void];
export type RequestHandler<SO, TO, TA, B> = (
  key: DataEventKey,
  body: B,
  context: Context<SO, TO>,
  thisArg: TA,
  dispatchError: DispatchError,
) => void;
