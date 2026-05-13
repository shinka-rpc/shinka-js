import type { CommonBus } from "./common";
import type { ClientBus } from "./client";
import type { ServerBus } from "./server";
import type { DataEventKey } from "./types";

type SourceBus = ClientBus | ServerBus;
type DestinationBus = CommonBus | ClientBus;

export const passThroughEvents = (
  source: SourceBus,
  dest: DestinationBus,
  ...keys: DataEventKey[]
) => {
  for (const key of keys)
    source.onDataEvent(key, (data) => dest.event(key, data));
};

export const passThroughRequests = (
  source: SourceBus,
  dest: DestinationBus,
  ...keys: DataEventKey[]
) => {
  for (const key of keys)
    source.onRequest(key, async (data) => await dest.request(key, data));
};
