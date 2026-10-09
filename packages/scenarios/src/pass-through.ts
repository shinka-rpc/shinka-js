import type {
  DataEventKey,
  ShinkaOn,
  ShinkaDo,
  ShinkaMeta,
} from "@shinka-rpc/core";

type SourceBus<SO, TO> = ShinkaOn<SO, TO, ShinkaDo<SO, TO>>;
type DestinationBus<SO, TO> = ShinkaDo<SO, TO>;

export const passThroughEvent = <SO, TO>(
  source: SourceBus<SO, TO>,
  dest: DestinationBus<SO, TO>,
  metadata: ShinkaMeta<SO, TO> | undefined,
  key: DataEventKey,
) => source.onDataEvent(key, (data) => dest.dataEvent(key, data, metadata));

export const passThroughEvents = <SO, TO>(
  source: SourceBus<SO, TO>,
  dest: DestinationBus<SO, TO>,
  metadata: ShinkaMeta<SO, TO> | undefined,
  keys: DataEventKey[],
) => {
  for (const key of keys) passThroughEvent(source, dest, metadata, key);
};

export const passThroughRequest = <SO, TO>(
  source: SourceBus<SO, TO>,
  dest: DestinationBus<SO, TO>,
  metadata: ShinkaMeta<SO, TO> | undefined,
  key: DataEventKey,
) =>
  source.onRequest(key, async (data) => await dest.request(key, data), {
    ...metadata,
    hint: "AsyncFunction",
  });

export const passThroughRequests = <SO, TO>(
  source: SourceBus<SO, TO>,
  dest: DestinationBus<SO, TO>,
  metadata: ShinkaMeta<SO, TO> | undefined,
  keys: DataEventKey[],
) => {
  for (const key of keys) passThroughRequest(source, dest, metadata, key);
};
