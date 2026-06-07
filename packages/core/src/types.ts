import type { Context } from "./context";
import type {
  MessageType,
  MessageTypeAllRequest,
  MessageTypeAllResponse,
  MessageTypeAllEvent,
} from "./constants";
import type { Bus } from "./bus";
import type { HandlerRegistries } from "./shinka";

export type ExchangeTimeouts = {
  value: number;
  thrashold: number;
};

export type VarsLastDataAt = {
  lastReceivedAt: number;
  lastSendAt: number;
};

export type VarsTimeout = VarsLastDataAt & {
  externalTimeout: number;
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

export type MetadataWithHint<SO, TO> = ShinkaMeta<SO, TO> & {
  hint?: FnConstructorName;
};

export type MessageDispatchHandler<TA, M> = (message: M, thisArg: TA) => void;

export type DispatchMap<TA> = Map<
  MessageType,
  | MessageDispatchHandler<TA, MessageRequest<any>>
  | MessageDispatchHandler<TA, MessageResponse<any>>
  | MessageDispatchHandler<TA, MessageDataEvent<any>>
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
  vars: VarsTimeout;
  exchangeTimeouts: ExchangeTimeouts;
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
  context: Context<SO, TO, TA>,
) => void;

export type TransportInitOpts = {
  mode: "text" | "binary" | "not-serialized";
  contentType?: string;
};

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
  typeHints: SerializerTypeHints;
  transportInitOpts: TransportInitOpts;
};

export type Serializer<SO> = GenericSerializer<Message<any>, any, SO>;
export type SerializerFactory<SO> = () =>
  | Serializer<SO>
  | Promise<Serializer<SO>>;

export type SerializerRoot<SO, TO, TA> = (
  shinkaOn: ShinkaOn<SO, TO, TA>,
) => SerializerFactory<SO>;

export type ShinkaEventListener<B> = (bus: B) => void;
export type ShinkaEventListenerSet<B> = Set<ShinkaEventListener<B>>;
export type ShinkaEventListenerWeakSet<B> = WeakSet<ShinkaEventListener<B>>;

export type BaseShinkaEventListeners<S> = {
  connect: S;
  disconnect: S;
};

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

export type EventListenerType = "connect" | "disconnect";

export type ManageEventListener<B> = (
  type: EventListenerType,
  target: ShinkaEventListener<B>,
) => void;

export type TransportAPI = { hi: () => void; bye: () => void };

export type Transport<TO> = {
  send: (data: any, opts?: TO) => void;
  close: () => Promise<void>;
  onReady?: OnReadyFn;
  instruction: { hi?: boolean; bye?: boolean };
};

export type TransportFactory<TO> = (
  onRawData: (data: SerializedData) => void,
  onClosed: () => void,
  opts: TransportInitOpts,
) => Promise<Transport<TO>>;

export type TransportClient<SO, TO, TA> = (
  shinkaOn: ShinkaOn<SO, TO, TA>,
) => TransportFactory<TO>;

export type Factories<SO, TO> = {
  transport: TransportFactory<TO>;
  serializer: SerializerFactory<SO>;
};

export type TransportServer<SO, TO> = (
  shinkaOn: ShinkaOn<SO, TO, InternalHandlerThisArg<SO, TO, Bus<SO, TO>>>,
  connect: (transport: TransportFactory<TO>) => void,
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
export type BusProps<SO, TO, B extends Bus<SO, TO>> = {
  transport: TransportClient<SO, TO, B>;
  serializer?: SerializerRoot<SO, TO, B>;
  responseTimeout?: number;
};

export type ClientBusProps<SO, TO, B extends Bus<SO, TO>> = BusProps<
  SO,
  TO,
  B
> & {
  restartTimeout?: number;
};
