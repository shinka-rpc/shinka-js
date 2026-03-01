import type { SerializerFactory } from "./types";

export const enum MessageType {
  REQUEST_INNER = 0,
  REQUEST_OUTER = 1,
  RESPONSE_INNER = 2,
  RESPONSE_OUTER = 3,
  EVENT_OUTER = 4,
  EVENT_INNER = 5,
}

export const enum EventKeys {
  INITIALIZE = 0,
  TERMINATE = 1,
}

export const enum RequestKeys {
  PING = 0,
}

export const defaultSerializer: SerializerFactory = () => ({
  serialize: JSON.stringify,
  deserialize: JSON.parse,
});

export const defaultRequestTimeout = 2500;
