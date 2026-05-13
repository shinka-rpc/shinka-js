import type { Context } from "./context";
import type { MessageType } from "./constants";
import type { CommonBus } from "./common";

export type FnConstructorName = "Function" | "AsyncFunction";

export type REQID = number;
export type Request<B> = [REQID, B];

export type MessageRequestBase<T, B> = [T, Request<B>];
export type MessageRequest<B> = MessageRequestBase<
  MessageType.REQUEST_OUTER | MessageType.REQUEST_INNER,
  B
>;
export type MessageResponseBase<T, B> = [T, ResponseType<B>];
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

// In some cases serialization is not required
export type SerializedData = string | Uint8Array | Message<any>;

export type DataEventKey = string | number | boolean;
export type ResponseType<B> = [boolean, REQID, B];
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

export type TransportInitOpts = {
  mode: "text" | "binary" | "not-serialized";
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

export type GenericSerializer<
  I extends Message<any>,
  O extends SerializedData,
  SO,
> = {
  serialize: SerializerFn<I, O, SO>;
  deserialize: DeserializerFn<I, O>;
  typeHints: SerializerTypeHints;
  transportInitOpts: TransportInitOpts;
};

export type Serializer = GenericSerializer<Message<any>, any, any>;
export type SerializerFactory = (
  bus: CommonBus,
) => Serializer | Promise<Serializer>;

export type ShinkaConnectEventListener = (bus: CommonBus) => void;

export type ShinkaEventListeners = {
  connect: Set<ShinkaConnectEventListener>;
  disconnect: Set<ShinkaConnectEventListener>;
};

export type AddRemoveEventListener = (
  type: "connect" | "disconnect",
  target: ShinkaConnectEventListener,
) => void;

export type TransportAPI = { hi: () => void; bye: () => void };

export type Transport = {
  send: (data: any, opts?: any) => void;
  close: () => Promise<void>;
  instruction: { hi?: boolean; bye?: boolean };
};

export type TransportFactory<B> = (
  bus: B,
  opts: TransportInitOpts,
) => Promise<Transport>;

export type CompleteFN<B> = (bus: B) => void;

export type RejectResolve = [(reason?: any) => void, (value: any) => void];

export type ShinkaMetaGeneric<SO, TO> = {
  transport?: TO;
  serialize?: SO;
};

export type ShinkaMeta = ShinkaMetaGeneric<any, any>;

// Synthetic
export type CommonBusProps<B> = {
  transport: TransportFactory<B>;
  serializer?: SerializerFactory;
  responseTimeout?: number;
};

export type ClientBusProps<B> = CommonBusProps<B> & {
  restartTimeout?: number;
};

export type ServerBusConnectProps<B> = CommonBusProps<B> & {
  complete?: CompleteFN<B>;
};
