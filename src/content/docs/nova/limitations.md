---
title: Limitations
description: Current Nova capability and platform boundaries.
---

# Limitations

Nova's README describes a broad target surface, but consumers must distinguish implemented paths from planned or partial JavaScript compatibility. In the published 1.1.0 declaration, `NovaClient` stores but does not wire its transport to a real Wisp mux; its `fetch()` returns `NoTransport`-style errors and `connectWebSocket()` is placeholder-wired. Use `LibCurl` for working browser requests and WebSocket integration. `LibCurl.WebSocket` is a constructable WASM factory bound to its owning `LibCurl` instance, but remains a compatibility surface rather than complete browser-WebSocket parity.

`LibCurl.TLSSocket` is a constructable, instance-bound WASM factory for raw TLS sockets over Wisp TCP streams. It connects asynchronously: wait for `onopen` before sending, and handle errors and close events from the mux, proxy, TLS handshake, or stream.

Native filesystem and interface options do not translate to wasm32: CA-bundle path, client certificate/key paths, TLS keylog file, TCP interface binding, and cookie-jar path are ignored there. TLS peer verification cannot currently be disabled.

Proxy chains apply after Nova opens a Wisp stream to the first proxy. Nova does not proxy the WebSocket transport between the client and the Wisp server itself. HTTP/3/QUIC, non-web protocol families, full curl CLI compatibility, FIPS/aws-lc-rs mode, and dynamic-library custom-protocol loading are outside the documented goals.
