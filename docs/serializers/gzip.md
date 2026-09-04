# Higher-order GZIP Serializer

```typescript
import { simpleGzip } from "@shinka-rpc/serializer-gzip";
import serializerJSON from "@shinka-rpc/serializer-json";

const serializer = simpleGzip(serializerJSON);
```

Then use created `serializer` as normal serializer
