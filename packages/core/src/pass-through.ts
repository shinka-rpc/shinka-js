import type { CommonBus } from "./common";
import type { ClientBus } from "./client";
import type { ServerBus } from "./server";
import type { DataEventKey } from "./types";

type SourceBus = ClientBus | ServerBus;
type DestinationBus = CommonBus | ClientBus;

export const passThroughEvent = (
  source: SourceBus,
  dest: DestinationBus,
  key: DataEventKey,
) => source.onDataEvent(key, (data) => dest.event(key, data));

export const passThroughRequest = (
  source: SourceBus,
  dest: DestinationBus,
  key: DataEventKey,
) => source.onRequest(key, async (data) => await dest.request(key, data));
