import {
  MessageType,
  EventKeys,
  EventSendInnerKey,
  RequestInnerKey,
  LazyInitKey,
  RegistryKey,
  HelloKey,
  StoppedKey,
  StartInnerKey,
  RequestKeys,
} from "./constants";

import type {
  FactoryClient,
  Serializer,
  Message,
  DataEventHandler,
  Response,
  DataEvent,
  Request,
  RequestHandler,
  StrictRegistry,
  MessageEvent,
  DataEventKey,
  SerializedData,
} from "./types";

import {
  createEventHandler,
  createRequestHandler,
  createEventRegistry,
  createReqRegistry,
} from "./factory/registry";

import { reqrsp } from "./factory/request-response";
import { registerEventsInner, registerRequestsInner } from "./inner";

/**
 * CommonBus is the base class for implementing message-based communication buses.
 * It provides core functionality for handling requests, responses, and events between different parts of the system.
 *
 * @class CommonBus
 */
export class CommonBus {
  #factory!: FactoryClient<typeof this>;
  #serializer!: Serializer;
  [RegistryKey]!: StrictRegistry<typeof this>;
  #sendMessage?: (message: any) => void;
  #closeBus?: () => Promise<void>;

  /**
   * Sends a request and waits for a response.
   * @template T - The expected response type
   * @param key - The event key to send the request to
   * @param data - The data to send with the request
   * @returns Promise that resolves with the response data
   */
  request!: <T>(key: DataEventKey, data: any) => Promise<T>;

  #onResponseOuter!: (response: Response<any>) => void;
  #onMessageRequestOuter!: (request: Request<any>) => void;
  [RequestInnerKey]!: <T>(key: DataEventKey, data: any) => Promise<T>;
  #onResponseInner!: (response: Response<any>) => void;
  #onMessageRequestInner!: (request: Request<any>) => void;
  #onDataEventOuter!: DataEventHandler<typeof this, any>;
  #onDataEventInner!: DataEventHandler<typeof this, any>;

  /**
   * Additional data storage for the bus instance
   */
  extra!: Record<string, any>;

  [StoppedKey]!: boolean;
  #started!: boolean;
  #willDieSent!: boolean;

  /**
   * Initializes the bus with the provided configuration.
   * This is an internal method that should not be called directly.
   *
   * @protected
   * @param factory - The factory client instance
   * @param serializer - The serializer to use for message serialization
   * @param registry - The registry for request and event handlers
   * @param onRequestOuter - The outer request handler
   * @param onDataEventOuter - The outer event handler
   * @param responseTimeout - Timeout for request responses in milliseconds
   */
  protected [LazyInitKey](
    factory: FactoryClient<typeof this>,
    serializer: Serializer,
    registry: StrictRegistry<typeof this>,
    onRequestOuter: RequestHandler<typeof this, any>,
    onDataEventOuter: DataEventHandler<typeof this, any>,
    responseTimeout: number,
  ) {
    this.#closeBus = undefined;
    this.#sendMessage = undefined;
    this.#factory = factory;
    this.#serializer = serializer;
    this[RegistryKey] = registry;
    this.#onDataEventOuter = onDataEventOuter;
    this.extra = {};
    this[StoppedKey] = false;
    this.#started = false;
    this.#willDieSent = false;
    [this.request, this.#onResponseOuter, this.#onMessageRequestOuter] = reqrsp(
      this,
      MessageType.REQUEST_OUTER,
      this.#sendData,
      onRequestOuter,
      responseTimeout,
    );
    const [reqGet, reqSet] = createReqRegistry<typeof this, any, any>();
    [
      this[RequestInnerKey],
      this.#onResponseInner,
      this.#onMessageRequestInner,
    ] = reqrsp(
      this,
      MessageType.REQUEST_INNER,
      this.#sendData,
      createRequestHandler(reqGet),
      responseTimeout,
    );
    const [evGet, evSet] = createEventRegistry<typeof this, any>();
    this.#onDataEventInner = createEventHandler(evGet);
    registerEventsInner(evSet);
    registerRequestsInner(reqSet);
  }

