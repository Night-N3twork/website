---
title: Architecture
description: Nova workspace boundaries and request path.
---

# Architecture

The workspace contains five crates: `nova-core`, `nova`, `nova-cli`, `nova-wasm`, and `nova-test-support`. It patches the `h2` crate to the `h2-wasm` fork for WASM-compatible HTTP/2 work.

`nova-core` exports the low-level `NovaHandle`, option types, Wisp mux, transports, TLS configuration, HTTP modules, WebSocket module, proxy support, compression, cookie jar, and custom-protocol registry. A handle is configured with a URL, method, headers, body, options, and an already-connected Wisp mux. The request path opens a Wisp stream, applies any proxy chain, establishes TLS for HTTPS, and performs the selected HTTP flow.

`nova` layers a reqwest-shaped `NovaClient` and `RequestBuilder` on top. A builder can set default headers and grouped TLS, HTTP, TCP, timeout, cookie, DNS, and general options. Supplying a mux is required for a request to execute; without one, `send()` returns `Error::NoTransport`.

On wasm32, the working `LibCurl` facade creates either a browser WebSocket transport from a URL or a MessagePort transport by calling a MoonBeam relay object's `.attach()`. It establishes the mux and pumps inbound frames for its operations. The separately exported `NovaClient` does not currently connect its stored transport to a real mux according to the published declaration; consumers should not describe it as an asynchronous working transport.
