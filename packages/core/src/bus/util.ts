import type { IQueue } from "@shinka-rpc/collections";
import type { Message, NB_FIFOEntry, ShinkaMeta } from "../types";

export const clearState = (state: any) => () => {
  for (const k of Object.keys(state)) delete state[k];
};

export const createFIFOPush =
  <SO, TO>(q: IQueue<NB_FIFOEntry<SO, TO>>) =>
  (message: Message<any>, metadata?: ShinkaMeta<SO, TO>) =>
    q.push([message, metadata]);
