import { sleep } from "@shinka-rpc/util";

import { defaultRequestTimeout, defaultSerializer } from "./constants";

import {
  createEventHandler,
  createRequestHandler,
  createReqRegistry,
  createEventRegistry,
  asOnRequest,
} from "./factory/registry";

import { CommonBus } from "./common";

import type { DataEventKey, ShinkaMeta, ClientBusProps } from "./types";

export class ClientBus extends CommonBus {
  onRequest!: (
    key: DataEventKey,
    fn: (data: any, thisArg: this) => void,
    metadata?: ShinkaMeta,
  ) => void;

  onDataEvent!: (
    key: DataEventKey,
    fn: (data: any, thisArg: this) => void,
  ) => void;

  // private sayHello!: boolean;
  private restartTimeout!: number;

  constructor({
    transport,
    serializer = defaultSerializer,
    responseTimeout = defaultRequestTimeout,
    // sayHello = false,
    restartTimeout = 0,
  }: ClientBusProps<ClientBus>) {
    super();
    const [reqGet, reqSet] = createReqRegistry<typeof this, any, any>();
    const [evGet, evSet] = createEventRegistry<typeof this, any>();
    super.__lazyInit(
      transport,
      serializer,
      createRequestHandler(reqGet),
      createEventHandler(evGet),
      responseTimeout,
    );
    this.onRequest = asOnRequest(reqSet);
    this.onDataEvent = evSet;
    // this.sayHello = sayHello;
    this.restartTimeout = restartTimeout;
  }

  // async startInner() {
  //   await super.startInner();
  //   if (this.sayHello) this.__hello();
  // }

  maybeRestart = async () => {
    const timeout = this.restartTimeout;
    if (!timeout || this.stopped) return;
    await sleep(timeout);
    await this.restart();
  };
}
