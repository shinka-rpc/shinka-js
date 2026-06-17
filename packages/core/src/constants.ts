import type { SerializerFactory, SerializerRoot } from "./types";

export const enum MessageType {
  // TRANSPORT
  TRANSPORT_REQUEST = 0,
  TRANSPORT_SUCCESS = 1,
  TRANSPORT_ERROR = 2,
  TRANSPORT_EVENT = 3,
  // SERIALIZER
  SERIALIZER_REQUEST = 4,
  SERIALIZER_SUCCESS = 5,
  SERIALIZER_ERROR = 6,
  SERIALIZER_EVENT = 7,
  // BUS
  BUS_REQUEST = 8,
  BUS_SUCCESS = 9,
  BUS_ERROR = 10,
  BUS_EVENT = 11,
  // USER
  USER_REQUEST = 12,
  USER_SUCCESS = 13,
  USER_ERROR = 14,
  USER_EVENT = 15,
}

export type MessageTypeAllRequest =
  | MessageType.TRANSPORT_REQUEST
  | MessageType.SERIALIZER_REQUEST
  | MessageType.BUS_REQUEST
  | MessageType.USER_REQUEST;

export type MessageTypeAllSuccess =
  | MessageType.TRANSPORT_SUCCESS
  | MessageType.SERIALIZER_SUCCESS
  | MessageType.BUS_SUCCESS
  | MessageType.USER_SUCCESS;

export type MessageTypeAllError =
  | MessageType.TRANSPORT_ERROR
  | MessageType.SERIALIZER_ERROR
  | MessageType.BUS_ERROR
  | MessageType.USER_ERROR;

export type MessageTypeAllResponse =
  | MessageTypeAllSuccess
  | MessageTypeAllError;

export type MessageTypeAllEvent =
  | MessageType.TRANSPORT_EVENT
  | MessageType.SERIALIZER_EVENT
  | MessageType.BUS_EVENT
  | MessageType.USER_EVENT;

export type MessageTypeGroup = [
  MessageTypeAllRequest,
  MessageTypeAllSuccess,
  MessageTypeAllError,
  MessageTypeAllEvent,
];

export const messageTypeTransport: MessageTypeGroup = [
  MessageType.TRANSPORT_REQUEST,
  MessageType.TRANSPORT_SUCCESS,
  MessageType.TRANSPORT_ERROR,
  MessageType.TRANSPORT_EVENT,
];

export const messageTypeSerializer: MessageTypeGroup = [
  MessageType.SERIALIZER_REQUEST,
  MessageType.SERIALIZER_SUCCESS,
  MessageType.SERIALIZER_ERROR,
  MessageType.SERIALIZER_EVENT,
];

export const messageTypeBus: MessageTypeGroup = [
  MessageType.BUS_REQUEST,
  MessageType.BUS_SUCCESS,
  MessageType.BUS_ERROR,
  MessageType.BUS_EVENT,
];

export const messageTypeUser: MessageTypeGroup = [
  MessageType.USER_REQUEST,
  MessageType.USER_SUCCESS,
  MessageType.USER_ERROR,
  MessageType.USER_EVENT,
];

export const enum BusEventKeys {
  I_AM_ALIVE = 0,
  TERMINATE = 1,
  EXCHANGE = 2,
}

export const enum BusRequestKeys {
  PING = 0,
}

const dummy = <I, O>(v: I) => v as any as O;

export const defaultSerializer: SerializerFactory<any, any> = () => ({
  serialize: dummy,
  deserialize: dummy,
  transportInitOpts: { mode: "not-serialized" },
  typeHints: { serialize: "Function", deserialize: "Function" },
});

export const defaultSerializerRoot: SerializerRoot<any, any, any> = () =>
  defaultSerializer;

export const defaultRequestTimeout = 45_000;
export const defaultExchangeTimeout = 15_000;
export const defaultexchangeTimeoutThreshold = 2_500;
