# BSON Serializer

```typescript
import serializer from "@shinka-rpc/serializer-bson";
```

::: details Implementation
```typescript
import type { SerializerRoot } from "@shinka-rpc/core";
import { BSON } from "@kai3341/bsonfy";

const { serialize, deserialize: bsonDeserialize } = BSON;
const deserialize = (data: any) => bsonDeserialize(data, true, undefined, true);

export default ((shinkaOn) => () => ({
  serialize,
  deserialize,
  transportInitOpts: { mode: "binary", contentType: "application/bson" },
  typeHints: { serialize: "Function", deserialize: "Function" },
})) as SerializerRoot<any, any, any>;
```
:::
