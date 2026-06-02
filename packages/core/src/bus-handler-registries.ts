import { CommonBus } from "./common";
import { BusRequestKeys, BusEventKeys } from "./constants";
import { createHandlerRegistries } from "./shinka";

import type {
  BusHandlerRegistries,
  BusHandlerThisArg,
  Shinka,
  VarsTimeout,
  ExchangeTimeouts,
  ShinkaDataEvent,
  ShinkaRequest,
} from "./types";

export const busHandlerRegistries: BusHandlerRegistries<any, any, any> =
  createHandlerRegistries();

// === onRequest

busHandlerRegistries.onRequest(BusRequestKeys.PING, () => 0);

// === onDataEvent

busHandlerRegistries.onDataEvent(BusEventKeys.I_AM_ALIVE, () => 0);
busHandlerRegistries.onDataEvent(BusEventKeys.TERMINATE, (_, thisArg) =>
  thisArg.bus.stop(),
);

export const exchangeTimeoutHandler = <B extends CommonBus<any, any>>(
  bus: B,
  shinka: Shinka<any, any, BusHandlerThisArg<any, any, B>>,
  vars: VarsTimeout,
  exchangeTimeouts: ExchangeTimeouts,
) => {
  let when = Number.POSITIVE_INFINITY;
  const now = performance.now();

  if (exchangeTimeouts.value) {
    when = now - vars.lastReceivedAt - exchangeTimeouts.value;
    if (when < -exchangeTimeouts.thrashold) return bus.stop();
  }

  if (vars.externalTimeout) {
    const nextWhen = now - vars.lastSendAt - vars.externalTimeout;
    if (nextWhen <= exchangeTimeouts.thrashold)
      shinka.dataEvent(BusEventKeys.I_AM_ALIVE, 0);
    else if (nextWhen < when) when = nextWhen + 1;
  }

  if (when < 0) when = exchangeTimeouts.thrashold;

  if (when < Number.POSITIVE_INFINITY)
    vars.exchangeTimeoutId = setTimeout(
      exchangeTimeoutHandler,
      when,
      bus,
      shinka,
      vars,
      exchangeTimeouts,
    );
};

busHandlerRegistries.onDataEvent(
  BusEventKeys.EXCHANGE,
  (value: number, { bus, shinka, vars, exchangeTimeouts }) => {
    vars.externalTimeout = value;
    if (vars.exchangeTimeoutId !== null) clearTimeout(vars.exchangeTimeoutId);
    exchangeTimeoutHandler(bus, shinka, vars, exchangeTimeouts);
  },
);

// ===

export const busEvents = {
  iAmAlive: (dataEvent: ShinkaDataEvent<any, any>) =>
    dataEvent(BusEventKeys.I_AM_ALIVE, 0),
  terminate: (dataEvent: ShinkaDataEvent<any, any>) =>
    dataEvent(BusEventKeys.TERMINATE, 0),
  exchange: (dataEvent: ShinkaDataEvent<any, any>, value: number) =>
    dataEvent(BusEventKeys.EXCHANGE, value),
};

export const busRequests = {
  ping: (request: ShinkaRequest<any, any>) =>
    request<void>(BusRequestKeys.PING, 0),
};
