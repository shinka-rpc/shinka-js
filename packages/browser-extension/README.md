# @shinka-rpc/browser-extension

Symmetric RPC bus

This package contains a parametrizers of
[@shinka-rpc/core](https://www.npmjs.com/package/@shinka-rpc/core) for
browser extension

# Usage

The most common use-case is to passthrough requests and events from the page to
the extension environment, and back. There are some contexts here:

- Page `MAIN` [ExecutionWorld](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/ExecutionWorld)

- Page `ISOLATED` [ExecutionWorld](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/ExecutionWorld)

- [Background script](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Background_scripts) is a `server` case

- [Popup](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/user_interface/Popups) and [options](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/user_interface/Options_pages) pages, [devtool panels](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/user_interface/devtools_panels) and other applications, working in `ISOLATED` [ExecutionWorld](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/ExecutionWorld)

Sometimes you need to communicate between them

Also you don't need to use any serializer here

## Some pre-requirements

Inasmuch as page may send and receive messages, it would be good idea to mark
our messages. So, let's define the file `constants.ts`:

```typescript
export const MAIN2ISOLATED_TYPE = "MY_EXTENSION_MAIN2ISOLATED";
export const ISOLATED2MAIN_TYPE = "MY_EXTENSION_ISOLATED2MAIN";
```

## Page `MAIN` ExecutionWorld

Here we are able to connect to the page `ISOLATED` ExecutionWorld only:

```typescript
import { ClientBus } from "@shinka-rpc/core";
import { createClientFactory } from "@shinka-rpc/browser-extension";

import { MAIN2ISOLATED_TYPE, ISOLATED2MAIN_TYPE } from "./constants";

const factory = createClientFactory(ISOLATED2MAIN_TYPE, MAIN2ISOLATED_TYPE);
const bus = new ClientBus({ factory });
```

**API Reference**: createClientFactory

- **Required** TAG_ONMESSAGE: `unknown`
- **Required** TAG_SEND: `unknown`


## Page `ISOLATED` ExecutionWorld

Here we are able to connect both to the page `MAIN` ExecutionWorld and to the
background script. Some requests and events we have to passthrough to the
background server script. That's why I think it's good idea to create the pair
of buses: 

```typescript
import {
  createClientFactory,
  createIsolatedPair,
} from "@shinka-rpc/browser-extension";
import { passThroughEvent, passThroughRequest } from "@shinka-rpc/core";

import { MAIN2ISOLATED_TYPE, ISOLATED2MAIN_TYPE } from "./constants";

// Here be careful! We are using the same function `createClientFactory` to
// connect the content `MAIN` script. Here tags have to be passed in REVERSED
// order
const contentBusFactory = createClientFactory(
  MAIN2ISOLATED_TYPE,
  ISOLATED2MAIN_TYPE,
);

const { contentBus, extensionBus } = createIsolatedPair({ contentBusFactory });

passThroughEvent(contentBus, extensionBus, "example-event");
passThroughRequest(contentBus, extensionBus, "example-request");
```

**API Reference**: createIsolatedPair

- **Required** contentBusFactory: `FactoryClient<ClientBus>`
- **Optional** responseTimeout: `number`
- **Optional** contentRegistry: `Registry<ClientBus>` hooks for content bus
- **Optional** extensionRegistry: `Registry<ClientBus>` hooks for extension
environment

# Backgroung `server` script

Here we receive connections from all tabs with active extension `ISOLATED`
ExecutionWorld. It's clear `server` scenario

```typescript
import { ServerBus } from "@shinka-rpc/core";
import { messagePortFactory } from "@shinka-rpc/browser-extension";

export const server = new ServerBus()

chrome.runtime.onConnect.addListener(messagePortFactory(server));
```

**API Reference**: messagePortFactory

- **Required** bus: `ServerBus`
- **Optional** complete: `(port: chrome.runtime.Port) => CompleteFN`
