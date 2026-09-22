import type { DataEventKey, ShinkaOn, Shinka, ShinkaMeta } from "./types";
import {
  createHOReqRegistry,
  createHOEventRegistry,
} from "./high-order-registry";
import { asOnRequest } from "./util";

const { assign: objectAssign, freeze: objectFreeze } = Object;

const createHOHandlerRegistries = <SO, TO, TA>() => {
  const { 0: reqGet, 1: reqSet } = createHOReqRegistry<SO, TO, TA, any, any>();
  const { 0: evGet, 1: onDataEvent } = createHOEventRegistry<TA, any>();
  const onRequest = asOnRequest(reqSet);
  return objectFreeze({
    evGet,
    reqGet,
    onRequest,
    onDataEvent,
  }) satisfies ShinkaOn<SO, TO, TA>;
};

export const highOrderShinka = ({
  onDataEvent: rootOnDataEvent,
  onRequest: rootOnRequest,
}: ShinkaOn<any, any, any>) => {
  const { reqGet, evGet, onDataEvent, onRequest } = createHOHandlerRegistries();

  const childShinkaOn: ShinkaOn<any, any, any> = objectAssign({
    onDataEvent,
    onRequest,
  });

  return (requestIdentity: DataEventKey, eventIdentity: DataEventKey) => {
    rootOnRequest(
      requestIdentity,
      async ({ 0: key, 1: data }, thisArg) => {
        const handler = reqGet(key);
        if (handler) return await handler(data, thisArg);
        throw thisArg.dispatchError(`Unable to find handler ${key}`);
      },
      { hint: "AsyncFunction" },
    );

    rootOnDataEvent(eventIdentity, ({ 0: key, 1: data }, thisArg) => {
      const handler = evGet(key);
      handler
        ? handler(data, thisArg)
        : thisArg.dispatchError(`Unable to find handler ${key}`);
    });

    const complete = ({
      dataEvent: completeDataEvent,
      onDataEvent: completeOnDataEvent,
      onRequest: completeOnRequest,
      request: completeRequest,
    }: Shinka<any, any, any>) => {
      const dataEvent = (
        key: DataEventKey,
        data: any,
        metadata?: ShinkaMeta<any, any>,
        // FIXME: metadata handling looks wrong
      ) => completeDataEvent(eventIdentity, [key, data], metadata);

      const request = async (
        key: DataEventKey,
        data: any,
        metadata?: ShinkaMeta<any, any>,
        // FIXME: metadata handling looks wrong
      ) => await completeRequest(requestIdentity, [key, data], metadata);

      return objectFreeze({
        dataEvent,
        request,
        onDataEvent: completeOnDataEvent,
        onRequest: completeOnRequest,
      });
    };

    return [childShinkaOn, complete] as [
      ShinkaOn<any, any, any>,
      (shinka: Shinka<any, any, any>) => Shinka<any, any, any>,
    ];
  };
};
