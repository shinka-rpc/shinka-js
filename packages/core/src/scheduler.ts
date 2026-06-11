import { Bus } from "./bus";
import { busEvents } from "./bus-handler/do";

import type {
  BusHandlerThisArg,
  Shinka,
  VarsTimeout,
  ExchangeTimeouts,
} from "./types";

export const scheduler = <B extends Bus<any, any>>(
  bus: B,
  shinka: Shinka<any, any, BusHandlerThisArg<any, any, B>>,
  vars: VarsTimeout,
  exchangeTimeouts: ExchangeTimeouts,
) => {
  vars.schedulerTimeoutId = null;
  let when = Number.POSITIVE_INFINITY;
  const now = performance.now();

  if (exchangeTimeouts.value) {
    when = now - vars.lastReceivedAt - exchangeTimeouts.value;
    if (when < -exchangeTimeouts.thrashold) return bus.stop();
  }

  if (vars.externalTimeout) {
    const nextWhen = now - vars.lastSendAt - vars.externalTimeout;
    if (nextWhen <= exchangeTimeouts.thrashold)
      busEvents.iAmAlive(shinka.dataEvent);
    else if (nextWhen < when) when = nextWhen + 1;
  }

  if (when < 0) when = exchangeTimeouts.thrashold;

  if (when < Number.POSITIVE_INFINITY)
    vars.schedulerTimeoutId = setTimeout(
      scheduler,
      when,
      bus,
      shinka,
      vars,
      exchangeTimeouts,
    );
};
