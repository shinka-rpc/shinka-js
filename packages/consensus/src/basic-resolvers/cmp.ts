import { Consensus } from "../constants";
import type { Resolver } from "../types";

export const cmpResolver: Resolver = (a, b) =>
  a === b ? Consensus.UNKNOWN : a < b ? Consensus.LOSE : Consensus.WON;
