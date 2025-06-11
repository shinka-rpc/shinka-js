---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "shinka-rpc"
  text: Symmetric RPC bus
  tagline: Remote procedure call framework
  actions:
    - theme: brand
      text: Core
      link: /core
    - theme: alt
      text: Transports
      link: /transports
    - theme: alt
      text: Serializers
      link: /serializers

features:
  - title: Symmetricity
    details: Every participant may register his request and event handlers, and
      send events and requests to the interlocutor

  - title: External transports
    details: We provide
      <a href="https://www.npmjs.com/package/@shinka-rpc/shared-worker">SharedWorker</a>,
      <a href="https://www.npmjs.com/package/@shinka-rpc/dedicated-worker">DedicatedWorker</a>,
      <a href="https://www.npmjs.com/package/@shinka-rpc/web-socket">Websocket</a> and
      <a href="https://www.npmjs.com/package/@shinka-rpc/browser-extension">BrowserExtension</a>
      transports, but you are able to define your own

  - title: External serializers
    details: We provide by default
      <a href="https://www.npmjs.com/package/@shinka-rpc/serializer-json">json</a>,
      <a href="https://www.npmjs.com/package/@shinka-rpc/serializer-bson">bson</a> and
      <a href="https://www.npmjs.com/package/@shinka-rpc/serializer-msgspec">msgspec</a>
      serializers, but you are able to create your own

  - title: Multi Language
    details: On the other side of the communication channel there may be an
      application written in another language. At the least python is already
      implemented and waiting to be published
---

