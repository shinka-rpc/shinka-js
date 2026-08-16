import type { DisposeContext, AsyncDisposeContext } from "@shinka-rpc/util";
import type { OutScope } from "@shinka-rpc/outscope";
import type { Semaphore } from "@shinka-rpc/concurrency";

import type { Context } from "./factory/context";
import type {
  MessageType,
  MessageTypeAllRequest,
  MessageTypeAllResponse,
  MessageTypeAllEvent,
} from "./factory/message-type";
import type { HandlerRegistries } from "./shinka";
import type { NBAcquire } from "./bus/const-enums";

export type LastDataAt = {
  received: number;
  sent: number;
};

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

export type ShinkaVars<SO, TO, TA> = {
  thisArg: TA;
  send: SendFn<SO, TO>;
  dispatchError: DispatchError;
};

export type ShinkaVarsSetter<SO, TO, TA> = (
  vars: Partial<ShinkaVars<SO, TO, TA>>,
) => void;

export type ShinkaOnRequest<SO, TO, TA> = (
  key: DataEventKey,
  cb: (data: any, thisArg: TA) => any,
  metadataWithHint?: MetadataWithHint<SO, TO>,
) => void;

export type ShinkaRequest<SO, TO> = <T>(
  key: DataEventKey,
  data: any,
  metadata?: ShinkaMeta<SO, TO>,
) => Promise<T>;

export type ShinkaOnDataEvent<TA> = (
  key: DataEventKey,
  val: (data: any, thisArg: TA) => void,
) => void;

export type ShinkaDataEvent<SO, TO> = (
  event: DataEventKey,
  data: any,
  metadata?: ShinkaMeta<SO, TO>,
) => void;

export type ShinkaOn<SO, TO, TA> = {
  onRequest: ShinkaOnRequest<SO, TO, TA>;
  onDataEvent: ShinkaOnDataEvent<TA>;
};

export type ShinkaDo<SO, TO> = {
  request: ShinkaRequest<SO, TO>;
  dataEvent: ShinkaDataEvent<SO, TO>;
};

export type IBus<SO, TO> = ShinkaDo<SO, TO> & {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  restart: () => Promise<void>;
  ping: () => Promise<number>;
  addEventListener: ManageEventListener<IBus<SO, TO>>;
  removeEventListener: ManageEventListener<IBus<SO, TO>>;
  extra: Record<string | symbol, any>;
  exclusiveLock: (timeout: number) => Promise<AsyncDisposeContext>;
};

export type Shinka<SO, TO, TA> = ShinkaOn<SO, TO, TA> & ShinkaDo<SO, TO>;

export type MetadataWithHint<SO, TO> = ShinkaMeta<SO, TO> & {
  hint?: FnConstructorName;
};

export type MessageDispatchHandler<M> = (message: M) => void;

export type DispatchMap = Map<
  MessageType,
  | MessageDispatchHandler<MessageRequest<any>>
  | MessageDispatchHandler<MessageResponse<any>>
  | MessageDispatchHandler<MessageDataEvent<any>>
>;

export type InternalHandlerThisArg<SO, TO, STATE> = {
  bus: IBus<SO, TO>;
  shinka: Shinka<SO, TO, InternalHandlerThisArg<SO, TO, STATE>>;
  state: STATE;
  dispatchError: (error: any) => void;
  exclusiveLock: (timeout: number) => Promise<AsyncDisposeContext>;
};

export type BusHandlerThisArg<SO, TO, STATE> = {
  bus: IBus<SO, TO>;
  shinka: Shinka<SO, TO, BusHandlerThisArg<SO, TO, STATE>>;
  state: STATE;
  dispatchError: (error: any) => void;
  exclusiveLock: (timeout: number) => Promise<AsyncDisposeContext>;
  byeReset: () => void;
};

export type UserHandlerRegistries<SO, TO, B> = HandlerRegistries<SO, TO, B>;

export type InternalHandlerRegistries<SO, TO, STATE> = HandlerRegistries<
  SO,
  TO,
  InternalHandlerThisArg<SO, TO, STATE>
>;

export type BusHandlerRegistries<SO, TO, STATE> = HandlerRegistries<
  SO,
  TO,
  BusHandlerThisArg<SO, TO, STATE>
>;

// In some cases serialization is not required
export type SerializedData = string | Uint8Array | Message<any>;

