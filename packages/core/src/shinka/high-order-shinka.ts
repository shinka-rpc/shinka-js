import type {
  DataEventKey,
  ShinkaOn,
  Shinka,
  ShinkaMeta,
  ShinkaDoDataEvent,
  ShinkaDoRequest,
} from "./types";
import {
  createHOReqRegistry,
  createHOEventRegistry,
} from "./high-order-registry";
import { asOnRequest } from "./util";

const { freeze: objectFreeze } = Object;

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

const nestedDataEvent = (
  eventIdentity: DataEventKey,
  dataEvent: ShinkaDoDataEvent<any, any>,
) =>
  ((key: DataEventKey, data: any, metadata?: ShinkaMeta<any, any>) =>
    dataEvent(
      eventIdentity,
      [key, data],
      metadata,
    )) satisfies ShinkaDoDataEvent<any, any>;

const nestedRequest = (
  requestIdentity: DataEventKey,
  request: ShinkaDoRequest<any, any>,
) =>
  ((key: DataEventKey, data: any, metadata?: ShinkaMeta<any, any>) =>
    request(requestIdentity, [key, data], metadata)) satisfies ShinkaDoRequest<
    any,
    any
  >;

export const highOrderShinka =
  ({
    onRequest: rootOnRequest,
    onDataEvent: rootOnDataEvent,
  }: ShinkaOn<any, any, any>) =>
  (requestIdentity: DataEventKey, eventIdentity: DataEventKey) => {
    const { reqGet, evGet, onDataEvent, onRequest } =
      createHOHandlerRegistries();

    const childShinkaOn: ShinkaOn<any, any, any> = objectFreeze({
      onDataEvent,
      onRequest,
    });

    const taMap = new WeakMap<any, any>();

    rootOnRequest(
      requestIdentity,
      async ({ 0: key, 1: data }, thisArg) => {
        const handler = reqGet(key);
        if (handler) return await handler(data, taMap.get(thisArg));
        throw thisArg.dispatchError(`Unable to find handler ${key}`);
      },
      { hint: "AsyncFunction" },
    );

    rootOnDataEvent(eventIdentity, ({ 0: key, 1: data }, thisArg) => {
      const handler = evGet(key);
      handler
        ? handler(data, taMap.get(thisArg))
        : thisArg.dispatchError(`Unable to find handler ${key}`);
    });

    const associateThisArg = taMap.set.bind(taMap);

    const wrap = ({
      dataEvent: completeDataEvent,
      request: completeRequest,
    }: Shinka<any, any, any>) => {
      const dataEvent = nestedDataEvent(eventIdentity, completeDataEvent);
      const request = nestedRequest(requestIdentity, completeRequest);
      return objectFreeze({
        dataEvent,
        request,
        onDataEvent,
        onRequest,
      }) satisfies Shinka<any, any, any>;
    };

    return [childShinkaOn, associateThisArg, wrap] as [
      ShinkaOn<any, any, any>,
      (parentThisArg: any, childThisArg: any) => void,
      (shinka: Shinka<any, any, any>) => Shinka<any, any, any>,
    ];
  };
