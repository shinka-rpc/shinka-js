import type { IBus } from "../types";
import type { DisposableIBus, DisposeCb } from "./types";

const { freeze: objectFreeze, assign: objectAssign } = Object;

const o_o = () => {
  throw new Error("disposed");
};
const dummy = () => {};

const disposedBus: IBus<any, any> = objectFreeze({
  request: o_o,
  dataEvent: o_o,
  start: o_o,
  stop: o_o,
  restart: o_o,
  ping: o_o,
  extra: objectFreeze({}),
  addEventListener: o_o,
  removeEventListener: o_o,
  exclusiveLock: o_o,
  alive: false,
});

type BusProxyVars<SO, TO> = {
  bus: IBus<SO, TO>;
  dispose: DisposeCb;
};

const disposedVars: BusProxyVars<any, any> = objectFreeze({
  bus: disposedBus,
  dispose: dummy,
});

function onceDispose(this: BusProxyVars<any, any>, dispose: DisposeCb) {
  objectAssign(this, disposedVars);
  dispose();
}

// Idea: no BusProxy reference, OK to put into FinalizationRegistry
function wrapDispose(this: BusProxyVars<any, any>) {
  this.dispose();
}

export class BusProxy<SO = any, TO = any> implements DisposableIBus<SO, TO> {
  #vars: BusProxyVars<SO, TO>;
  dispose: DisposeCb;
  [Symbol.dispose]!: DisposeCb;

  constructor(bus: IBus<SO, TO>, origDispose: DisposeCb) {
    const vars: BusProxyVars<any, any> = { bus, dispose: dummy },
      dispose = onceDispose.bind(vars, origDispose),
      disposePublic = wrapDispose.bind(vars);
    vars.dispose = dispose;
    this.#vars = vars;
    this.dispose = disposePublic;
    this[Symbol.dispose] = disposePublic;
    objectFreeze(this);
  }

  request = <T>(...args: Parameters<IBus<SO, TO>["request"]>) =>
    this.#vars.bus.request<T>(...args);
  dataEvent = (...args: Parameters<IBus<SO, TO>["dataEvent"]>) =>
    this.#vars.bus.dataEvent(...args);
  start = () => this.#vars.bus.start();
  stop = () => this.#vars.bus.stop();
  ping = () => this.#vars.bus.ping();
  restart = () => this.#vars.bus.restart();
  exclusiveLock = (timeout: number) => this.#vars.bus.exclusiveLock(timeout);
  addEventListener = (...args: Parameters<IBus<SO, TO>["addEventListener"]>) =>
    this.#vars.bus.addEventListener(...args);
  removeEventListener = (
    ...args: Parameters<IBus<SO, TO>["removeEventListener"]>
  ) => this.#vars.bus.removeEventListener(...args);

  get extra() {
    return this.#vars.bus.extra;
  }

  get alive() {
    return this.#vars.bus.alive;
  }
}