export type ProcessData<B> = [DataEventKey, B];
export type DataEventHandler<TA, B> = (
  key: DataEventKey,
  data: B,
  thisArg: TA,
) => void;

export type RequestHandler<SO, TO, TA, B> = (
  key: DataEventKey,
  body: B,
  context: Context<SO, TO>,
  thisArg: TA,
  dispatchError: DispatchError,
) => void;

export type SerializerInitOpts = {
  root: "object" | "array";
};

export type SerializationMode = "text" | "binary";
export type NotSerialized = "not-serialized";
export type TransportInitOptsMode = SerializationMode | NotSerialized;

export type TransportInitOpts =
  | {
      mode: SerializationMode;
      contentType: string;
    }
  | { mode: NotSerialized };

export type SerializerTypeHints = {
  serialize: FnConstructorName;
  deserialize: FnConstructorName;
};

export type SerializerFnSync<
  I extends Message<any>,
  O extends SerializedData,
  SO,
> = (data: I, opts?: SO) => O;

export type SerializerFnAsync<
  I extends Message<any>,
  O extends SerializedData,
  SO,
> = (data: I, opts?: SO) => Promise<O>;

export type SerializerFn<
  I extends Message<any>,
  O extends SerializedData,
  SO,
> = SerializerFnSync<I, O, SO> | SerializerFnAsync<I, O, SO>;

export type DeserializerFnSync<
  I extends Message<any>,
  O extends SerializedData,
> = (data: O) => I;

export type DeserializerFnAsync<
  I extends Message<any>,
  O extends SerializedData,
> = (data: O) => Promise<I>;

export type DeserializerFn<I extends Message<any>, O extends SerializedData> =
  | DeserializerFnSync<I, O>
  | DeserializerFnAsync<I, O>;

export type OnReadyFn = () => void | Promise<void>;

export type GenericSerializer<
  I extends Message<any>,
  O extends SerializedData,
  SO,
> = {
  serialize: SerializerFn<I, O, SO>;
  deserialize: DeserializerFn<I, O>;
  onReady?: OnReadyFn;
  stop?: () => void;
  typeHints: SerializerTypeHints;
  transportInitOpts: TransportInitOpts;
};

export type SerializerInstance<SO> = GenericSerializer<Message<any>, any, SO>;
export type SerializerFactory<SO, TO, SS> = (
  thisArg: InternalHandlerThisArg<SO, TO, SS>,
  opts: SerializerInitOpts,
) => SerializerInstance<SO> | Promise<SerializerInstance<SO>>;

export type SerializerRoot<SO, TO, SS> = (
  shinkaOn: ShinkaOn<SO, TO, InternalHandlerThisArg<SO, TO, SS>>,
) => SerializerFactory<SO, TO, SS>;

export type ShinkaEventListener<B> = (bus: B, payload: any) => void;
export type ShinkaEventListenerSet<B> = Set<ShinkaEventListener<B>>;
export type ShinkaEventListenerWeakSet<B> = WeakSet<ShinkaEventListener<B>>;

export type EventListenerType = "connect" | "disconnect" | "error";

export type DispatchError = (error: any) => void;

export type BaseShinkaEventListeners<S> = Record<EventListenerType, S>;

export type ShinkaEventListeners<B> = BaseShinkaEventListeners<
  ShinkaEventListenerSet<B>
>;

export type ShinkaEventListenersBanned<B> = BaseShinkaEventListeners<
  ShinkaEventListenerWeakSet<B>
>;

export type ShinkaListenerLayers<B> = {
  own: ShinkaEventListeners<B>;
  parent: ShinkaEventListeners<B>; // modification is restricted
  banned: ShinkaEventListenersBanned<B>;
};

export type BaseManageEventListener<TYPE, TARGET> = (
  type: TYPE,
  target: TARGET,
) => void;

export type ManageEventListener<B> = BaseManageEventListener<
  EventListenerType,
  ShinkaEventListener<B>
>;

export type TransportAPI = { hi: () => void; bye: () => void };

export type TransportInstance<TO> = {
  send: (data: any, opts?: TO) => void;
  close: () => Promise<void>;
  onReady?: OnReadyFn;
  instruction: { hi?: boolean; bye?: boolean };
};

export type TransportFactory<SO, TO, TS> = (
  thisArg: InternalHandlerThisArg<SO, TO, TS>,
  onRawData: (data: SerializedData) => void,
  onClosed: () => void,
  opts: TransportInitOpts,
) => Promise<TransportInstance<TO>> | TransportInstance<TO>;

