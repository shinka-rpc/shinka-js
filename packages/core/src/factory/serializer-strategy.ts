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
  VarsLastDataAt,
} from "../types";

const sendData = {
  AsyncFunction:
    <I extends Message<any>, O extends SerializedData, SO, TO>(
      serialize: SerializerFnAsync<I, O, SO>,
      send: (data: O, opts?: TO) => void,
      vars: VarsLastDataAt,
    ) =>
    async (message: I, metadata?: ShinkaMeta<SO, TO>) => {
      const serialized = await serialize(message, metadata?.serialize);
      send(serialized, metadata?.transport);
      vars.lastSendAt = performance.now();
    },
  Function:
    <I extends Message<any>, O extends SerializedData, SO, TO>(
      serialize: SerializerFnSync<I, O, SO>,
      send: (data: O, opts?: TO) => void,
      vars: VarsLastDataAt,
    ) =>
    (message: I, metadata?: ShinkaMeta<SO, TO>) => {
      const serialized = serialize(message, metadata?.serialize);
      send(serialized, metadata?.transport);
      vars.lastSendAt = performance.now();
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
  vars: VarsLastDataAt,
  // @ts-ignore
) => sendData[hint](serialize, send, vars);

// ===
const handleReceived = {
  AsyncFunction:
    <I extends Message<any>, O extends SerializedData>(
      deserialize: DeserializerFnAsync<I, O>,
      dispatch: (data: Message<any>) => void,
      vars: VarsLastDataAt,
    ) =>
    (serialized: O) => {
      vars.lastReceivedAt = performance.now();
      deserialize(serialized).then(dispatch).catch(console.error);
    },
  Function:
    <I extends Message<any>, O extends SerializedData>(
      deserialize: DeserializerFnSync<I, O>,
      dispatch: (data: Message<any>) => void,
      vars: VarsLastDataAt,
    ) =>
    (serialized: O) => {
      vars.lastReceivedAt = performance.now();
      dispatch(deserialize(serialized));
    },
};

export const createOnRawData = <
  I extends Message<any>,
  O extends SerializedData,
>(
  hint: FnConstructorName,
  deserialize: DeserializerFn<I, O>,
  dispatch: (data: Message<any>) => void,
  vars: VarsLastDataAt,
) =>
  handleReceived[hint](
    // @ts-ignore: 2345
    deserialize,
    dispatch,
    vars,
  );
