---
title: Connect MoonBeam and MoonScale
description: Bridge tailnet traffic to an in-browser relay service.
---

# Connect MoonBeam and MoonScale

MoonScale can listen on the tailnet, while MoonBeam supplies a relay path for an in-browser service. The documented bridge pattern discovers the target host and port from `MoonbeamRelay.listenersSnapshot()` rather than hardcoding an address.

Choose direct `dialTcp()` when the target is reachable through the Tailscale dialer. Use the relay bridge only when the in-browser service needs MoonBeam's Wisp listener path. Treat MoonScale's HTTP and WebSocket TLS behavior as a security constraint: both use `InsecureSkipVerify`.

See [MoonScale](/moonscale/), [MoonScale security](/moonscale/security/), and [MoonBeam integration](/moonbeam/integration/).
