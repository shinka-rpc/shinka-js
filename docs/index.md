---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "shinka-rpc"
  text: Symmetric RPC bus
  image:
    src: ./img/logo.png
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
    - theme: alt
      text: LiMons
      link: /limons
    - theme: alt
      text: Util
      link: /util

features:
  - title: Symmetricity
    icon: ☯
    details: Server may send request to particular client and receive its
      response

  - title: Multi Language
    icon: 📢
    details: At the least python is already implemented and waiting to be
      published

  - title: Slim Protocol
    icon: 🤏
    details: As compact as possible exchange protocol minifies parasitic load on
      the network
  
  - title: Minimal dependency tree
    icon: 🔗
    details: reduces the attack vector across the supply chain. No external
      dependencies for
      <a href="https://www.npmjs.com/package/@shinka-rpc/core">Core</a> and
      <a href="https://www.npmjs.com/package/@shinka-rpc/util">Util</a> packages

  - title: External transports
    icon: 🚂
    details: We provide
      <a href="https://www.npmjs.com/package/@shinka-rpc/shared-worker">SharedWorker</a>,
      <a href="https://www.npmjs.com/package/@shinka-rpc/dedicated-worker">DedicatedWorker</a>,
      <a href="https://www.npmjs.com/package/@shinka-rpc/web-socket">Websocket</a> and
      <a href="https://www.npmjs.com/package/@shinka-rpc/browser-extension">BrowserExtension</a>
      transports, but you are able to define your own

  - title: External serializers
    icon: 🖭
    details: We provide by default
      <a href="https://www.npmjs.com/package/@shinka-rpc/serializer-json">json</a>,
      <a href="https://www.npmjs.com/package/@shinka-rpc/serializer-bson">bson</a> and
      <a href="https://www.npmjs.com/package/@shinka-rpc/serializer-msgspec">msgspec</a>
      serializers, but you are able to create your own

  - title: External optional <b>LiMon</b>s
    icon: 🍋
    details: Liveness Monitors make decision about connection state. You can
      choose the best one for each case

  - title: External schedulers
    icon: 🔃
    details: You can choose the logic that makes decision about connection state
---
