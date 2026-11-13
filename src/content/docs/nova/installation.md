---
title: Installation
description: Build Nova for Rust or browser consumers.
---

# Installation

## Rust

Add the appropriate workspace crate to a Cargo project, then build the workspace during development:

```bash
cargo build --workspace
cargo test --workspace
```

Nova requires a Rust toolchain compatible with the workspace and its Tokio, rustls, and Wisp dependencies. HTTP/2 relies on the workspace's patched `h2-wasm` dependency.

## Browser WASM

The published JavaScript-facing package is `@nightnetwork/nova`:

```bash
npm install @nightnetwork/nova@1.1.0
```

The npm tarball includes `nova_wasm.js`, its TypeScript declarations, and `nova_wasm_bg.wasm`; consumers do not need to build the Rust workspace. To build from source instead, use a `wasm32-unknown-unknown` target and `wasm-pack build --target web nova-wasm`. Browser end-to-end tests require headless Chrome and a reachable Wisp endpoint; a MoonBeam relay is needed for the relay path.

After wasm-bindgen initialization, each `LibCurl` instance exposes constructable, instance-bound factories: `new client.WebSocket(url, protocols?, options?)` and `new client.TLSSocket(host, port, options?)`. Configure the instance's transport before constructing either socket. Both begin connecting asynchronously; register handlers immediately, wait for `onopen` before sending, and handle `onerror` and `onclose`. `TLSSocket` is a raw TLS socket over a Wisp TCP stream, not a browser-native socket.

For working browser HTTP and WebSocket consumers, use `LibCurl`. The published 1.1.0 declaration explicitly says `NovaClient` stores but does not wire its transport to a Wisp mux, so its `fetch()` returns `NoTransport`-style errors and `connectWebSocket()` is a placeholder. Do not infer support from class presence or build success; see [limitations](./limitations/).
