import { type NBThisArgSetVars, NBAcquire } from "@shinka-rpc/core";
import { ActKey, AnyNBThisArg } from "./types";
import { varSet } from "./util";

const acquireKeySet = new Set<keyof NBThisArgSetVars<any, any, any>>([
  "user",
  "bus",
  "transport",
  "serializer",
  "limon",
  // "nb",
]);

const acquireTargetMap = new Map<
  NBAcquire,
  keyof NBThisArgSetVars<any, any, any>
>([
  [NBAcquire.BUS, "bus"],
  [NBAcquire.SERIALIZER, "serializer"],
  [NBAcquire.TRANSPORT, "transport"],
  [NBAcquire.LIMON, "limon"],
  [NBAcquire.NB, "nb"],
  [NBAcquire.USER, "user"],
]);

const acquireKeysFor = (key: keyof NBThisArgSetVars<any, any, any>) => {
  const otherSet = new Set(acquireKeySet);
  otherSet.delete(key);
  return otherSet;
};

const acquireTargets = (() => {
  const targets = new Map<
    NBAcquire,
    Set<keyof NBThisArgSetVars<any, any, any>>
  >();
  for (const { 0: key, 1: val } of acquireTargetMap.entries())
    targets.set(key, acquireKeysFor(val));
  return targets;
})();

const acquireTransition = (() => {
  const transitions = new Map<
    NBAcquire,
    Map<
      NBAcquire,
      [
        Set<keyof NBThisArgSetVars<any, any, any>>,
        Set<keyof NBThisArgSetVars<any, any, any>>,
      ]
    >
  >();

  for (const { 0: k1, 1: s1 } of acquireTargets.entries()) {
    const diffMap = new Map<
      NBAcquire,
      [
        Set<keyof NBThisArgSetVars<any, any, any>>,
        Set<keyof NBThisArgSetVars<any, any, any>>,
      ]
    >();
    transitions.set(k1, diffMap);
    for (const { 0: k2, 1: s2 } of acquireTargets.entries())
      diffMap.set(k2, [s1.difference(s2), s2.difference(s1)]);
  }

  return transitions;
})();

export const apply = (
  thisArg: AnyNBThisArg,
  target: NBAcquire,
  key: ActKey,
) => {
  const {
    vars: { set: setVars, val },
  } = thisArg;
  const acquireTargetSet = acquireTargets.get(target)!;
  const variable = val[key];
  varSet(acquireTargetSet, setVars, variable);
};

export const transition = (
  thisArg: AnyNBThisArg,
  source: NBAcquire,
  target: NBAcquire,
) => {
  const {
    vars: {
      set: setVars,
      val: { release: releaseVar, lock: lockVar },
    },
  } = thisArg;

  const { 0: acquireTargetSet, 1: releaseTargetSet } = acquireTransition
    .get(target)!
    .get(source)!;

  if (acquireTargetSet.size) varSet(acquireTargetSet, setVars, lockVar);
  if (releaseTargetSet.size) varSet(releaseTargetSet, setVars, releaseVar);
};
