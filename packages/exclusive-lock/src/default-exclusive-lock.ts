import {
  createProtocol,
  defaultResolver,
  randInt32,
} from "@shinka-rpc/consensus";
import { createExclusiveLock } from "./factory";

export const defaultExclusiveLock = createExclusiveLock({
  protocol: createProtocol({
    randInt32,
    nonceLength: 8,
    resolver: defaultResolver,
  }),
});
