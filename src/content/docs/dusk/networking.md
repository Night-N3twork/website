---
title: Networking
---

# Networking

Dusk provides two host-configured network paths. For outbound HTTP and HTTPS, pass `net.loadLibcurl` and a Wisp WebSocket `proxyUrl`; Dusk calls the loader for a Nova-compatible `LibCurl` implementation. Nova supplies fetch-style HTTP through that proxy rather than direct unrestricted browser sockets.

For TCP-level relay use, pass a MoonBeam-compatible `RelayListener` as `net.relay`. The listener registers a host and port handler and exchanges `RelaySocket` byte callbacks. A relay-only boot configuration supplies `relay` without a Nova loader or proxy URL.

Within one runtime, `node:http` servers listening on `dusk.local`, or a host registered in Dusk's socket registry, are reachable by other Dusk processes over loopback without a relay or proxy. This does not expose the server to the public network.

Network access is therefore an integration responsibility: provide and secure the Nova proxy or relay endpoint, and do not imply that Dusk bypasses browser networking policy.
