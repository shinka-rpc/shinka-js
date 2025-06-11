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

export class CommonBus {
  #factory!: FactoryClient<typeof this>;
  #serializer!: Serializer;
  [RegistryKey]!: StrictRegistry<typeof this>;
  #sendMessage?: (message: any) => void;
  #closeBus?: () => Promise<void>;
  request!: <T>(key: DataEventKey, data: any) => Promise<T>;
  #onResponseOuter!: (response: Response<any>) => void;
  #onMessageRequestOuter!: (request: Request<any>) => void;
  [RequestInnerKey]!: <T>(key: DataEventKey, data: any) => Promise<T>;
  #onResponseInner!: (response: Response<any>) => void;
  #onMessageRequestInner!: (request: Request<any>) => void;
  #onDataEventOuter!: DataEventHandler<typeof this, any>;
  #onDataEventInner!: DataEventHandler<typeof this, any>;
  extra!: Record<string, any>;
  [StoppedKey]!: boolean;
  #started!: boolean;
  #willDieSent!: boolean;

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

  async [StartInnerKey]() {
    if (this.#started) return console.warn("Double start caught!");
    this.#started = true;

    const { send, close } = await this.#factory(this);
    this.#sendMessage = send;
    this.#closeBus = close;
    queueMicrotask(() => this[RegistryKey].register(this));
  }

  async start() {
    this[StoppedKey] = false;
    await this[StartInnerKey]();
  }

  async stop() {
    this[StoppedKey] = true;
    this.#willDieSent = false;
    await this.#stopInner();
  }

  async #stopInner() {
    this.#started = false;
    queueMicrotask(() => this[RegistryKey].unregister(this));
    const close = this.#closeBus;
    this.#closeBus = undefined;
    this.#sendMessage = undefined;
    if (close) await close();
  }

  async restart() {
    try {
      await this.#stopInner();
    } catch (e) {
      console.warn(e);
    }
    await this[StartInnerKey]();
  }

  #sendData = (message: Message<any>) => {
    const serialized = this.#serializer.serialize(message);
    this.#sendMessage!(serialized);
  };

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

  #eventSend(
    event_type: MessageType.EVENT_OUTER | MessageType.EVENT_INNER,
    event: DataEvent<any>,
  ) {
    const message: MessageEvent<any> = [event_type, event];
    this.#sendData(message);
  }

  [EventSendInnerKey](key: DataEventKey, data: any) {
    this.#eventSend(MessageType.EVENT_INNER, [key, data]);
  }

  event(key: DataEventKey, data: any) {
    this.#eventSend(MessageType.EVENT_OUTER, [key, data]);
  }

  [HelloKey] = () => this[EventSendInnerKey](EventKeys.INITIALIZE, null);

  ping = async () => {
    const begin = performance.now();
    await this[RequestInnerKey]<void>(RequestKeys.PING, null);
    return performance.now() - begin;
  };

  willDie = () => {
    if (this.#willDieSent) return;
    this[EventSendInnerKey](EventKeys.TERMINATE, null);
    this.#willDieSent = true;
  };
}
