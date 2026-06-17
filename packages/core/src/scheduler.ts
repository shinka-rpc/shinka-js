import { Bus } from "./bus";
import { busEvents } from "./bus-handler/do";

import type { BusHandlerThisArg, Shinka, VarsScheduler } from "./types";

const enum SchedulerAction {
  STOP = 0,
  SEND_ALIVE = 1,
}

export const scheduler = <B extends Bus<any, any>>(
  bus: B,
  shinka: Shinka<any, any, BusHandlerThisArg<any, any, B>>,
  vars: VarsScheduler,
) => {
  const actionSet = new Set<SchedulerAction>();
  const when = schedulerCore(
    actionSet,
    performance.now(),
    vars.exchangeTimeout,
    vars.exchangeTimeoutThreshold,
    vars.externalTimeout,
    vars.lastReceivedAt,
    vars.lastSendAt,
  );

  for (const action of actionSet) {
    switch (action) {
      case SchedulerAction.STOP:
        return bus.stop();
      case SchedulerAction.SEND_ALIVE:
        busEvents.iAmAlive(shinka.dataEvent);
    }
  }

  if (when !== null)
    vars.schedulerTimeoutId = setTimeout(scheduler, when, bus, shinka, vars);
};

export const schedulerCore = (
  actionSet: Set<SchedulerAction>,
  now: number,
  exchangeTimeout: number,
  exchangeTimeoutThreshold: number,
  externalTimeout: number,
  lastReceivedAt: number,
  lastSendAt: number,
) => {
  let when = Number.POSITIVE_INFINITY;

  if (exchangeTimeout) {
    when = exchangeTimeout - now + lastReceivedAt;
    if (when < -exchangeTimeoutThreshold) {
      actionSet.add(SchedulerAction.STOP);
      return null;
    }
  }

  if (externalTimeout) {
    const externalWhen =
      externalTimeout -
      now +
      lastSendAt -
      exchangeTimeoutThreshold -
      exchangeTimeoutThreshold;
    if (externalWhen < 0) {
      actionSet.add(SchedulerAction.SEND_ALIVE);
    } else if (externalWhen < when) when = externalWhen;
  }

  if (when === Number.POSITIVE_INFINITY) return null;

  if (when < exchangeTimeoutThreshold) when = exchangeTimeoutThreshold;

  return when;
};
