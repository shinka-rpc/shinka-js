import {
  defaultSerializer,
  LazyInitKey,
  RegistryKey,
  defaultRequestTimeout,
  HelloKey,
} from "./constants";

import { CommonBus } from "./common";

import {
  createEventHandler,
  createRequestHandler,
  createReqRegistry,
  createEventRegistry,
  asOnRequest,
} from "./factory/registry";

import type {
  DataEventKey,
  Serializer,
  StrictRegistry,
  Registry,
  FactoryClient,
  RequestHandler,
  CompleteFN,
  ShinkaMeta,
} from "./types";

export type ServerOptions = {
  registry?: Registry<CommonBus>;
  serializer?: Serializer;
  timeout?: number;
  sayHello?: boolean;
};

const composeServerRegistry = (
  serverCB: (bus: CommonBus) => void,
  externalCB: ((bus: CommonBus) => void) | undefined,
) => {
  if (!externalCB) return serverCB;
  return (bus: CommonBus) => {
    serverCB(bus);
    try {
      externalCB(bus);
    } catch {
      console.trace();
    }
  };
};

const createServerStrictRedistry = (
  registry: Registry<CommonBus> | undefined,
  clients: Set<CommonBus>,
) => {
  const { register, unregister } = registry || {};
  return {
    register: composeServerRegistry(clients.add.bind(clients), register),
    unregister: composeServerRegistry(clients.delete.bind(clients), unregister),
  } as StrictRegistry<CommonBus>;
};

/**
 * ServerBus is a class that manages server-side communication buses.
 * It handles multiple client connections, request/event routing, and provides a centralized
 * way to manage communication between the server and its clients.
 *
 * @class ServerBus
 */
export class ServerBus {
  [RegistryKey]!: StrictRegistry<CommonBus>;
  #serializer!: Serializer;
  #timeout!: number;
  #sayHello: boolean;

  /**
   * Registers a request handler for a specific event key.
   * @param key - The event key to handle requests for
   * @param fn - The callback function to handle the request
   */
  onRequest!: (
    key: DataEventKey,
    fn: (data: any, thisArg: CommonBus) => any,
    metadata?: ShinkaMeta,
  ) => void;

  /**
   * Registers an event handler for a specific event key.
   * @param key - The event key to handle events for
   * @param fn - The callback function to handle the event
   */
  onDataEvent!: (
    key: DataEventKey,
    fn: (data: any, thisArg: CommonBus) => void,
  ) => void;

  #requestHandler!: RequestHandler<CommonBus, any>;
  #eventHandler!: (key: DataEventKey, body: any, thisArg: CommonBus) => void;
  #clients!: Set<CommonBus>;

  /**
   * Additional data storage for the server instance
   */
  extra!: Record<string | symbol, any>;

  /**
   * Creates a new instance of ServerBus.
   *
   * @param options - Configuration options for the ServerBus
   * @param options.registry - Optional registry for request and event handlers
   * @param options.sayHello - Optional flag to send hello message on client connect (defaults to false)
   * @param options.serializer - Optional custom serializer (defaults to defaultSerializer)
   * @param options.timeout - Optional timeout for request responses in milliseconds (defaults to defaultRequestTimeout)
   */
  constructor({
    registry,
    sayHello = false,
    serializer = defaultSerializer,
    timeout = defaultRequestTimeout,
  }: ServerOptions) {
    const clients = new Set<CommonBus>();
    this[RegistryKey] = createServerStrictRedistry(registry, clients);
    this.#serializer = serializer;
    this.#timeout = timeout;
    this.#sayHello = sayHello;
    this.#clients = clients;
    this.extra = {};
    //===
    const [reqGet, reqSet] = createReqRegistry<CommonBus, any, any>();
    const [evGet, evSet] = createEventRegistry<CommonBus, any>();

    this.onRequest = asOnRequest(reqSet);
    this.onDataEvent = evSet;
    this.#requestHandler = createRequestHandler(reqGet);
    this.#eventHandler = createEventHandler(evGet);
  }

  /**
   * Handles a new client connection.
   * Creates a new bus instance for the client and initializes the connection.
   *
   * @param onmessage - Factory function that creates message handlers for the client
   * @param complete - Optional callback function that is called when the connection is established
   * @returns Promise that resolves with the created bus instance
   */
  onConnect = async (
    onmessage: FactoryClient<CommonBus>,
    complete: CompleteFN = () => {},
  ) => {
    const bus = new CommonBus();
    bus[LazyInitKey](
      onmessage,
      this.#serializer,
      this[RegistryKey],
      this.#requestHandler,
      this.#eventHandler,
      this.#timeout,
    );
    complete(bus);
    await bus.start();
    if (this.#sayHello) bus[HelloKey]();
    this.#clients.add(bus);
    return bus;
  };

  /**
   * Notifies all connected clients that the server will be terminated.
   * This should be called before shutting down the server to ensure proper cleanup.
   */
  willDie = () => {
    for (const client of this.#clients) client.willDie();
  };
}
