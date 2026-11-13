---
title: API Reference
description: Public MoonScale client surface.
---

# API Reference

`MoonScaleClient.create(options)` asynchronously creates and connects a client. `MoonScaleClientOptions` accepts `authKey`, `hostname`, `controlURL`, `stateStorage`, `wasmURL`, and callbacks for authentication URLs, state, netmap updates, and errors.

The client exposes `login()`, `logout()`, `dialTcp()`, `dialUdp()`, `listenTcp()`, `listenUdp()`, `fetch()`, `resolveDNS()`, and `close()`. TCP and UDP sockets expose `send()`, `close()`, and `data`, `close`, and `error` event subscriptions; UDP sockets also expose `sendTo()`.

`listExitNodes()`, `setExitNode(id, options?)`, `clearExitNode()`, and the read-only `exitNode` selection control tailnet egress. `setFunnel(port, target)` and `clearFunnel()` manage Funnel or netstack listeners. `createTailscaleWebSocket(url)` creates a WebSocket through the Tailscale netstack.

`fetch()` resolves to an object with `status`, `statusText`, and `text()`. Review its [TLS policy](./security/) before using it for a non-tailnet destination.
