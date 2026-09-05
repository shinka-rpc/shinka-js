import type { SerializerRoot } from "@shinka-rpc/core";
import type { HighOrderSerializerProps, NestedSerializerOpts } from "./types";

import makeSerializers from "./serializers";
import makeDeserializers from "./deserializers";
import { composeStop, construct, nextMime } from "./util";

const { assign: objectAssign } = Object;

const highOrder = <CURR, NEXT, SS extends {} = {}, ISP = undefined>({
  mode: nextMode,
  text,
  bin,
  mimeSubType,
  stop: nextStop,
  initState = () => {},
}: HighOrderSerializerProps<CURR, SS, ISP>) => {
  const serializers = makeSerializers(text.serialize, bin.serialize);
  const deserializers = makeDeserializers(text.deserialize, bin.deserialize);

  return (parent: SerializerRoot<CURR, any, any>, initStateProps: ISP) =>
    ((shinkaOn) => {
      const parentSerializerFactory = parent(shinkaOn);

      return async (thisArg, opts) => {
        objectAssign(thisArg.state, initState(initStateProps, thisArg));
        const maybeSerializerInstance = parentSerializerFactory(thisArg, opts);

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
          thisArg,
        );

        const deserialize = construct(
          deserializers,
          mode,
          parentInstance,
          "deserialize",
          thisArg,
        );

        const mime = nextMime(prevTransportInitOpts.mime, mimeSubType);
        const transportInitOpts = { mode: nextMode, mime };
        const stop = composeStop(thisArg, prevStop, nextStop);
        return { serialize, deserialize, transportInitOpts, typeHints, stop };
      };
    }) satisfies SerializerRoot<NestedSerializerOpts<CURR, NEXT>, any, any>;
};

export default highOrder;

export type HighOrder<
  CURR,
  NEXT,
  SS extends {} = {},
  ISP = undefined,
> = ReturnType<typeof highOrder<CURR, NEXT, SS, ISP>>;
