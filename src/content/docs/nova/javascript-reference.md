---
title: JavaScript Reference
description: Current wasm-bindgen and libcurl-compatible JavaScript surface.
---

# JavaScript Reference

`@nightnetwork/nova@1.1.0` exposes `LibCurl`, low-level `Nova`, `NovaClient`, and `NovaHTTPSession`. Presence in the declaration does not imply that every transport is wired. `LibCurl.load_wasm()` is a compatibility no-op because module initialization is performed through wasm-bindgen `init()`.

## Working HTTP configuration

`LibCurl.set_websocket(url)`, `set_moonbeam_relay(relay)`, `fetch(url, opts)`, proxy setters, `setopt()`, `NovaHTTPSession`, and its `fetch()`/`close()` surface are documented as working. Relay objects must supply `.attach()` and return a `MessagePort`.

The published declaration marks `NovaClient` transport wiring as unfinished: its constructor stores and validates the transport but does not attach a real Wisp mux, and `fetch()` returns `NoTransport`-style errors. Browser consumers that need working requests must use `LibCurl`, not wait or retry `NovaClient`.

## WebSocket and TLS socket status

`LibCurl.WebSocket` is a constructable WASM factory: use `new client.WebSocket(url, protocols?, options?)`. The getter returns a factory bound to that `LibCurl` instance's connection state, rather than a bootstrap-published global constructor. Connection setup remains asynchronous; install handlers before waiting for `open`, and do not treat this compatibility surface as browser-WebSocket parity. `NovaClient.connectWebSocket()` remains separately placeholder-wired while its stream adapter work is incomplete.

`LibCurl.TLSSocket` is likewise a constructable WASM factory: use `new client.TLSSocket(host, port, options?)`. It is bound to the owning `LibCurl` instance and opens a raw TLS socket over a Wisp TCP stream. Wait for `onopen` before calling `send()` because pre-open sends are dropped; handle `onerror` and `onclose` for mux, proxy, handshake, and stream failures.
