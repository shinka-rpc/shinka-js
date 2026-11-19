# @shinka-rpc/browser-extension

![minzip](https://badgen.net/bundlejs/minzip/@shinka-rpc%2Fbrowser-extension)

`@shinka-rpc/browser-extension` provides transports for communication between browser extension execution contexts. 

It allows [@shinka-rpc/core](https://www.npmjs.com/package/@shinka-rpc/core) to establish RPC connections across page scripts, content scripts, and background scripts using native browser messaging APIs.

## Transports

- **`content2mainTransport`** — connects the page's `MAIN` ExecutionWorld with the content script's `ISOLATED` ExecutionWorld.
- **`extensionTransport`** — connects extension clients to the background script.
- **`messagePortTransport`** — allows a background `Server` to accept connections from extension clients.

## Typical Usage

A common architecture uses the content script as an intermediary between the page and the background script. Selected requests and events can be forwarded between the two connections using `passThroughRequests` and `passThroughEvents` from `@shinka-rpc/scenarios`.

Browser messaging APIs have their own serialization constraints. Depending on the browser and configuration, a custom serializer such as `@shinka-rpc/serializer-base64` may be needed to exchange binary data or other non-JSON-compatible values.

## Documentation

See the [Browser Extension Usage Guide](https://shinka-rpc-js.readthedocs.io/0.1.x/api-reference/transports/browser-extension.html) for a detailed explanation of the architecture, transports, examples, and serialization considerations.
