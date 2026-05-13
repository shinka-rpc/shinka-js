import type {
  SerializerFnSync,
  SerializerFnAsync,
  SerializerFn,
  SerializedData,
  DeserializerFn,
  DeserializerFnSync,
  DeserializerFnAsync,
  Message,
  ShinkaMetaGeneric,
  FnConstructorName,
} from "../types";

const sendData = {
  AsyncFunction:
    <I extends Message<any>, O extends SerializedData, SO, TO>(
      serialize: SerializerFnAsync<I, O, SO>,
      send: (data: O, opts?: TO) => void,
    ) =>
    async (message: I, metadata?: ShinkaMetaGeneric<SO, TO>) => {
      const serialized = await serialize(message, metadata?.serialize);
      send(serialized, metadata?.transport);
    },
  Function:
    <I extends Message<any>, O extends SerializedData, SO, TO>(
      serialize: SerializerFnSync<I, O, SO>,
      send: (data: O, opts?: TO) => void,
    ) =>
    (message: I, metadata?: ShinkaMetaGeneric<SO, TO>) => {
      const serialized = serialize(message, metadata?.serialize);
      send(serialized, metadata?.transport);
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
  // @ts-ignore
) => sendData[hint](serialize, send);

// ===
const handleReceived = {
  AsyncFunction:
    <I extends Message<any>, O extends SerializedData>(
      deserialize: DeserializerFnAsync<I, O>,
      dispatch: (data: Message<any>) => void,
    ) =>
    (serialized: O) =>
      deserialize(serialized).then(dispatch),
  Function:
    <I extends Message<any>, O extends SerializedData>(
      deserialize: DeserializerFnSync<I, O>,
      dispatch: (data: Message<any>) => void,
    ) =>
    (serialized: O) =>
      dispatch(deserialize(serialized)),
};

export const createHandleReceived = <
  I extends Message<any>,
  O extends SerializedData,
>(
  hint: FnConstructorName,
  deserialize: DeserializerFn<I, O>,
  dispatch: (data: Message<any>) => void,
) =>
  handleReceived[hint](
    // @ts-ignore
    deserialize,
    dispatch,
  );
