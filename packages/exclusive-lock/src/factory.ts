import type { ConsensusProtocol } from "@shinka-rpc/consensus";
import type { ExclusiveLock } from "@shinka-rpc/core";

import { onStart, onStop } from "./lifecycle";
import type { NBThisArgState } from "./types";
import { acquire, on } from "./api";

export type CreateExclusiveLockProps = {
  protocol: ConsensusProtocol;
};

export const createExclusiveLock = ({ protocol }: CreateExclusiveLockProps) =>
  Object.freeze({
    on,
    acquire,
    start: onStart.bind({ protocol }),
    stop: onStop,
  } as ExclusiveLock<any, any, NBThisArgState>);
