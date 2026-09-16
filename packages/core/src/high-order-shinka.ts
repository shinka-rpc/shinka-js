import type {
  DataEventKey,
  Shinka,
  ShinkaOn,
  ShinkaOnRequest,
  ShinkaOnDataEvent,
} from "./shinka";
import { InternalHandlerThisArg } from "./types";

export const highOrderShinka = <
  TA extends InternalHandlerThisArg<any, any, any>,
>(
  shinkaOn: ShinkaOn<any, any, any>,
) => {
  const req = new Map<DataEventKey, ShinkaOnRequest<any, any, TA>>();
  const ev = new Map<DataEventKey, ShinkaOnDataEvent<TA>>();

  return (requestIdentity: DataEventKey, eventIdentity: DataEventKey) => {
    const childShinkaOn = {} as any as ShinkaOn<any, any, TA>;
    const complete = (thisArg: TA) => {
      return { ...thisArg, state: {} } as any;
    };

    return [childShinkaOn, complete] as [
      ShinkaOn<any, any, TA>,
      (thisArg: TA) => TA,
    ];
  };
};
