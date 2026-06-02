import type { DataEventKey, ShinkaOn, ShinkaDo, ShinkaMeta } from "./types";

type SourceBus<SO, TO> = ShinkaOn<SO, TO, ShinkaDo<SO, TO>>;
type DestinationBus<SO, TO> = ShinkaDo<SO, TO>;

export const passThroughEvents = <SO, TO>(
  source: SourceBus<SO, TO>,
  dest: DestinationBus<SO, TO>,
  metadata: ShinkaMeta<SO, TO> | undefined,
  keys: DataEventKey[],
) => {
  for (const key of keys)
    source.onDataEvent(key, (data) => dest.dataEvent(key, data, metadata));
};

export const passThroughRequests = <SO, TO>(
  source: SourceBus<SO, TO>,
  dest: DestinationBus<SO, TO>,
  metadata: ShinkaMeta<SO, TO> | undefined,
  keys: DataEventKey[],
) => {
  for (const key of keys)
    source.onRequest(key, async (data) => await dest.request(key, data), {
      ...metadata,
      hint: "AsyncFunction",
    });
};
