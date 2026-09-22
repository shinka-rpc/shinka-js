import type {
  InternalHandlerThisArg,
  SerializationMode,
  SerializerRoot,
  ShinkaOn,
} from "@shinka-rpc/core";
import { clearObject } from "@shinka-rpc/util";
import { highOrderShinka } from "@shinka-rpc/core";

import type { NestedSerializerOpts, SerializationPair } from "./types";

import makeSerializers from "./serializers";
import makeDeserializers from "./deserializers";
import { compose, construct, nextMime } from "./util";
import { HighOrderRoleRequest, HighOrderRoleEvent } from "./enums";
import { handleThisArg } from "./this-arg";

const { assign: objectAssign } = Object;

export type HighOrderSerializerModeMap = Record<
  SerializationMode,
  SerializationMode
>;

export type HighOrderSerializerProps<SO, SS, ISP> = {
  modeMap: HighOrderSerializerModeMap;
  mimeSubType: string;
  text: SerializationPair<SO, string, SS>;
  bin: SerializationPair<SO, Uint8Array, SS>;
  stop?: (thisArg: InternalHandlerThisArg<any, any, SS>) => void;
  subscribe?: (
    shinkaOn: ShinkaOn<SO, any, InternalHandlerThisArg<SO, any, any>>,
  ) => void;
  initState?: (
    props: ISP | undefined,
    thisArg: InternalHandlerThisArg<any, any, SS>,
  ) => SS | void;
};

export type HighOrder<HOSO, NEXT, ISP> = (
  parent: SerializerRoot<HOSO, any, any>,
  initStateProps: ISP,
) => SerializerRoot<NestedSerializerOpts<HOSO, NEXT>, any, any>;

export default <HOSO, SS extends {} = {}, ISP = any>({
  modeMap,
  text,
  bin,
  mimeSubType,
  stop: nextStop,
  subscribe,
  initState = () => {},
}: HighOrderSerializerProps<HOSO, SS, ISP>) => {
  const serializers = makeSerializers(text.serialize, bin.serialize);
  const deserializers = makeDeserializers(text.deserialize, bin.deserialize);

  return (<NEXT>(
    parent: SerializerRoot<NEXT, any, any>,
    initStateProps?: ISP,
  ) =>
    ((shinkaOn) => {
      const taCache = handleThisArg(shinkaOn);
      const HOSh = highOrderShinka(shinkaOn);

      const { 0: shinkaOnHO, 1: completeShinkaHO } = HOSh(
        HighOrderRoleRequest.HIGH_ORDER,
        HighOrderRoleEvent.HIGH_ORDER,
      );

      const completeTA_HO = taCache(completeShinkaHO);

      const { 0: shinkaOnNext, 1: completeShinkaOnNext } = HOSh(
        HighOrderRoleRequest.NESTED,
        HighOrderRoleEvent.NESTED,
      );

      const completeTA_Next = taCache(completeShinkaOnNext);

      if (subscribe) subscribe(shinkaOnHO);
      const parentSerializerFactory = parent(shinkaOnNext);

      return async (thisArg, opts) => {
        const taHO = completeTA_HO(thisArg);
        const taNext = completeTA_Next(thisArg);

        objectAssign(taHO.state, initState(initStateProps, taHO));

        const maybeSerializerInstance = parentSerializerFactory(taNext, opts);

        const parentInstance =
          maybeSerializerInstance instanceof Promise
            ? await maybeSerializerInstance
            : maybeSerializerInstance;

        const {
          transportInitOpts: prevTransportInitOpts,
          typeHints,
          stop: prevStop,
        } = parentInstance;

        const { mode } = prevTransportInitOpts;

        if (mode === "not-serialized") throw new Error("invalid mode");

        const serialize = construct(
          serializers,
          mode,
          parentInstance,
          "serialize",
          taHO,
        );

        const deserialize = construct(
          deserializers,
          mode,
          parentInstance,
          "deserialize",
          taHO,
        );

        const mime = nextMime(prevTransportInitOpts.mime, mimeSubType);
        const transportInitOpts = { mode: modeMap[mode], mime };
        const callbacks = [];
        if (prevStop) callbacks.push(prevStop);
        if (nextStop) callbacks.push(nextStop.bind(0, thisArg));
        callbacks.push(clearObject.bind(0, taNext.state));
        callbacks.push(clearObject.bind(0, taHO.state));
        const stop = compose(callbacks, thisArg.dispatchError);
        return { serialize, deserialize, transportInitOpts, typeHints, stop };
      };
    }) satisfies SerializerRoot<
      NestedSerializerOpts<HOSO, NEXT>,
      any,
      any
    >) satisfies HighOrder<any, HOSO, ISP>;
};
