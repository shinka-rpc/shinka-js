import hooksEvent from "./hook-event";
import { createRegistry, makeRegistryHook } from "./util";

const eventRegistryHook = makeRegistryHook(hooksEvent);

export const createEventRegistry = () => createRegistry(eventRegistryHook);

export type EventRegistryType = ReturnType<typeof createEventRegistry>;
