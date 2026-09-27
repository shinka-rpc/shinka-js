# @shinka-rpc/serializer-gzip

Symmetric RPC bus. [Documentation is here](https://shinka-rpc-js.readthedocs.io/latest/serializers/gzip/)

This package implements Higher-order serializer into GZIP

# Usage

```typescript
import { simpleGzip } from "@shinka-rpc/serializer-gzip";
import serializerJSON from "@shinka-rpc/serializer-json";

const serializer = simpleGzip(serializerJSON);
```

Then use created `serializer` as normal serializer
