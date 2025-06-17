import {
  LazyInitKey,
  defaultRequestTimeout,
  HelloKey,
  StoppedKey,
  StartInnerKey,
  defaultSerializer,
  emptyRegistry,
} from "./constants";

import {
  createEventHandler,
  createRequestHandler,
  createReqRegistry,
  createEventRegistry,
} from "./factory/registry";

import { CommonBus } from "./common";

import type {
  FactoryClient,
  Serializer,
  DataEventKey,
  Registry,
} from "./types";

import { sleep } from "@shinka-rpc/util/sleep";

export type ClientBusProps<B> = {
  factory: FactoryClient<B>;
  serializer?: Serializer;
  registry?: Registry<B>;
  responseTimeout?: number;
  sayHello?: boolean;
  restartTimeout?: number;
};

/**
 * ClientBus is a class that extends CommonBus to provide client-side event handling and request functionality.
 * It manages event subscriptions, request handling, and provides automatic restart capabilities.
 *
 * @class ClientBus
 * @extends CommonBus
 */
export class ClientBus extends CommonBus {
  /**
   * Registers a request handler for a specific event key.
   * @param key - The event key to handle requests for
   * @param fn - The callback function to handle the request
   */
  onRequest!: (
    key: DataEventKey,
    fn: (data: any, thisArg: this) => void,
  ) => void;

  /**
   * Registers an event handler for a specific event key.
   * @param key - The event key to handle events for
   * @param fn - The callback function to handle the event
   */
  onDataEvent!: (
    key: DataEventKey,
    fn: (data: any, thisArg: this) => void,
  ) => void;

  #sayHello!: boolean;
  #restartTimeout!: number;

  /**
   * Creates a new instance of ClientBus.
   *
   * @param props - Configuration options for the ClientBus
   * @param props.factory - The factory client instance
   * @param props.serializer - Optional custom serializer (defaults to defaultSerializer)
   * @param props.registry - Optional registry for request and event handlers
   * @param props.responseTimeout - Optional timeout for request responses in milliseconds (defaults to defaultRequestTimeout)
   * @param props.sayHello - Optional flag to send hello message on start (defaults to false)
   * @param props.restartTimeout - Optional timeout in milliseconds before attempting restart (defaults to 0)
   */
  constructor({
    factory,
    serializer = defaultSerializer,
    registry,
    responseTimeout = defaultRequestTimeout,
    sayHello = false,
    restartTimeout = 0,
  }: ClientBusProps<ClientBus>) {
    super();
    const [reqGet, reqSet] = createReqRegistry<typeof this, any, any>();
    const [evGet, evSet] = createEventRegistry<typeof this, any>();
    super[LazyInitKey](
      factory,
      serializer,
      { ...emptyRegistry, ...registry },
      createRequestHandler(reqGet),
      createEventHandler(evGet),
      responseTimeout,
    );
    this.onRequest = reqSet;
    this.onDataEvent = evSet;
    this.#sayHello = sayHello;
    this.#restartTimeout = restartTimeout;
  }

  /**
   * Internal method to start the bus and optionally send hello message.
   * @private
   */
  async [StartInnerKey]() {
    await super[StartInnerKey]();
    if (this.#sayHello) this[HelloKey]();
  }

  /**
   * Attempts to restart the bus after the configured restart timeout if the bus is not stopped.
   * This method is useful for implementing automatic reconnection logic.
   *
   * @returns Promise that resolves when the restart attempt is complete
   */
  maybeRestart = async () => {
    const timeout = this.#restartTimeout;
    if (!timeout || this[StoppedKey]) return;
    await sleep(timeout);
    await this.restart();
  };
}
