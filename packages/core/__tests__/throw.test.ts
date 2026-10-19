import { expect, test } from "@jest/globals";
import {
  doClientTest,
  ThrowClientTransport,
  ThrowSerializer,
  ThrowLimon,
  ThrowOutScope,
} from "./utils-throw";

// =============================================================================
// test order equals bus init order

// start

test("throw-client-serializer-init", async () => {
  const { results, runner, props, counters } = doClientTest(
    [],
    [ThrowSerializer.INIT],
    [],
    [],
  );
  await runner();
  props.serializer.o.clear();
  await runner();
  expect(results).toStrictEqual([
    ["connecting", null],
    ["error", "SERIALIZER_INIT"],
    ["disconnected", null],
    ["caught_start", "SERIALIZER_INIT"],
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["disconnected", null],
  ]);
  expect(counters).toStrictEqual({
    serializer: { init: 2, ready: 1, stop: 1 },
    transport: { init: 1, ready: 1, close: 1 },
    limon: { init: 1, start: 1, stop: 1 },
    outscope: { add: 1, remove: 1 },
  });
});

test("throw-client-transport-init", async () => {
  const { results, runner, props, counters } = doClientTest(
    [ThrowClientTransport.INIT],
    [],
    [],
    [],
  );
  await runner();
  props.transport.o.clear();
  await runner();
  expect(results).toStrictEqual([
    ["connecting", null],
    ["error", "TRANSPORT_INIT"],
    ["disconnected", null],
    ["caught_start", "TRANSPORT_INIT"],
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["disconnected", null],
  ]);
  expect(counters).toStrictEqual({
    serializer: { init: 2, ready: 1, stop: 2 },
    transport: { init: 2, ready: 1, close: 1 },
    limon: { init: 1, start: 1, stop: 1 },
    outscope: { add: 1, remove: 1 },
  });
});

test("throw-client-transport-ready", async () => {
  const { results, runner, props, counters } = doClientTest(
    [ThrowClientTransport.READY],
    [],
    [],
    [],
  );
  await runner();
  props.transport.o.clear();
  await runner();
  expect(results).toStrictEqual([
    ["connecting", null],
    ["error", "TRANSPORT_READY"],
    ["disconnected", null],
    ["caught_start", "TRANSPORT_READY"],
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["disconnected", null],
  ]);
  expect(counters).toStrictEqual({
    serializer: { init: 2, ready: 1, stop: 2 },
    transport: { init: 2, ready: 2, close: 2 },
    limon: { init: 1, start: 1, stop: 1 },
    outscope: { add: 1, remove: 1 },
  });
});

test("throw-client-transport-ready-async", async () => {
  const { results, runner, props, counters } = doClientTest(
    [ThrowClientTransport.READY],
    [],
    [],
    [],
    { transport: { onReady: "async" } },
  );
  await runner();
  props.transport.o.clear();
  await runner();
  expect(results).toStrictEqual([
    ["connecting", null],
    ["error", "TRANSPORT_READY_ASYNC"],
    ["disconnected", null],
    ["caught_start", "TRANSPORT_READY_ASYNC"],
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["disconnected", null],
  ]);
  expect(counters).toStrictEqual({
    serializer: { init: 2, ready: 1, stop: 2 },
    transport: { init: 2, ready: 2, close: 2 },
    limon: { init: 1, start: 1, stop: 1 },
    outscope: { add: 1, remove: 1 },
  });
});

test("throw-client-serializer-ready", async () => {
  const { results, runner, props, counters } = doClientTest(
    [],
    [ThrowSerializer.READY],
    [],
    [],
  );
  await runner();
  props.serializer.o.clear();
  await runner();
  expect(results).toStrictEqual([
    ["connecting", null],
    ["error", "SERIALIZER_READY"],
    ["disconnected", null],
    ["caught_start", "SERIALIZER_READY"],
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["disconnected", null],
  ]);
  expect(counters).toStrictEqual({
    serializer: { init: 2, ready: 2, stop: 2 },
    transport: { init: 2, ready: 2, close: 2 },
    limon: { init: 1, start: 1, stop: 1 },
    outscope: { add: 1, remove: 1 },
  });
});

