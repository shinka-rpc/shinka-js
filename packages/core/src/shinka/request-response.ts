import { sequence } from "@shinka-rpc/util";
import { Context } from "./context";

import type {
  REQID,
  RejectResolve,
  DataEventKey,
  MessageRequest,
  MessageDataEvent,
  MessageResponse,
  RequestHandler,
  ShinkaMeta,
  ShinkaVars,
  ShinkaDoRequestMeta,
  MapPop,
  MaybeEventHandler,
  ReqRspRemoteEntryAbort,
  ReqRspRemoteMap,
  ReqRspRemoteEntry,
  ReqRspLocalMap,
  ReqRspLocalEntry,
  DisposeTimeout,
} from "./types";
import type {
  MessageTypeAllRequest,
  MessageTypeAllError,
  MessageTypeAllSuccess,
  MessageTypeAllEvent,
} from "./message-type";
import { AbortFn } from "../types";

const { assign: objectAssign } = Object;

const cleanupRemote = (
  timeout: ReturnType<typeof setTimeout>,
  abortEntry: ReqRspRemoteEntryAbort | undefined,
) => {
  clearTimeout(timeout);
  if (abortEntry) abortEntry[0].removeEventListener("abort", abortEntry[1]);
};

const createOnResponse =
  <SO, TO, TA>(
    remote: ReqRspRemoteMap,
    OK: 0 | 1,
    vars: ShinkaVars<SO, TO, TA>, // late init
  ) =>
  (message: MessageResponse<any>) => {
    const { 1: reqID, 2: body } = message;

    const entry = remote.get(reqID);
    if (!entry) {
      return vars.dispatchError({
        message: "No response handler found",
        reqID,
      });
    }

    remote.delete(reqID);

    const { 0: callbacks, 1: timeout, 2: abort } = entry;
    cleanupRemote(timeout, abort);
    callbacks[OK](body);
  };

const toRemoteEntryAbortPresented = (
  reqID: REQID,
  abort: AbortFn,
  timeout: ReturnType<typeof setTimeout>,
  reject: RejectResolve[0],
  mapPop: MapPop<REQID, ReqRspRemoteEntry>,
  signal: AbortSignal,
) => {
  const abortHandler = () => {
    mapPop(reqID);
    cleanupRemote(timeout, abortEntry);
    abort(reqID, signal.reason);
    reject(signal.reason);
  };
  const abortEntry: ReqRspRemoteEntryAbort = [signal, abortHandler];
  signal.addEventListener("abort", abortHandler);
  return abortEntry;
};

const toRemoteEntryAbort = (
  reqID: REQID,
  abort: AbortFn,
  timeout: ReturnType<typeof setTimeout>,
  reject: RejectResolve[0],
  mapPop: MapPop<REQID, ReqRspRemoteEntry>,
  signal?: AbortSignal,
) =>
  signal &&
  toRemoteEntryAbortPresented(reqID, abort, timeout, reject, mapPop, signal);

function mapPop<K, V>(this: Map<K, V>, key: K) {
  const val = this.get(key);
  this.delete(key);
  return val;
}

export const reqrsp = <SO, TO, TA, B>(
  requestType: MessageTypeAllRequest,
  eventType: MessageTypeAllEvent,
  responseTypes: [MessageTypeAllError, MessageTypeAllSuccess],
  onRequest: RequestHandler<SO, TO, TA, any>,
  getDataEvent: (key: DataEventKey) => MaybeEventHandler<TA, B, void>,
  timeout: number,
) => {
  const remote: ReqRspRemoteMap = new Map();
  const local: ReqRspLocalMap = new Map();
  const remotePop = (mapPop<number, ReqRspRemoteEntry>).bind(remote);
  const localPop = (mapPop<number, ReqRspLocalEntry>).bind(local);

  const vars = {} as any as ShinkaVars<SO, TO, TA>;

  const setVars = (newVars: Partial<ShinkaVars<SO, TO, TA>>) =>
    objectAssign(vars, newVars);

  const onAbort = (reqID: REQID, reason?: any) => {
    local.get(reqID)?.[0].abort(reason);
  };

  const seq = sequence() satisfies () => REQID;

  const onSuccess = createOnResponse(remote, 1, vars);
  const onError = createOnResponse(remote, 0, vars);

  const onTimeoutRemote = (reqID: REQID) => {
    const remoteEntry = remotePop(reqID);
    if (!remoteEntry) return;
    const { 0: callbacks, 1: timeout, 2: abort } = remoteEntry;
    const reason = { message: "Request timeout", reqID };
    cleanupRemote(timeout, abort);
    callbacks[0](reason);
  };

  const request = <T>(
    key: DataEventKey,
    data: any,
    metadata?: ShinkaDoRequestMeta<SO, TO>,
  ) => {
    metadata?.signal?.throwIfAborted();
    const reqID = seq();
    const message: MessageRequest<any> = [requestType, reqID, key, data];
    const { reject, resolve, promise } = Promise.withResolvers<T>();
    const timeoutId = setTimeout(
      onTimeoutRemote,
      metadata?.timeout ?? timeout,
      reqID,
    );
    const entry: ReqRspRemoteEntry = [
      [reject, resolve],
      timeoutId,
      toRemoteEntryAbort(
        reqID,
        vars.abort,
        timeoutId,
        reject,
        remotePop,
        metadata?.signal,
      ),
    ];
    remote.set(reqID, entry);
    vars.send(message, metadata);
    return promise;
  };

  const onMessageRequest = (message: MessageRequest<any>) => {
    const { 1: reqID, 2: key, 3: data } = message;
    const abort = new AbortController();
    const localEntry = [abort, null] as any as ReqRspLocalEntry;
    local.set(reqID, localEntry);
    const ctx = new Context(reqID, vars.send, responseTypes, localPop);
    abort.signal.addEventListener("abort", ctx.abort);
    const dTimeout: DisposeTimeout = (n) => {
      const timeoutId = setTimeout(abort.abort.bind(abort), n ?? timeout);
      localEntry[1] = timeoutId;
      return clearTimeout.bind(0, timeoutId);
    };
    onRequest(
      key,
      data,
      ctx,
      vars.thisArg,
      vars.dispatchError,
      abort.signal,
      dTimeout,
    );
  };

  const dispatchEvent = (message: MessageDataEvent<any>) => {
    const { 1: body, 2: key } = message;
    const cb = getDataEvent(key);
    if (!cb) return vars.dispatchError({ type: "no event handler", key });
    cb(body, vars.thisArg, vars.dispatchError);
  };

  const eventSend = (
    key: DataEventKey,
    data: any,
    metadata?: ShinkaMeta<SO, TO>,
  ) => {
    const message: MessageDataEvent<any> = [eventType, data, key];
    vars.send!(message, metadata);
  };

  return [
    onAbort,
    setVars,
    request,
    onSuccess,
    onError,
    onMessageRequest,
    dispatchEvent,
    eventSend,
  ] as [
    AbortFn,
    typeof setVars,
    typeof request,
    typeof onSuccess,
    typeof onError,
    typeof onMessageRequest,
    typeof dispatchEvent,
    typeof eventSend,
  ];
};