export type TransportSubscribe<SO, TO, TS> = (
  shinkaOn: ShinkaOn<SO, TO, InternalHandlerThisArg<SO, TO, TS>>,
) => TransportFactory<SO, TO, TS>;

export type TransportClient<SO, TO, TS> = TransportSubscribe<
  SO,
  TO,
  InternalHandlerThisArg<SO, TO, TS>
>;

export type TransportConnectFn<SO, TO, TS> = (
  transport: TransportFactory<SO, TO, TS>,
) => void;

export type ServerEventType = "connect" | "predisconnect" | "postdisconnect";

export type ServerManageEventListener = BaseManageEventListener<
  ServerEventType,
  () => void
>;

export type ManageEventListenerPair<TYPE> = {
  add: BaseManageEventListener<TYPE, () => void>;
  remove: BaseManageEventListener<TYPE, () => void>;
};

export type TransportServer<SO, TO, TS> = (
  shinkaOn: ShinkaOn<SO, TO, InternalHandlerThisArg<SO, TO, TS>>,
  connect: TransportConnectFn<SO, TO, TS>,
  eventListeners: ManageEventListenerPair<ServerEventType>,
) => void;

export type RejectResolve = [(reason?: any) => void, (value: any) => void];

export type ShinkaMeta<SO, TO> = {
  transport?: TO;
  serialize?: SO;
};

export type SendFn<SO, TO> = (
  message: Message<any>,
  metadata?: ShinkaMeta<SO, TO>,
) => void;

export type LiMonThisArg<SO, TO, LS> = InternalHandlerThisArg<SO, TO, LS> & {
  last: LastDataAt;
  heartbeat: LiMonHeartbeatFn;
};
export type LiMonHeartbeatFn = () => void;
export type LiMonInstance = {
  start: () => void;
  stop: () => void;
};
export type LiMonFactory<SO, TO, LS> = (
  thisArg: LiMonThisArg<SO, TO, LS>,
) => LiMonInstance;
export type LiMon<SO, TO, LS> = (
  shinkaOn: ShinkaOn<SO, TO, LiMonThisArg<SO, TO, LS>>,
) => LiMonFactory<SO, TO, LS>;

export type TransportRF<SO, TO, TS> = [
  HandlerRegistries<SO, TO, InternalHandlerThisArg<SO, TO, TS>> | undefined,
  TransportFactory<SO, TO, TS>,
];

export type SerializerRF<SO, TO, SS> = [
  HandlerRegistries<SO, TO, InternalHandlerThisArg<SO, TO, SS>>,
  SerializerFactory<SO, TO, SS>,
];

export type LiMonRF<SO, TO, LS> = [
  HandlerRegistries<SO, TO, LiMonThisArg<SO, TO, LS>>,
  LiMonFactory<SO, TO, LS>,
];

export type ShinkaAndTA<SO, TO, TA> = {
  shinka: Shinka<SO, TO, TA>;
  TA: TA;
};

export type InternalShinkaAndTA<SO, TO> = ShinkaAndTA<
  SO,
  TO,
  InternalHandlerThisArg<SO, TO, any>
>;

export type BusShinkaAndTA<SO, TO> = ShinkaAndTA<
  SO,
  TO,
  BusHandlerThisArg<SO, TO, any>
>;

export type LimonShinkaAndTA<SO, TO> = ShinkaAndTA<
  SO,
  TO,
  LiMonThisArg<SO, TO, any>
>;

export type NB_FIFOEntry<SO, TO> = [Message<any>, ShinkaMeta<SO, TO>?];

export type NBThisArgSetVars<SO, TO, NBS> = {
  user: ShinkaVarsSetter<SO, TO, any>;
  bus: ShinkaVarsSetter<SO, TO, InternalHandlerThisArg<SO, TO, any>>;
  transport: ShinkaVarsSetter<SO, TO, InternalHandlerThisArg<SO, TO, any>>;
  serializer: ShinkaVarsSetter<SO, TO, InternalHandlerThisArg<SO, TO, any>>;
  limon: ShinkaVarsSetter<SO, TO, LimonShinkaAndTA<SO, TO>> | null;
  nb: ShinkaVarsSetter<SO, TO, NBThisArg<SO, TO, NBS>>;
};