test("throw-client-serializer-ready-async", async () => {
  const { results, runner, props, counters } = doClientTest(
    [],
    [ThrowSerializer.READY],
    [],
    [],
    { serializer: { onReady: "async" } },
  );
  await runner();
  props.serializer.o.clear();
  await runner();
  expect(results).toStrictEqual([
    ["connecting", null],
    ["error", "SERIALIZER_READY_ASYNC"],
    ["disconnected", null],
    ["caught_start", "SERIALIZER_READY_ASYNC"],
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["disconnected", null],
  ]);
  expect(counters).toStrictEqual({
    serializer: { init: 2, ready: 2, stop: 2 },
    transport: { init: 2, ready: 2, close: 2 },
    limon: { init: 1, start: 1, stop: 1 },
    outscope: { add: 1, remove: 1 },
  });
});

test("throw-client-limon-init", async () => {
  const { results, runner, props, counters } = doClientTest(
    [],
    [],
    [ThrowLimon.INIT],
    [],
  );
  await runner();
  props.limon.o.clear();
  await runner();
  expect(results).toStrictEqual([
    ["connecting", null],
    ["error", "LIMON_INIT"],
    ["disconnected", null],
    ["caught_start", "LIMON_INIT"],
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["disconnected", null],
  ]);
  expect(counters).toStrictEqual({
    serializer: { init: 2, ready: 2, stop: 2 },
    transport: { init: 2, ready: 2, close: 2 },
    limon: { init: 2, start: 1, stop: 1 },
    outscope: { add: 1, remove: 1 },
  });
});

test("throw-client-limon-start", async () => {
  const { results, runner, props, counters } = doClientTest(
    [],
    [],
    [ThrowLimon.START],
    [],
  );
  await runner();
  props.limon.o.clear();
  await runner();
  expect(results).toStrictEqual([
    ["connecting", null],
    ["error", "LIMON_START"],
    ["disconnected", null],
    ["caught_start", "LIMON_START"],
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["disconnected", null],
  ]);
  expect(counters).toStrictEqual({
    serializer: { init: 2, ready: 2, stop: 2 },
    transport: { init: 2, ready: 2, close: 2 },
    limon: { init: 2, start: 2, stop: 2 },
    outscope: { add: 1, remove: 1 },
  });
});

test("throw-client-outscope-add", async () => {
  const { results, runner, props, counters } = doClientTest(
    [],
    [],
    [],
    [ThrowOutScope.ADD],
  );
  await runner();
  props.outscope.o.clear();
  await runner();
  expect(results).toStrictEqual([
    ["connecting", null],
    ["error", "OUTSCOPE_ADD"],
    ["disconnected", null],
    ["caught_start", "OUTSCOPE_ADD"],
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["disconnected", null],
  ]);
  expect(counters).toStrictEqual({
    transport: { init: 2, ready: 2, close: 2 },
    serializer: { init: 2, ready: 2, stop: 2 },
    limon: { init: 2, start: 2, stop: 2 },
    outscope: { add: 2, remove: 2 },
  });
});

// stop

test("throw-client-transport-close", async () => {
  const { results, runner, props, counters } = doClientTest(
    [ThrowClientTransport.CLOSE],
    [],
    [],
    [],
  );
  await runner();
  props.transport.o.clear();
  await runner();
  expect(results).toStrictEqual([
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["error", "TRANSPORT_CLOSE"],
    ["disconnected", null],
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["disconnected", null],
  ]);
  expect(counters).toStrictEqual({
    transport: { init: 2, ready: 2, close: 2 },
    serializer: { init: 2, ready: 2, stop: 2 },
    limon: { init: 2, start: 2, stop: 2 },
    outscope: { add: 2, remove: 2 },
  });
});

test("throw-client-serializer-stop", async () => {
  const { results, runner, props, counters } = doClientTest(
    [],
    [ThrowSerializer.STOP],
    [],
    [],
  );
  await runner();
  props.serializer.o.clear();
  await runner();
  expect(results).toStrictEqual([
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["error", "SERIALIZER_STOP"],
    ["disconnected", null],
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["disconnected", null],
  ]);
  expect(counters).toStrictEqual({
    transport: { init: 2, ready: 2, close: 2 },
    serializer: { init: 2, ready: 2, stop: 2 },
    limon: { init: 2, start: 2, stop: 2 },
    outscope: { add: 2, remove: 2 },
  });
});

test("throw-client-limon-stop", async () => {
  const { results, runner, props, counters } = doClientTest(
    [],
    [],
    [ThrowLimon.STOP],
    [],
  );
  await runner();
  props.limon.o.clear();
  await runner();
  expect(results).toStrictEqual([
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["error", "LIMON_STOP"],
    ["disconnected", null],
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["disconnected", null],
  ]);
  expect(counters).toStrictEqual({
    transport: { init: 2, ready: 2, close: 2 },
    serializer: { init: 2, ready: 2, stop: 2 },
    limon: { init: 2, start: 2, stop: 2 },
    outscope: { add: 2, remove: 2 },
  });
});

