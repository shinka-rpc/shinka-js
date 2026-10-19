import { Client, type TransportClient, type TransportInstance } from "../src";
import testOutScope from "../../outscope/src/tests";
import { ReusablePromise } from "../../concurrency/src";
import { sequence, type Sequence } from "../../util/src";
import { clientListenersKeys } from "./utils-lib";
import { EventListenerType } from "../src/listeners/types";

export const slowTransportClient = (
  initPromise: ReusablePromise<void>,
  closePromise: ReusablePromise<void>,
) =>
  ((shinkaOn) => {
    return async () => {
      await initPromise;
      const send = () => {};
      const close = async () => await closePromise;

      return {
        send,
        close,
        instruction: {},
        context: null,
      } satisfies TransportInstance<any, any>;
    };
  }) satisfies TransportClient<any, any, any, any>;

type ResultEntry = [string, any];
type IndexedResultEntry = [number, ...ResultEntry];
export type Results = IndexedResultEntry[];

const promiseCtlFn = (
  results: Results,
  key: "resolve" | "reject" | "reset",
  payload: any,
  promise: ReusablePromise<void>,
  seq: Sequence,
  value?: any,
) => {
  results.push([seq(), key, payload]);
  promise[key](value);
};

const promiseCtl = (
  results: Results,
  payload: any,
  promise: ReusablePromise<void>,
  seq: Sequence,
) => ({
  resolve: promiseCtlFn.bind(0, results, "resolve", payload, promise, seq),
  reject: promiseCtlFn.bind(0, results, "reject", payload, promise, seq),
  reset: promiseCtlFn.bind(0, results, "reset", payload, promise, seq),
});

const lifecycleCtlFn = async (
  results: Results,
  client: Client<any, any>,
  key: "start" | "stop" | "restart",
  seq: Sequence,
  payload: any,
) => {
  try {
    await client[key]();
    results.push([seq(), `${key}-success`, payload]);
  } catch (e) {
    results.push([seq(), `${key}-fail`, { payload, e }]);
    throw e;
  }
};

const lifecycleCtl = (
  results: Results,
  client: Client<any, any>,
  seq: Sequence,
) => ({
  start: lifecycleCtlFn.bind(0, results, client, "start", seq),
  stop: lifecycleCtlFn.bind(0, results, client, "stop", seq),
  restart: lifecycleCtlFn.bind(0, results, client, "restart", seq),
});

const suiteCtl = (
  results: Results,
  lifecycle: (a: any) => Promise<void>,
  seq: Sequence,
) => {
  const queue: Promise<void>[] = [];
  const q = (a: any) => queue.push(lifecycle(a));
  const all = async (payload: any) => {
    const settled = await Promise.allSettled(queue);
    results.push([seq(), "all", [payload, settled]]);
    queue.length = 0;
  };
  return { q, all };
};

const makeSuite = (
  results: Results,
  lifecycle: ReturnType<typeof lifecycleCtl>,
  seq: Sequence,
) => ({
  start: suiteCtl(results, lifecycle.start, seq),
  stop: suiteCtl(results, lifecycle.stop, seq),
  restart: suiteCtl(results, lifecycle.restart, seq),
});

export const makeClientListener = (
  seq: Sequence,
  results: Results,
  client: Client<any, any>,
  key: EventListenerType,
) =>
  client.addEventListener(key, (_, data) => results.push([seq(), key, data]));

type JournalFor = {
  bus: Results;
  promise: Results;
  lifecycle: Results;
};

type Journal = {
  for: JournalFor;
  merge: () => Results;
};

function mergeJournal(this: JournalFor) {
  const keys = Object.keys(this) as (keyof JournalFor)[];
  const max = keys
    .map((k) => this[k].length)
    .reduce((acc, val) => acc + val, 0);
  const results: Results = Array(max);
  const indexes = Object.fromEntries(keys.map((k) => [k, 0])) as Record<
    keyof JournalFor,
    number
  >;

  for (let i = 0; i < max; i++) {
    for (const { 0: k, 1: v } of Object.entries(indexes)) {
      const record = this[k as keyof JournalFor][v];
      if (!record) {
        delete indexes[k as keyof JournalFor];
        continue;
      }
      if (record[0] === i) {
        results[i] = record;
        indexes[k as keyof JournalFor]++;
        break;
      }
    }
  }

  return results;
}

export const cropSeq = ({ 1: k, 2: v }: IndexedResultEntry) =>
  [k, v] as ResultEntry;

export const makeSlowTransport = () => {
  const seq = sequence();
  const journalFor: JournalFor = {
    bus: [],
    lifecycle: [],
    promise: [],
  };
  const journal: Journal = {
    for: journalFor,
    merge: mergeJournal.bind(journalFor),
  };
  const init = new ReusablePromise<void>();
  const close = new ReusablePromise<void>();
  const { outscope, outscopeState } = testOutScope();

  const promise = {
    init: promiseCtl(journal.for.promise, "init", init, seq),
    close: promiseCtl(journal.for.promise, "close", close, seq),
  };
  const client = new Client({
    outscope,
    transport: slowTransportClient(init, close),
  });
  clientListenersKeys.forEach(
    makeClientListener.bind(0, seq, journal.for.bus, client),
  );
  const lifecycle = lifecycleCtl(journal.for.lifecycle, client, seq);
  const suite = makeSuite(journal.for.lifecycle, lifecycle, seq);
  return { journal, promise, lifecycle, suite, client, outscopeState };
};
