import type { SerializerFactory, SerializerRoot } from "./types";

export const enum MessageType {
  // TRANSPORT
  TRANSPORT_REQUEST = 0,
  TRANSPORT_RESPONSE_OK = 1,
  TRANSPORT_RESPONSE_ERR = 2,
  TRANSPORT_EVENT = 3,
  // SERIALIZER
  SERIALIZER_REQUEST = 4,
  SERIALIZER_RESPONSE_OK = 5,
  SERIALIZER_RESPONSE_ERR = 6,
  SERIALIZER_EVENT = 7,
  // BUS
  BUS_REQUEST = 8,
  BUS_RESPONSE_OK = 9,
  BUS_RESPONSE_ERR = 10,
  BUS_EVENT = 11,
  // USER
  USER_REQUEST = 12,
  USER_RESPONSE_OK = 13,
  USER_RESPONSE_ERR = 14,
  USER_EVENT = 15,
}

export type MessageTypeAllRequest =
  | MessageType.TRANSPORT_REQUEST
  | MessageType.SERIALIZER_REQUEST
  | MessageType.BUS_REQUEST
  | MessageType.USER_REQUEST;

export type MessageTypeAllResponseOK =
  | MessageType.TRANSPORT_RESPONSE_OK
  | MessageType.SERIALIZER_RESPONSE_OK
  | MessageType.BUS_RESPONSE_OK
  | MessageType.USER_RESPONSE_OK;

export type MessageTypeAllResponseERR =
  | MessageType.TRANSPORT_RESPONSE_ERR
  | MessageType.SERIALIZER_RESPONSE_ERR
  | MessageType.BUS_RESPONSE_ERR
  | MessageType.USER_RESPONSE_ERR;

export type MessageTypeAllResponse =
  | MessageTypeAllResponseOK
  | MessageTypeAllResponseERR;

export type MessageTypeAllEvent =
  | MessageType.TRANSPORT_EVENT
  | MessageType.SERIALIZER_EVENT
  | MessageType.BUS_EVENT
  | MessageType.USER_EVENT;

export type MessageTypeGroup = [
  MessageTypeAllRequest,
  MessageTypeAllResponseOK,
  MessageTypeAllResponseERR,
  MessageTypeAllEvent,
];

export const messageTypeTransport: MessageTypeGroup = [
  MessageType.TRANSPORT_REQUEST,
  MessageType.TRANSPORT_RESPONSE_OK,
  MessageType.TRANSPORT_RESPONSE_ERR,
  MessageType.TRANSPORT_EVENT,
];

export const messageTypeSerializer: MessageTypeGroup = [
  MessageType.SERIALIZER_REQUEST,
  MessageType.SERIALIZER_RESPONSE_OK,
  MessageType.SERIALIZER_RESPONSE_ERR,
  MessageType.SERIALIZER_EVENT,
];

export const messageTypeBus: MessageTypeGroup = [
  MessageType.BUS_REQUEST,
  MessageType.BUS_RESPONSE_OK,
  MessageType.BUS_RESPONSE_ERR,
  MessageType.BUS_EVENT,
];

export const messageTypeUser: MessageTypeGroup = [
  MessageType.USER_REQUEST,
  MessageType.USER_RESPONSE_OK,
  MessageType.USER_RESPONSE_ERR,
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

export const defaultSerializer: SerializerFactory<any> = () => ({
  serialize: dummy,
  deserialize: dummy,
  transportInitOpts: { mode: "not-serialized" },
  typeHints: { serialize: "Function", deserialize: "Function" },
});

export const defaultSerializerRoot: SerializerRoot<any, any, any> = () => [
  defaultSerializer,
];

export const defaultRequestTimeout = 30_000;
export const defaultExchangeTimeoutThrashold = 1000;