  /**
   * Starts the bus and initializes the connection.
   * This is an internal method that should not be called directly.
   *
   * @protected
   */
  async [StartInnerKey]() {
    if (this.#started) return console.warn("Double start caught!");
    this.#started = true;

    const { send, close } = await this.#factory(this);
    this.#sendMessage = send;
    this.#closeBus = close;
    queueMicrotask(() => this[RegistryKey].register(this));
  }

  /**
   * Starts the bus and establishes the connection.
   * This method should be called to begin communication.
   */
  async start() {
    this[StoppedKey] = false;
    await this[StartInnerKey]();
  }

  /**
   * Stops the bus and closes the connection.
   * This method should be called to clean up resources.
   */
  async stop() {
    this[StoppedKey] = true;
    this.#willDieSent = false;
    await this.#stopInner();
  }

  /**
   * Internal method to handle bus stopping and cleanup.
   * @private
   */
  async #stopInner() {
    this.#started = false;
    queueMicrotask(() => this[RegistryKey].unregister(this));
    const close = this.#closeBus;
    this.#closeBus = undefined;
    this.#sendMessage = undefined;
    if (close) await close();
  }

  /**
   * Restarts the bus by stopping and starting it again.
   * This is useful for reconnection scenarios.
   */
  async restart() {
    try {
      await this.#stopInner();
    } catch (e) {
      console.warn(e);
    }
    await this[StartInnerKey]();
  }

  /**
   * Sends a message through the bus.
   * @private
   * @param message - The message to send
   */
  #sendData = (message: Message<any>) => {
    const serialized = this.#serializer.serialize(message);
    this.#sendMessage!(serialized);
  };

  /**
   * Handles incoming messages from the bus.
   * This method processes different types of messages (requests, responses, events).
   *
   * @param serialized - The serialized message data
   */
  onMessage = (serialized: SerializedData) => {
    const data = this.#serializer.deserialize(serialized) as Message<any>;
    const [msgType, body] = data;
    switch (msgType) {
      case MessageType.REQUEST_INNER:
        return this.#onMessageRequestInner(body);
      case MessageType.REQUEST_OUTER:
        return this.#onMessageRequestOuter(body);
      case MessageType.RESPONSE_INNER:
        return this.#onResponseInner(body);
      case MessageType.RESPONSE_OUTER:
        return this.#onResponseOuter(body);
      case MessageType.EVENT_INNER:
        return this.#onDataEventInner(...body, this);
      case MessageType.EVENT_OUTER:
        return this.#onDataEventOuter(...body, this);
      default:
        console.error("UNKNOWN MESSAGE TYPE");
    }
  };

  /**
   * Sends an event through the bus.
   * @private
   * @param event_type - The type of event to send
   * @param event - The event data
   */
  #eventSend(
    event_type: MessageType.EVENT_OUTER | MessageType.EVENT_INNER,
    event: DataEvent<any>,
  ) {
    const message: MessageEvent<any> = [event_type, event];
    this.#sendData(message);
  }

  /**
   * Sends an inner event through the bus.
   * @protected
   * @param key - The event key
   * @param data - The event data
   */
  [EventSendInnerKey](key: DataEventKey, data: any) {
    this.#eventSend(MessageType.EVENT_INNER, [key, data]);
  }

  /**
   * Sends an outer event through the bus.
   * @param key - The event key
   * @param data - The event data
   */
  event(key: DataEventKey, data: any) {
    this.#eventSend(MessageType.EVENT_OUTER, [key, data]);
  }

  /**
   * Sends a hello message to initialize the connection.
   * @protected
   */
  [HelloKey] = () => this[EventSendInnerKey](EventKeys.INITIALIZE, null);

  /**
   * Measures the round-trip time to the other end of the bus.
   * @returns Promise that resolves with the ping time in milliseconds
   */
  ping = async () => {
    const begin = performance.now();
    await this[RequestInnerKey]<void>(RequestKeys.PING, null);
    return performance.now() - begin;
  };

  /**
   * Notifies the other end that this bus instance will be terminated.
   * This should be called before stopping the bus to ensure proper cleanup.
   */
  willDie = () => {
    if (this.#willDieSent) return;
    this[EventSendInnerKey](EventKeys.TERMINATE, null);
    this.#willDieSent = true;
  };
}
