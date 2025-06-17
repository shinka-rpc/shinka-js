import type { Serializer, StrictRegistry } from "./types";

export const enum MessageType {
  REQUEST_INNER = 0,
  REQUEST_OUTER = 1,
  RESPONSE_INNER = 2,
  RESPONSE_OUTER = 3,
  EVENT_OUTER = 4,
  EVENT_INNER = 5,
}

/**
 * Enum defining the standard event keys used for internal communication.
 * These events are used for bus initialization and termination.
 */
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

/**
 * Symbol used as a key for accessing the registry in bus instances.
 * This is used internally for managing bus registration and unregistration.
 */
// @ts-expect-error: 2322
export const RegistryKey: unique symbol =
  process.env.NODE_ENV === "production"
    ? Symbol("@shinka-rpc/core:registry-key")
    : Symbol.for("@shinka-rpc/core:registry-key");

/**
 * Symbol used as a key for sending hello messages.
 * This is used internally for bus initialization.
 */
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

/**
 * Symbol used as a key for internal bus start operations.
 * This is used internally for bus initialization.
 */
// @ts-expect-error: 2322
export const StartInnerKey: unique symbol =
  process.env.NODE_ENV === "production"
    ? Symbol("@shinka-rpc/core:start-inner-key")
    : Symbol.for("@shinka-rpc/core:start-inner-key");

/**
 * Default serializer implementation using JSON.
 * This is used for message serialization/deserialization.
 */
export const defaultSerializer: Serializer = {
  serialize: JSON.stringify,
  deserialize: JSON.parse,
};

/**
 * Empty function used as a placeholder for no-op operations.
 * @private
 */
export const dummy = () => {};

/**
 * Empty registry implementation that does nothing.
 * This is used as a default registry when none is provided.
 */
export const emptyRegistry: StrictRegistry<any> = {
  register: dummy,
  unregister: dummy,
};

/**
 * Default timeout value for request responses in milliseconds.
 * This is used when no specific timeout is provided.
 */
export const defaultRequestTimeout = 2500;
