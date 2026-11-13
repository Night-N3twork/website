---
title: Security and Operations
description: TLS, proxy, and transport lifecycle constraints.
---

# Security and Operations

## TLS constraints

Nova builds rustls client configuration with the ring provider. TLS 1.2 and 1.3 are the supported version range. Invalid ranges and malformed CA data are configuration errors. In the current implementation, `TlsOptions.verify_peer = false` is rejected; insecure certificate verification is not supported by this release.

An in-memory `ca_bundle_data` replaces the default root store. Native `ca_bundle_path` is read from the filesystem, but file-path options are ignored on wasm32. The same wasm32 restriction applies to client certificate/key paths, NSS keylog path, TCP interface binding, and cookie-jar paths. Plan browser deployments around in-memory configuration and browser storage instead of native paths.

## Proxy ordering

Proxy chains run inside a Wisp stream, after Nova has connected to the first proxy hop. Therefore proxy hostnames are resolved by the Wisp exit node, not by the browser. For `[p0, p1, ..., pN]`, Nova opens a stream to `p0`, then each hop negotiates to the next hop, with the final hop negotiating to the destination. An empty chain is a no-op.

## Lifecycle

`LibCurl` serializes mux setup and tracks a generation. Transport configuration may change while a WebSocket or MessagePort connection is handshaking; Nova closes that stale transport and retries rather than publishing it. Its inbound pump closes the transport and clears the mux on receive or dispatch failure. Consumers should treat configuration changes and failed transport operations as connection-boundary events, not as safe mutations of an active request.
