import type { Context } from "./context";
import type { MessageType } from "./constants";
import type { CommonBus } from "./common";

export type REQID = number;

/**
 * Type representing serialized data that can be sent over the bus.
 * This can be either a string or a Uint8Array.
 */
export type SerializedData = string | Uint8Array;

export type DataEventKey = string | number | boolean;
export type Request<B> = [REQID, B];
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

/**
 * Generic serializer interface for converting between
 * message types and serialized data.
 *
 * @template I - The input message type
 * @template O - The output serialized data type
 * @template SO - Serializer options
 */
export type GenericSerializer<
  I extends Message<any>,
  O extends SerializedData,
  SO,
> = {
  /** Converts a message to serialized data */
  serialize: (data: I, opts?: SO) => O;
  /** Converts serialized data back to a message */
  deserialize: (data: O) => I;
};

export type Serializer = GenericSerializer<Message<any>, any, any>;

/**
 * Strict registry interface that requires both register and unregister functions.
 * This is used for managing bus registration and lifecycle.
 *
 * @template C - The type of object being registered
 */
export type StrictRegistry<C> = {
  /** Registers an object with the registry */
  register: (target: C) => void;
  /** Unregisters an object from the registry */
  unregister: (target: C) => void;
};

/**
 * Optional registry interface where register and unregister functions are optional.
 * This is used when a registry implementation might not need both functions.
 *
 * @template C - The type of object being registered
 */
export type Registry<C> = {
  /** Optional function to register an object */
  register?: (target: C) => void;
  /** Optional function to unregister an object */
  unregister?: (target: C) => void;
};

/**
 * Factory data interface for bus communication.
 * This defines the basic functions needed for sending messages and closing connections.
 */
export type FactoryData = {
  /** Function to send data through the bus */
  send: (data: any, opts?: any) => void;
  /** Function to close the connection */
  close: () => Promise<void>;
};

// export type OnMessageSerialized = (data: SerializedData) => void;

export type FactoryClient<B> = (bus: B) => Promise<FactoryData>;

export type CompleteFN<B> = (bus: B) => void;

/**
 * Type representing a tuple of reject and resolve functions for a Promise.
 * This is used internally for managing request/response pairs.
 */
export type RejectResolve = [(reason?: any) => void, (value: any) => void];

export type ShinkaMetaGeneric<SO, TO> = {
  transport?: TO;
  serialize?: SO;
};

export type ShinkaMeta = ShinkaMetaGeneric<any, any>;

// Synthetic
export type CommonBusProps<B> = {
  factory: FactoryClient<B>;
  serializer?: Serializer;
  responseTimeout?: number;
  sayHello?: boolean;
};

export type ClientBusProps<B> = CommonBusProps<B> & {
  restartTimeout?: number;
  registry?: Registry<B>;
};

export type ServerBusConnectProps<B> = CommonBusProps<B> & {
  complete?: CompleteFN<B>;
};
