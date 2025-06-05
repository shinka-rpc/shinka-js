import {
  defaultSerializer,
  emptyRegistry,
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
} from "./factory/registry";

import type {
  DataEventKey,
  Serializer,
  StrictRegistry,
  Registry,
  FactoryClient,
  RequestHandler,
  CompleteFN,
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

export class ServerBus {
  [RegistryKey]!: StrictRegistry<CommonBus>;
  #serializer!: Serializer;
  #timeout!: number;
  #sayHello: boolean;
  onRequest!: (
    key: DataEventKey,
    fn: (data: any, thisArg: CommonBus) => any,
  ) => void;
  onDataEvent!: (
    key: DataEventKey,
    fn: (data: any, thisArg: CommonBus) => void,
  ) => void;
  #requestHandler!: RequestHandler<CommonBus, any>;
  #eventHandler!: (key: DataEventKey, body: any, thisArg: CommonBus) => void;
  #clients!: Set<CommonBus>;

  extra!: Record<string, any>;

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

    this.onRequest = reqSet;
    this.onDataEvent = evSet;
    this.#requestHandler = createRequestHandler(reqGet);
    this.#eventHandler = createEventHandler(evGet);
  }

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

  willDie = () => {
    for (const client of this.#clients) client.willDie();
  };
}
