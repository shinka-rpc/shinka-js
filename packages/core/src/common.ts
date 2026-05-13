import {
  MessageType,
  EventKeys,
  RequestKeys,
  AsyncFunctionType,
} from "./constants";

import type {
  TransportFactory,
  Serializer,
  Message,
  DataEventHandler,
  ResponseType,
  DataEvent,
  Request,
  RequestHandler,
  AddRemoveEventListener,
  MessageEvent,
  DataEventKey,
  SerializedData,
  ShinkaMeta,
  SerializerFactory,
  ShinkaEventListeners,
} from "./types";

import {
  createEventHandler,
  createRequestHandler,
  createEventRegistry,
  createReqRegistry,
} from "./factory/registry";

import {
  createSendData,
  createHandleReceived,
} from "./factory/serializer-strategy";

import { reqrsp } from "./factory/request-response";
import { registerEventsInner, registerRequestsInner } from "./inner";

// const transportNotInitialized = () => {
//   throw new Error("Transport is not initialized");
// };

export class CommonBus {
  private transport!: TransportFactory<typeof this>;
  private serializerFactory!: SerializerFactory;
  // private serializerInstance!: Serializer;
  private sendDataInner!: (
    message: Message<any>,
    metadata?: ShinkaMeta,
  ) => void;
  private handleReceived!: (serialized: SerializedData) => void;
  protected eventListeners!: ShinkaEventListeners;
  // private sendMessage?: (message: any, opts?: any) => void;
  private closeBus?: () => Promise<void>;

  public request!: <T>(
    key: DataEventKey,
    data: any,
    metadata?: ShinkaMeta,
  ) => Promise<T>;

  private onResponseOuter!: (response: ResponseType<any>) => void;
  private onMessageRequestOuter!: (request: Request<any>) => void;
  protected requestInner!: <T>(key: DataEventKey, data: any) => Promise<T>;
  private onResponseInner!: (response: ResponseType<any>) => void;
  private onMessageRequestInner!: (request: Request<any>) => void;
  private onDataEventOuter!: DataEventHandler<typeof this, any>;
  private onDataEventInner!: DataEventHandler<typeof this, any>;

  public extra!: Record<string | symbol, any>;

  protected stopped!: boolean;
  private started!: boolean;
  private willDieSent!: boolean;

  public __lazyInit(
    transport: TransportFactory<typeof this>,
    serializer: SerializerFactory,
    onRequestOuter: RequestHandler<typeof this, any>,
    onDataEventOuter: DataEventHandler<typeof this, any>,
    responseTimeout: number,
  ) {
    this.closeBus = undefined;
    // this.sendMessage = transportNotInitialized;
    this.transport = transport;
    this.serializerFactory = serializer;
    this.eventListeners = {
      connect: new Set(),
      disconnect: new Set(),
    };
    this.onDataEventOuter = onDataEventOuter;
    this.extra = {};
    this.stopped = false;
    this.started = false;
    this.willDieSent = false;
    [this.request, this.onResponseOuter, this.onMessageRequestOuter] = reqrsp(
      this,
      MessageType.REQUEST_OUTER,
      this.sendData,
      onRequestOuter,
      responseTimeout,
    );
    const [reqGet, reqSet] = createReqRegistry<typeof this, any, any>();
    [this.requestInner, this.onResponseInner, this.onMessageRequestInner] =
      reqrsp(
        this,
        MessageType.REQUEST_INNER,
        this.sendData,
        createRequestHandler(reqGet),
        responseTimeout,
      );
    const [evGet, evSet] = createEventRegistry<typeof this, any>();
    this.onDataEventInner = createEventHandler(evGet);
    registerEventsInner(evSet);
    registerRequestsInner(reqSet);
  }

  protected async startInner() {
    if (this.started) return console.warn("Double start caught!");
    this.started = true;

    const maybeSerializerInstance = this.serializerFactory(this);
    const { serialize, deserialize, transportInitOpts, typeHints } =
      maybeSerializerInstance instanceof Promise
        ? await maybeSerializerInstance
        : maybeSerializerInstance;

    const { send, close } = await this.transport(this, transportInitOpts);

    this.sendDataInner = createSendData(typeHints.serialize, serialize, send);
    this.handleReceived = createHandleReceived(
      typeHints.deserialize,
      deserialize,
      this.dispatch,
    );
    // this.sendMessage = send;
    this.closeBus = close;
    for (const listener of this.eventListeners.connect)
      queueMicrotask(() => listener(this));
  }

  async start() {
    this.stopped = false;
    await this.startInner();
  }

  async stop() {
    this.stopped = true;
    this.willDieSent = false;
    await this.stopInner();
  }

  private async stopInner() {
    this.started = false;
    for (const listener of this.eventListeners.disconnect)
      queueMicrotask(() => listener(this));

    const close = this.closeBus;
    this.closeBus = undefined;
    // this.sendMessage = undefined;
    if (close) await close();
    // this.sendMessage = transportNotInitialized;
  }

  async restart() {
    try {
      await this.stopInner();
    } catch (e) {
      console.warn(e);
    }
    await this.startInner();
  }

  private sendData = (message: Message<any>, metadata?: ShinkaMeta) =>
    this.sendDataInner(message, metadata);

  public onMessage = (serialized: SerializedData) =>
    this.handleReceived(serialized);

  private dispatch = (data: Message<any>) => {
    const [msgType, body] = data;
    switch (msgType) {
      case MessageType.REQUEST_INNER:
        return this.onMessageRequestInner(body);
      case MessageType.REQUEST_OUTER:
        return this.onMessageRequestOuter(body);
      case MessageType.RESPONSE_INNER:
        return this.onResponseInner(body);
      case MessageType.RESPONSE_OUTER:
        return this.onResponseOuter(body);
      case MessageType.EVENT_INNER:
        return this.onDataEventInner(...body, this);
      case MessageType.EVENT_OUTER:
        return this.onDataEventOuter(...body, this);
      default:
        console.error("UNKNOWN MESSAGE TYPE", data);
    }
  };

  private eventSend(
    event_type: MessageType.EVENT_OUTER | MessageType.EVENT_INNER,
    event: DataEvent<any>,
    metadata?: ShinkaMeta,
  ) {
    const message: MessageEvent<any> = [event_type, event];
    this.sendData(message, metadata);
  }

  protected eventInner(key: DataEventKey, data: any) {
    this.eventSend(MessageType.EVENT_INNER, [key, data]);
  }

  public event(key: DataEventKey, data: any, metadata?: ShinkaMeta) {
    this.eventSend(MessageType.EVENT_OUTER, [key, data], metadata);
  }

  public ping = async () => {
    const begin = performance.now();
    await this.requestInner<void>(RequestKeys.PING, null);
    return performance.now() - begin;
  };

  public addEventListener: AddRemoveEventListener = (type, target) =>
    this.eventListeners[type].add(target);

  public removeEventListener: AddRemoveEventListener = (type, target) =>
    this.eventListeners[type].delete(target);

  private transportAPI = {
    hi: () => this.eventInner(EventKeys.INITIALIZE, null),
    bye: () => {
      if (this.stopped || this.willDieSent) return;
      this.eventInner(EventKeys.TERMINATE, null);
      this.willDieSent = true;
    },
  };
}
