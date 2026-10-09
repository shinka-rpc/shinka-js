import type { LiMon, LiMonThisArg } from "@shinka-rpc/core";

const { freeze: objectFreeze, assign: objectAssign } = Object;

export type LiMonOpportunisticProps = {
  timeout?: number;
  threshold?: number | null;
};

export const enum OpportunisticLiMonEventKeys {
  EXTERNAL = 0,
}

type LiMonOpportunisticState = {
  ownTimeout: number;
  extTimeout: number | null;
  threshold: number;
  timeoutId: ReturnType<typeof setTimeout> | null;
};

const enum SchedulerAction {
  STOP = 0,
  SEND_ALIVE = 1,
}

export const scheduler = (
  thisArg: LiMonThisArg<any, any, LiMonOpportunisticState>,
) => {
  const actionSet = new Set<SchedulerAction>();
  const when = schedulerCore(actionSet, performance.now(), thisArg);

  for (const action of actionSet) {
    switch (action) {
      case SchedulerAction.STOP:
        return thisArg.bus.stop();
      case SchedulerAction.SEND_ALIVE:
        thisArg.heartbeat();
    }
  }

  if (when !== null)
    thisArg.state.timeoutId = setTimeout(scheduler, when, thisArg);
};

export const schedulerCore = (
  actionSet: Set<SchedulerAction>,
  now: number,
  thisArg: LiMonThisArg<any, any, LiMonOpportunisticState>,
) => {
  const { last } = thisArg;
  const { ownTimeout, extTimeout, threshold } = thisArg.state;
  let when = Number.POSITIVE_INFINITY;

  if (ownTimeout) {
    when = ownTimeout - now + last.received;
    if (when < -threshold) {
      actionSet.add(SchedulerAction.STOP);
      return null;
    }
  }

  if (extTimeout) {
    const externalWhen = extTimeout - now + last.sent - threshold - threshold;
    if (externalWhen < 0) {
      actionSet.add(SchedulerAction.SEND_ALIVE);
    } else if (externalWhen < when) when = externalWhen;
  }

  if (when === Number.POSITIVE_INFINITY) return null;

  if (when < threshold) when = threshold;

  return when;
};

export default ({
  timeout = 15_000,
  threshold = null,
}: LiMonOpportunisticProps = {}) =>
  ((shinkaOn) => {
    shinkaOn.onDataEvent(
      OpportunisticLiMonEventKeys.EXTERNAL,
      (value: number, thisArg) => {
        if (thisArg.state.timeoutId) {
          clearTimeout(thisArg.state.timeoutId);
          thisArg.state.timeoutId = null;
        }
        thisArg.state.extTimeout = value;
        scheduler(thisArg);
      },
    );

    const initialState = objectFreeze({
      timeoutId: null,
      ownTimeout: timeout,
      threshold: threshold || Math.pow(timeout, 0.33),
      extTimeout: null,
    });

    return (thisArg) => {
      objectAssign(thisArg.state, initialState);

      const start = () => {
        if (thisArg.state.timeoutId === null) return;
        scheduler(thisArg);
      };
      const stop = () => {
        if (thisArg.state.timeoutId === null) return;
        clearTimeout(thisArg.state.timeoutId);
        thisArg.state.timeoutId;
      };

      return { start, stop };
    };
  }) as LiMon<any, any, LiMonOpportunisticState>;
