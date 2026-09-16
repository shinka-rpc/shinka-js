export const enum MessageType {
  // USER
  USER_REQUEST = 0,
  USER_SUCCESS = 1,
  USER_ERROR = 2,
  USER_EVENT = 3,
  // BUS
  BUS_REQUEST = 4,
  BUS_SUCCESS = 5,
  BUS_ERROR = 6,
  BUS_EVENT = 7,
  // NON_BLOCKING
  NB_REQUEST = 8,
  NB_SUCCESS = 9,
  NB_ERROR = 10,
  NB_EVENT = 11,
  // TRANSPORT
  TRANSPORT_REQUEST = 12,
  TRANSPORT_SUCCESS = 13,
  TRANSPORT_ERROR = 14,
  TRANSPORT_EVENT = 15,
  // SERIALIZER
  SERIALIZER_REQUEST = 16,
  SERIALIZER_SUCCESS = 17,
  SERIALIZER_ERROR = 18,
  SERIALIZER_EVENT = 19,
  // LIMON
  LIMON_REQUEST = 20,
  LIMON_SUCCESS = 21,
  LIMON_ERROR = 22,
  LIMON_EVENT = 23,
}

export type MessageTypeAllRequest =
  | MessageType.USER_REQUEST
  | MessageType.BUS_REQUEST
  | MessageType.NB_REQUEST
  | MessageType.TRANSPORT_REQUEST
  | MessageType.SERIALIZER_REQUEST
  | MessageType.LIMON_REQUEST;

export type MessageTypeAllSuccess =
  | MessageType.USER_SUCCESS
  | MessageType.BUS_SUCCESS
  | MessageType.NB_SUCCESS
  | MessageType.TRANSPORT_SUCCESS
  | MessageType.SERIALIZER_SUCCESS
  | MessageType.LIMON_SUCCESS;

export type MessageTypeAllError =
  | MessageType.USER_ERROR
  | MessageType.BUS_ERROR
  | MessageType.NB_ERROR
  | MessageType.TRANSPORT_ERROR
  | MessageType.SERIALIZER_ERROR
  | MessageType.LIMON_ERROR;

export type MessageTypeAllResponse =
  | MessageTypeAllSuccess
  | MessageTypeAllError;

export type MessageTypeAllEvent =
  | MessageType.USER_EVENT
  | MessageType.BUS_EVENT
  | MessageType.NB_EVENT
  | MessageType.TRANSPORT_EVENT
  | MessageType.SERIALIZER_EVENT
  | MessageType.LIMON_EVENT;

export type MessageTypeGroup = [
  MessageTypeAllRequest,
  MessageTypeAllSuccess,
  MessageTypeAllError,
  MessageTypeAllEvent,
];

export const messageTypeUser: MessageTypeGroup = [
  MessageType.USER_REQUEST,
  MessageType.USER_SUCCESS,
  MessageType.USER_ERROR,
  MessageType.USER_EVENT,
];

export const messageTypeBus: MessageTypeGroup = [
  MessageType.BUS_REQUEST,
  MessageType.BUS_SUCCESS,
  MessageType.BUS_ERROR,
  MessageType.BUS_EVENT,
];

export const messageTypeNB: MessageTypeGroup = [
  MessageType.NB_REQUEST,
  MessageType.NB_SUCCESS,
  MessageType.NB_ERROR,
  MessageType.NB_EVENT,
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

export const messageTypeLimon: MessageTypeGroup = [
  MessageType.LIMON_REQUEST,
  MessageType.LIMON_SUCCESS,
  MessageType.LIMON_ERROR,
  MessageType.LIMON_EVENT,
];
