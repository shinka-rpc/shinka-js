import type { FIFO } from "@shinka-rpc/collections";
import type { Message, NB_FIFOEntry, ShinkaMeta } from "../types";

export const clearState = (state: any) => () => {
  for (const k of Object.keys(state)) delete state[k];
};

export const createFIFOPush =
  <SO, TO>(fifo: FIFO<NB_FIFOEntry<SO, TO>>) =>
  (message: Message<any>, metadata?: ShinkaMeta<SO, TO>) =>
    fifo.push([message, metadata]);
