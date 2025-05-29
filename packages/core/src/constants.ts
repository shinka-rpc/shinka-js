import type { Serializer, StrictRegistry } from "./types";

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

// @ts-expect-error: 2322
export const EventSendInnerKey: unique symbol =
  process.env.NODE_ENV === "production"
    ? Symbol("@shinka-rpc/core:event-send-inner-key")
    : Symbol.for("@shinka-rpc/core:event-send-inner-key");

// @ts-expect-error: 2322
export const RequestInnerKey: unique symbol =
  process.env.NODE_ENV === "production"
    ? Symbol("@shinka-rpc/core:request-inner-key")
    : Symbol.for("@shinka-rpc/core:request-inner-key");

// @ts-expect-error: 2322
export const LazyInitKey: unique symbol =
  process.env.NODE_ENV === "production"
    ? Symbol("@shinka-rpc/core:lazy-init-key")
    : Symbol.for("@shinka-rpc/core:lazy-init-key");

// @ts-expect-error: 2322
export const RegistryKey: unique symbol =
  process.env.NODE_ENV === "production"
    ? Symbol("@shinka-rpc/core:registry-key")
    : Symbol.for("@shinka-rpc/core:registry-key");

// @ts-expect-error: 2322
export const HelloKey: unique symbol =
  process.env.NODE_ENV === "production"
    ? Symbol("@shinka-rpc/core:hello-key")
    : Symbol.for("@shinka-rpc/core:hello-key");

// @ts-expect-error: 2322
export const StoppedKey: unique symbol =
  process.env.NODE_ENV === "production"
    ? Symbol("@shinka-rpc/core:stopped-key")
    : Symbol.for("@shinka-rpc/core:stopped-key");

// @ts-expect-error: 2322
export const StartInnerKey: unique symbol =
  process.env.NODE_ENV === "production"
    ? Symbol("@shinka-rpc/core:start-inner-key")
    : Symbol.for("@shinka-rpc/core:start-inner-key");

export const defaultSerializer: Serializer = {
  serialize: JSON.stringify,
  deserialize: JSON.parse,
};

export const dummy = () => {};

export const emptyRegistry: StrictRegistry<any> = {
  register: dummy,
  unregister: dummy,
};

export const defaultRequestTimeout = 2500;
