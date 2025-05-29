import {
  EventKeys,
  EventSendInnerKey,
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

export class ClientBus extends CommonBus {
  onRequest!: (
    key: DataEventKey,
    fn: (data: any, thisArg: this) => void,
  ) => void;
  onDataEvent!: (
    key: DataEventKey,
    fn: (data: any, thisArg: this) => void,
  ) => void;
  #willDieSent!: boolean;
  #sayHello!: boolean;
  #restartTimeout!: number;

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
    this.#willDieSent = false;
    this.#sayHello = sayHello;
    this.#restartTimeout = restartTimeout;
  }

  async [StartInnerKey]() {
    await super[StartInnerKey]();
    if (this.#sayHello) this[HelloKey]();
  }

  willDie = () => {
    if (this.#willDieSent) return;
    this[EventSendInnerKey](EventKeys.TERMINATE, null);
    this.#willDieSent = true;
  };

  maybeRestart = async () => {
    const timeout = this.#restartTimeout;
    if (!timeout || this[StoppedKey]) return;
    await sleep(timeout);
    await this.restart();
  };

  registerBeforeUnload() {
    self.addEventListener("beforeunload", this.willDie);
  }
}
