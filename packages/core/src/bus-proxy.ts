import type { IBus } from "./types";
import type { Bus } from "./bus";
import type { DisposeContext } from "@shinka-rpc/util";

const { freeze: objectFreeze, assign: objectAssign } = Object;

const o_o = () => {
  throw new Error("disposed");
};

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
});

type BusProxyVars<SO, TO> = {
  bus: IBus<SO, TO>;
  dispose: () => void;
};

const disposedVars: BusProxyVars<any, any> = objectFreeze({
  bus: disposedBus,
  dispose: o_o,
});

export type DisposableIBus<SO, TO> = IBus<SO, TO> & DisposeContext;

export class BusProxy<SO = any, TO = any> implements DisposableIBus<SO, TO> {
  #vars: BusProxyVars<SO, TO>;
  extra: any;

  constructor(bus: IBus<SO, TO>, dispose: () => void) {
    this.#vars = { bus, dispose };
    this.extra = bus.extra;
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
  dispose = () => {
    this.#vars.dispose();
    objectAssign(this.#vars, disposedVars);
  };
  [Symbol.dispose] = () => this.dispose();
}
