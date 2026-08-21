/// <reference lib="esnext.typedarrays">

import createHighOrderSync from "@shinka-rpc/libserializer/high-order-sync";

export default createHighOrderSync({
  mode: "text",
  bin: {
    serialize: (data) => data.toBase64(),
    deserialize: Uint8Array.fromBase64,
  },
  text: { serialize: btoa, deserialize: atob },
  updateContentType: (contentType) => contentType + "base64",
});
