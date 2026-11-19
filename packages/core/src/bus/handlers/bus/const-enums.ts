export const enum BusEventKeys {
  HEARTBEAT = 0,
  TERMINATE = 1,
  ABORT_USER = 2,
  ABORT_TRANSPORT = 3,
  ABORT_SERIALIZER = 4,
  ABORT_LIMON = 5,
}

export const enum BusRequestKeys {
  PING = 0,
}

export type AbortTarget =
  | BusEventKeys.ABORT_LIMON
  | BusEventKeys.ABORT_SERIALIZER
  | BusEventKeys.ABORT_TRANSPORT
  | BusEventKeys.ABORT_USER;
