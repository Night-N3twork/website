---
title: Nova
description: Rust and WebAssembly Wisp client surfaces.
---

# Nova

Nova is a Rust Wisp client delivered as a Cargo workspace and a wasm-bindgen package. `nova-core` owns protocol, transport, HTTP, TLS, proxy, compression, and low-level handle code. `nova` provides a higher-level Rust builder API, `nova-cli` provides a curl-shaped CLI, and `nova-wasm` exposes JavaScript-oriented classes.

The Rust and WASM surfaces are not interchangeable. Read [Rust integration](./rust-integration/) for native code and [WASM integration](./wasm-integration/) for browser code. For JavaScript compatibility boundaries, see [JavaScript reference](./javascript-reference/) and [limitations](./limitations/).

Nova uses Wisp v2.1 streams. A browser client can connect directly through a Wisp WebSocket or use a MoonBeam relay through a `MessagePort`.
