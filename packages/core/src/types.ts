import type { Context } from "./context";
import type {
  MessageType,
  MessageTypeAllRequest,
  MessageTypeAllResponse,
  MessageTypeAllEvent,
} from "./constants";
import type { Bus } from "./bus";
import type { Client } from "./client";
import type { HandlerRegistries } from "./shinka";

export type VarsLastDataAt = {
  lastReceivedAt: number;
  lastSendAt: number;
};

export type VarsTimeout = VarsLastDataAt & {
  exchangeTimeout: number;
  exchangeTimeoutThreshold: number;
  externalTimeout: number;
};

export type VarsScheduler = VarsTimeout & {
  schedulerTimeoutId: ReturnType<typeof setTimeout> | null;
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

export type Shinka<SO, TO, TA> = ShinkaOn<SO, TO, TA> & ShinkaDo<SO, TO>;

export type ShinkaOnClient<SO, TO> = ShinkaOn<
  SO,
  TO,
  InternalHandlerThisArg<SO, TO, Client<SO, TO>>
>;

export type ShinkaOnBus<SO, TO> = ShinkaOn<
  SO,
  TO,
  InternalHandlerThisArg<SO, TO, Bus<SO, TO>>
>;

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

export type ThisArgMap<SO, TO, TA> = Map<
  MessageType,
  InternalHandlerThisArg<SO, TO, TA> | TA
>;

export type InternalHandlerThisArg<SO, TO, B> = {
  bus: B;
  shinka: Shinka<SO, TO, InternalHandlerThisArg<SO, TO, B>>;
};

export type BusHandlerThisArg<SO, TO, B> = {
  bus: B;
  shinka: Shinka<SO, TO, BusHandlerThisArg<SO, TO, B>>;
  vars: VarsScheduler;
};

export type ShinkaAll<SO, TO, B> = {
  transport: Shinka<SO, TO, InternalHandlerThisArg<SO, TO, B>>;
  serializer: Shinka<SO, TO, InternalHandlerThisArg<SO, TO, B>>;
  bus: Shinka<SO, TO, BusHandlerThisArg<SO, TO, B>>;
  user: Shinka<SO, TO, B>;
};

export type UserHandlerRegistries<SO, TO, B> = HandlerRegistries<SO, TO, B>;

export type InternalHandlerRegistries<SO, TO, B> = HandlerRegistries<
  SO,
  TO,
  InternalHandlerThisArg<SO, TO, B>
>;

export type BusHandlerRegistries<SO, TO, B> = HandlerRegistries<
  SO,
  TO,
  BusHandlerThisArg<SO, TO, B>
>;

export type HandlerRegistriesAll<SO, TO, B> = {
  user: UserHandlerRegistries<SO, TO, B>;
  transport?: InternalHandlerRegistries<SO, TO, B>;
  serializer?: InternalHandlerRegistries<SO, TO, B>;
};

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

export type OnReadyFn<TA> = (thisArg: TA) => void | Promise<void>;

export type GenericSerializer<
  I extends Message<any>,
  O extends SerializedData,
  SO,
  TA,
> = {
  serialize: SerializerFn<I, O, SO>;
  deserialize: DeserializerFn<I, O>;
  onReady?: OnReadyFn<TA>;
  typeHints: SerializerTypeHints;
  transportInitOpts: TransportInitOpts;
};

export type Serializer<SO, TA> = GenericSerializer<Message<any>, any, SO, TA>;
export type SerializerFactory<SO, TA> = () =>
  | Serializer<SO, TA>
  | Promise<Serializer<SO, TA>>;

export type SerializerRoot<SO, TO, TA> = (
  shinkaOn: ShinkaOn<SO, TO, TA>,
) => SerializerFactory<SO, TA>;

export type SerializerClient<SO, TO> = SerializerRoot<
  SO,
  TO,
  InternalHandlerThisArg<SO, TO, Client<SO, TO>>
>;

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

export type Transport<TO, TA> = {
  send: (data: any, opts?: TO) => void;
  close: () => Promise<void>;
  onReady?: OnReadyFn<TA>;
  instruction: { hi?: boolean; bye?: boolean };
};

export type TransportFactory<TO, TA> = (
  onRawData: (data: SerializedData) => void,
  onClosed: () => void,
  opts: TransportInitOpts,
) => Promise<Transport<TO, TA>> | Transport<TO, TA>;

export type TransportSubscribe<SO, TO, TA> = (
  shinkaOn: ShinkaOn<SO, TO, TA>,
) => TransportFactory<TO, TA>;

export type TransportClient<SO, TO> = TransportSubscribe<
  SO,
  TO,
  InternalHandlerThisArg<SO, TO, Client<SO, TO>>
>;

export type FactoriesGeneric<SO, TO, TA> = {
  transport: TransportFactory<TO, TA>;
  serializer: SerializerFactory<SO, TA>;
};

export type Factories<SO, TO> = FactoriesGeneric<
  SO,
  TO,
  InternalHandlerThisArg<SO, TO, Bus<SO, TO>>
>;

export type TransportConnectFn<TO, TA> = (
  transport: TransportFactory<TO, TA>,
) => void;

export type TransportConnectFnBus<SO, TO> = TransportConnectFn<
  TO,
  InternalHandlerThisArg<SO, TO, Bus<SO, TO>>
>;

export type ServerEventType = "connect" | "predisconnect" | "postdisconnect";

export type ServerEventListener = () => void;

export type ServerManageEventListener = BaseManageEventListener<
  ServerEventType,
  ServerEventListener
>;

export type ServerManageEventListenerAll = {
  add: ServerManageEventListener;
  remove: ServerManageEventListener;
};

export type TransportServer<SO, TO> = (
  shinkaOn: ShinkaOn<SO, TO, InternalHandlerThisArg<SO, TO, Bus<SO, TO>>>,
  connect: TransportConnectFn<TO, InternalHandlerThisArg<SO, TO, Bus<SO, TO>>>,
  eventListeners: ServerManageEventListenerAll,
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

// Synthetic
export type BusProps<SO, TO, B> = {
  transport: TransportSubscribe<SO, TO, B>;
  serializer?: SerializerRoot<SO, TO, B>;
  responseTimeout?: number;
};
