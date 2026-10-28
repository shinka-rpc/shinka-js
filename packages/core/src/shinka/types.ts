import type { AbortFn } from "../types";
import type { Context } from "./context";
import type {
  MessageType,
  MessageTypeAllRequest,
  MessageTypeAllResponse,
  MessageTypeAllEvent,
} from "./message-type";

export type FnConstructorName = "Function" | "AsyncFunction";
export type MapPop<K, V> = (key: K) => V | undefined;

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

export type MetaTypeHint = {
  hint?: FnConstructorName;
};

export type MetaAbort = {
  signal?: AbortSignal;
};

export type MetaTimeout = {
  timeout?: number;
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
  abort: AbortFn;
};

export type ShinkaVarsSetter<SO, TO, TA> = (
  vars: Partial<ShinkaVars<SO, TO, TA>>,
) => void;

export type ShinkaOnRequestMeta<SO, TO> = ShinkaMeta<SO, TO> &
  MetaTypeHint &
  MetaTimeout;

export type TaskCTL = {
  signal: AbortSignal;
};

export type ShinkaOnRequestHandlerBase<TA, B, R> = (
  data: B,
  thisArg: TA,
  taskCtl: TaskCTL,
) => R;

export type ShinkaOnRequestHandler<TA> = ShinkaOnRequestHandlerBase<
  TA,
  any,
  any
>;

export type ShinkaOnRequest<SO, TO, TA> = (
  key: DataEventKey,
  cb: ShinkaOnRequestHandler<TA>,
  metadataWithHint?: ShinkaOnRequestMeta<SO, TO>,
) => void;

export type ShinkaDoRequestMeta<SO, TO> = ShinkaMeta<SO, TO> &
  MetaAbort &
  MetaTimeout;

export type ShinkaDoRequest<SO, TO> = <T>(
  key: DataEventKey,
  data: any,
  metadata?: ShinkaDoRequestMeta<SO, TO>,
) => Promise<T>;

export type ShinkaOnDataEventHandler<TA> = (
  data: any,
  thisArg: TA,
  metadata?: ShinkaOnDataEventMeta,
) => void;

export type ShinkaOnDataEventMeta = MetaTypeHint;

export type ShinkaOnDataEvent<TA> = (
  key: DataEventKey,
  val: ShinkaOnDataEventHandler<TA>,
  metadata?: ShinkaOnDataEventMeta,
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

export type DisposeTimeout = (n: number | undefined) => () => void;

export type RequestHandler<SO, TO, TA, B> = (
  key: DataEventKey,
  body: B,
  context: Context<SO, TO>,
  thisArg: TA,
  dispatchError: DispatchError,
  signal: AbortSignal,
  dTimeout: DisposeTimeout,
) => void;

export type RequestHandlerFn<SO, TO, TA, B> = (
  body: B,
  context: Context<SO, TO>,
  thisArg: TA,
  signal: AbortSignal,
) => void;

export type ReqRegEntry<SO, TO, TA, B, R> = [
  ShinkaOnRequestHandlerBase<TA, B, R>,
  ShinkaOnRequestMeta<SO, TO> | undefined,
];

export type EvRegEntryCb<TA, B, R> = (
  cb: (body: B, thisArg: TA) => R,
) => (body: B, thisArg: TA, dispatchError: DispatchError) => R;

export type EvRegEntry<TA> = [
  ShinkaOnDataEventHandler<TA>,
  ShinkaOnDataEventMeta | undefined,
];

export type ReqHandler<SO, TO, TA> = (
  body: any,
  ctx: Context<SO, TO>,
  thisArg: TA,
  signal: AbortSignal,
  dTimeout: DisposeTimeout,
) => any;
export type MaybeReqHandler<SO, TO, TA> = ReqHandler<SO, TO, TA> | undefined;

export type EventHandler<TA, B, R> = (
  body: B,
  thisArg: TA,
  dispatchError: DispatchError,
) => R;
export type MaybeEventHandler<TA, B, R> = EventHandler<TA, B, R> | undefined;

export type ReqRspOnAbort = () => void;
export type ReqRspRemoteEntryAbort = [AbortSignal, ReqRspOnAbort];
export type ReqRspRemoteEntry = [
  RejectResolve,
  ReturnType<typeof setTimeout>,
  ReqRspRemoteEntryAbort | undefined,
];
export type ReqRspRemoteMap = Map<REQID, ReqRspRemoteEntry>;
export type ReqRspLocalEntry = [AbortController, ReturnType<typeof setTimeout>];
export type ReqRspLocalMap = Map<REQID, ReqRspLocalEntry>;
