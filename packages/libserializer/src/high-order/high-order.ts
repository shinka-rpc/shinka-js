import type {
  InternalHandlerThisArg,
  SerializationMode,
  SerializerRoot,
} from "@shinka-rpc/core";
import type { NestedSerializerOpts, SerializationPair } from "./types";

import makeSerializers from "./serializers";
import makeDeserializers from "./deserializers";
import { composeStop, construct, nextMime } from "./util";

const { assign: objectAssign } = Object;

export type HighOrderSerializerModeMap = Record<
  SerializationMode,
  SerializationMode
>;

export type HighOrderSerializerProps<SO, SS, ISP = undefined> = {
  modeMap: HighOrderSerializerModeMap;
  mimeSubType: string;
  text: SerializationPair<SO, string, SS>;
  bin: SerializationPair<SO, Uint8Array, SS>;
  stop?: (thisArg: InternalHandlerThisArg<any, any, SS>) => void;
  initState?: (
    props: ISP,
    thisArg: InternalHandlerThisArg<any, any, SS>,
  ) => SS | void;
};

export type HighOrder<CURR, NEXT, ISP = undefined> = (
  parent: SerializerRoot<CURR, any, any>,
  initStateProps: ISP,
) => SerializerRoot<NestedSerializerOpts<CURR, NEXT>, any, any>;

export default <CURR, NEXT, SS extends {} = {}, ISP = undefined>({
  modeMap,
  text,
  bin,
  mimeSubType,
  stop: nextStop,
  initState = () => {},
}: HighOrderSerializerProps<CURR, SS, ISP>): HighOrder<CURR, NEXT, ISP> => {
  const serializers = makeSerializers(text.serialize, bin.serialize);
  const deserializers = makeDeserializers(text.deserialize, bin.deserialize);

  return (parent: SerializerRoot<CURR, any, any>, initStateProps: ISP) =>
    ((shinkaOn) => {
      const parentSerializerFactory = parent(shinkaOn as any);

      return async (thisArg, opts) => {
        objectAssign(thisArg.state, initState(initStateProps, thisArg));
        const maybeSerializerInstance = parentSerializerFactory(
          thisArg as any,
          opts,
        );

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
        const transportInitOpts = { mode: modeMap[mode], mime };
        const stop = composeStop(thisArg, prevStop, nextStop);
        return { serialize, deserialize, transportInitOpts, typeHints, stop };
      };
    }) satisfies SerializerRoot<NestedSerializerOpts<CURR, NEXT>, any, any>;
};