export type NBSetSendFn<SO, TO> = { send: SendFn<SO, TO> };
export type NBVarsValues<SO, TO> = {
  lock: NBSetSendFn<SO, TO>;
  release: NBSetSendFn<SO, TO>;
};

export type NBVars<SO, TO, NBS> = {
  set: NBThisArgSetVars<SO, TO, NBS>;
  val: NBVarsValues<SO, TO>;
};

export type nbAPIRequest = {};

export type nbAPIEvent = {
  acquire: (target: NBAcquire, timeout: number, nonces: number[]) => void;
  accept: () => void;
  release: () => void;
};

// due exclusive-lock is external it's better to provide him API via thisArg
export type nbAPI = {
  r: nbAPIRequest;
  e: nbAPIEvent;
};

export type nbQ = {
  drain: () => void;
  clear: () => void;
};

export type NBThisArg<SO, TO, NBS> = InternalHandlerThisArg<SO, TO, NBS> & {
  q: nbQ;
  // concurrent: NBConcurrent;
  semaphore: Semaphore;
  vars: NBVars<SO, TO, NBS>;
  lock: ExclusiveLock<SO, TO, NBS>;
  api: nbAPI;
  responseTimeout: number;
};

export type NBHandlerRegistries<SO, TO, STATE> = HandlerRegistries<
  SO,
  TO,
  NBThisArg<SO, TO, STATE>
>;

export type NBShinka<SO, TO, STATE> = Shinka<SO, TO, NBThisArg<SO, TO, STATE>>;

export type NBShinkaAndTA<SO, TO, STATE> = {
  shinka: NBShinka<SO, TO, STATE>;
  TA: NBThisArg<SO, TO, STATE>;
};

export type ExclusiveLockAcquire<SO, TO, STATE> = (
  thisArg: NBThisArg<SO, TO, STATE>,
  nbAcquire: NBAcquire,
  timeout: number,
) => Promise<Readonly<AsyncDisposeContext>>;

export type ExclusiveLockOnAcquire<SO, TO, STATE> = (
  thisArg: NBThisArg<SO, TO, STATE>,
  target: NBAcquire,
  timeout: number,
  nonces: number[],
) => void;

export type ExclusiveLockOnAccept<SO, TO, STATE> = (
  thisArg: NBThisArg<SO, TO, STATE>,
) => void;

export type ExclusiveLockReleaseMe<SO, TO, STATE> = (
  thisArg: NBThisArg<SO, TO, STATE>,
  semaphoreCTX: DisposeContext,
) => void;

export type ExclusiveLockOnRelease<SO, TO, STATE> = (
  thisArg: NBThisArg<SO, TO, STATE>,
) => void;

export type ExclusiveLockOn<SO, TO, STATE> = {
  acquire: ExclusiveLockOnAcquire<SO, TO, STATE>;
  accept: ExclusiveLockOnAccept<SO, TO, STATE>;
  release: ExclusiveLockOnRelease<SO, TO, STATE>;
};

export type ExclusiveLock<SO, TO, STATE> = {
  on: ExclusiveLockOn<SO, TO, STATE>;
  acquire: ExclusiveLockAcquire<SO, TO, STATE>;
  start: (thisArg: NBThisArg<SO, TO, STATE>) => void;
  stop: (thisArg: NBThisArg<SO, TO, STATE>) => void;
};

export type ShinkaAndThisArgAll<SO, TO, NBS> = {
  user: Shinka<SO, TO, IBus<SO, TO>>;
  transport: InternalShinkaAndTA<SO, TO> & {
    factory: TransportFactory<SO, TO, any>;
  };
  serializer: InternalShinkaAndTA<SO, TO> & {
    factory: SerializerFactory<SO, TO, any>;
  };
  bus: BusShinkaAndTA<SO, TO>;
  nb: NBShinkaAndTA<SO, TO, NBS>;
  limon:
    | (LimonShinkaAndTA<SO, TO> & { factory: LiMonFactory<SO, TO, any> })
    | null;
};

// Synthetic
export type BusProps<SO, TO> = {
  outscope: OutScope;
  transport: TransportSubscribe<SO, TO, any>;
  lock?: ExclusiveLock<SO, TO, any>;
  serializer?: SerializerRoot<SO, TO, any>;
  limon?: LiMon<SO, TO, any> | null;
  responseTimeout?: number;
};
