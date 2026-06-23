import type {
  SerializerFnSync,
  SerializerFnAsync,
  SerializerFn,
  SerializedData,
  DeserializerFn,
  DeserializerFnSync,
  DeserializerFnAsync,
  Message,
  ShinkaMeta,
  FnConstructorName,
  LastDataAt,
} from "../types";

const sendData = {
  AsyncFunction:
    <I extends Message<any>, O extends SerializedData, SO, TO>(
      serialize: SerializerFnAsync<I, O, SO>,
      send: (data: O, opts?: TO) => void,
      dispatchError: (error: any) => void,
      last: LastDataAt,
    ) =>
    async (message: I, metadata?: ShinkaMeta<SO, TO>) => {
      try {
        const serialized = await serialize(message, metadata?.serialize);
        send(serialized, metadata?.transport);
        last.sent = performance.now();
      } catch (e) {
        dispatchError(e);
      }
    },
  Function:
    <I extends Message<any>, O extends SerializedData, SO, TO>(
      serialize: SerializerFnSync<I, O, SO>,
      send: (data: O, opts?: TO) => void,
      dispatchError: (error: any) => void,
      last: LastDataAt,
    ) =>
    (message: I, metadata?: ShinkaMeta<SO, TO>) => {
      try {
        const serialized = serialize(message, metadata?.serialize);
        send(serialized, metadata?.transport);
        last.sent = performance.now();
      } catch (e) {
        dispatchError(e);
      }
    },
};

export const createSendData = <
  I extends Message<any>,
  O extends SerializedData,
  SO,
  TO,
>(
  hint: FnConstructorName,
  serialize: SerializerFn<I, O, SO>,
  send: (data: O, opts?: TO) => void,
  dispatchError: (error: any) => void,
  last: LastDataAt,
  // @ts-ignore
) => sendData[hint](serialize, send, dispatchError, last);

// ===
const handleReceived = {
  AsyncFunction:
    <I extends Message<any>, O extends SerializedData>(
      deserialize: DeserializerFnAsync<I, O>,
      dispatch: (data: Message<any>) => void,
      dispatchError: (error: any) => void,
      last: LastDataAt,
    ) =>
    (serialized: O) => {
      last.received = performance.now();
      deserialize(serialized).then(dispatch).catch(dispatchError);
    },
  Function:
    <I extends Message<any>, O extends SerializedData>(
      deserialize: DeserializerFnSync<I, O>,
      dispatch: (data: Message<any>) => void,
      dispatchError: (error: any) => void,
      last: LastDataAt,
    ) =>
    (serialized: O) => {
      last.received = performance.now();
      try {
        dispatch(deserialize(serialized));
      } catch (e) {
        dispatchError(e);
      }
    },
};

export const createOnRawData = <
  I extends Message<any>,
  O extends SerializedData,
>(
  hint: FnConstructorName,
  deserialize: DeserializerFn<I, O>,
  dispatch: (data: Message<any>) => void,
  dispatchError: (error: any) => void,
  last: LastDataAt,
) =>
  handleReceived[hint](
    // @ts-ignore: 2345
    deserialize,
    dispatch,
    dispatchError,
    last,
  );
