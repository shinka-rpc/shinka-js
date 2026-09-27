import type { SerializerRoot } from "@shinka-rpc/core";
import { clearObject } from "@shinka-rpc/util";
import { highOrderShinka } from "@shinka-rpc/core";

import type { NestedSerializerOpts, HighOrderSerializerProps } from "./types";

import makeSerializers from "./serializers";
import makeDeserializers from "./deserializers";
import { compose, construct, nextMime } from "./util";
import { HighOrderRoleRequest, HighOrderRoleEvent } from "./enums";
import ta from "./this-arg";

const { assign: objectAssign } = Object;

export type HighOrder<HOSO, NEXT, ISP> = (
  parent: SerializerRoot<HOSO, any, any>,
  initStateProps: ISP,
) => SerializerRoot<NestedSerializerOpts<HOSO, NEXT>, any, any>;

export default <HOSO, SS extends {} = {}, ISP = any>({
  modeMap,
  text,
  bin,
  mimeSubType,
  stop: HOStop,
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
      const HOSh = highOrderShinka(shinkaOn);

      const {
        0: shinkaOnHO,
        1: associateThisArgHO,
        2: wrapShinkaHO,
      } = HOSh(HighOrderRoleRequest.HIGH_ORDER, HighOrderRoleEvent.HIGH_ORDER);

      const buildTA_HO = ta(wrapShinkaHO);

      const {
        0: shinkaOnNext,
        1: associateThisArgNext,
        2: wrapShinkaOnNext,
      } = HOSh(HighOrderRoleRequest.NESTED, HighOrderRoleEvent.NESTED);

      const buildTA_Next = ta(wrapShinkaOnNext);

      if (subscribe) subscribe(shinkaOnHO);
      const parentSerializerFactory = parent(shinkaOnNext);

      return async (thisArg, opts) => {
        const taHO = buildTA_HO(thisArg);
        const taNext = buildTA_Next(thisArg);

        associateThisArgHO(thisArg, taHO);
        associateThisArgNext(thisArg, taNext);

        objectAssign(taHO.state, initState(initStateProps, taHO));

        const maybeSerializerInstance = parentSerializerFactory(taNext, opts);

        const parentInstance =
          maybeSerializerInstance instanceof Promise
            ? await maybeSerializerInstance
            : maybeSerializerInstance;

        const {
          transportInitOpts: prevTransportInitOpts,
          typeHints,
          stop: nextStop,
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
        if (nextStop) callbacks.push(nextStop);
        if (HOStop) callbacks.push(HOStop.bind(0, thisArg));
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
