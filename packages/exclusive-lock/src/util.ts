import type { NBSetSendFn, NBThisArgSetVars } from "@shinka-rpc/core";

export const varSet = (
  names: Iterable<keyof NBThisArgSetVars<any, any, any>>,
  setVars: NBThisArgSetVars<any, any, any>,
  newVar: NBSetSendFn<any, any>,
) => {
  for (const name of names) {
    const cb = setVars[name];
    if (cb) cb(newVar);
  }
};