// =============================================================================

test("throw-client-worst-init", async () => {
  const { results, runner, props, counters } = doClientTest(
    [ThrowClientTransport.CLOSE],
    [ThrowSerializer.STOP],
    [ThrowLimon.STOP],
    [ThrowOutScope.ADD, ThrowOutScope.RM],
  );
  await runner();
  props.transport.o.clear();
  props.serializer.o.clear();
  props.limon.o.clear();
  props.outscope.o.clear();
  await runner();
  expect(results).toStrictEqual([
    ["connecting", null],
    ["error", "OUTSCOPE_ADD"],
    ["error", "OUTSCOPE_RM"],
    ["error", "LIMON_STOP"],
    ["error", "TRANSPORT_CLOSE"],
    ["error", "SERIALIZER_STOP"],
    ["disconnected", null],
    ["caught_start", "OUTSCOPE_ADD"],
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["disconnected", null],
  ]);
  expect(counters).toStrictEqual({
    transport: { init: 2, ready: 2, close: 2 },
    serializer: { init: 2, ready: 2, stop: 2 },
    limon: { init: 2, start: 2, stop: 2 },
    outscope: { add: 2, remove: 2 },
  });
});

test("throw-client-limon-start-stop", async () => {
  const { results, runner, props, counters } = doClientTest(
    [],
    [],
    [ThrowLimon.START, ThrowLimon.STOP],
    [],
  );
  await runner();
  props.limon.o.clear();
  await runner();
  expect(results).toStrictEqual([
    ["connecting", null],
    ["error", "LIMON_START"],
    ["error", "LIMON_STOP"],
    ["disconnected", null],
    ["caught_start", "LIMON_START"],
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["disconnected", null],
  ]);
  expect(counters).toStrictEqual({
    transport: { init: 2, ready: 2, close: 2 },
    serializer: { init: 2, ready: 2, stop: 2 },
    limon: { init: 2, start: 2, stop: 2 },
    outscope: { add: 1, remove: 1 },
  });
});

test("throw-client-worst-init-no-limon", async () => {
  const { results, runner, props, counters } = doClientTest(
    [ThrowClientTransport.CLOSE],
    [ThrowSerializer.STOP],
    [],
    [ThrowOutScope.ADD, ThrowOutScope.RM],
    { limon: { enabled: false } },
  );
  await runner();
  props.transport.o.clear();
  props.serializer.o.clear();
  props.outscope.o.clear();
  await runner();
  expect(results).toStrictEqual([
    ["connecting", null],
    ["error", "OUTSCOPE_ADD"],
    ["error", "OUTSCOPE_RM"],
    ["error", "TRANSPORT_CLOSE"],
    ["error", "SERIALIZER_STOP"],
    ["disconnected", null],
    ["caught_start", "OUTSCOPE_ADD"],
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["disconnected", null],
  ]);
  expect(counters).toStrictEqual({
    transport: { init: 2, ready: 2, close: 2 },
    serializer: { init: 2, ready: 2, stop: 2 },
    limon: { init: 0, start: 0, stop: 0 },
    outscope: { add: 2, remove: 2 },
  });
});

test("throw-client-worst-stop", async () => {
  const { results, runner, props, counters } = doClientTest(
    [ThrowClientTransport.CLOSE],
    [ThrowSerializer.STOP],
    [ThrowLimon.STOP],
    [ThrowOutScope.RM],
  );
  await runner();
  props.transport.o.clear();
  props.serializer.o.clear();
  props.limon.o.clear();
  props.outscope.o.clear();
  await runner();
  expect(results).toStrictEqual([
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["error", "TRANSPORT_CLOSE"],
    ["error", "SERIALIZER_STOP"],
    ["error", "LIMON_STOP"],
    ["error", "OUTSCOPE_RM"],
    ["disconnected", null],
    ["connecting", null],
    ["connected", null],
    ["success", null],
    ["disconnecting", null],
    ["disconnected", null],
  ]);
  expect(counters).toStrictEqual({
    transport: { init: 2, ready: 2, close: 2 },
    serializer: { init: 2, ready: 2, stop: 2 },
    limon: { init: 2, start: 2, stop: 2 },
    outscope: { add: 2, remove: 2 },
  });
});
