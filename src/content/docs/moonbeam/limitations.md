---
title: Limitations
description: Current MoonBeam protocol, runtime, and tooling constraints.
---

# Limitations

`npm run typecheck` currently fails because MoonBeam includes `test/**/*` while `rootDir` is `src`. This root-directory/include contradiction is a known tooling constraint. Do not describe typecheck as passing or use it as the package's current release gate; build and Vitest use different paths.

MoonBeam requires browser-style platform APIs. It is not a replacement for arbitrary Node networking, and `WispClient` needs a WebSocket constructor unless an injected socket is supplied for testing or integration. The client does not reconnect automatically after a network close.

Wisp v1 compatibility is intentionally less capable than v2: there is no INFO extension negotiation, no MOTD, no stream-open confirmation, and UDP support may be assumed by configuration. Authentication-required advertisements fail rather than producing a complete authentication flow.

Gateway networking is IPv4 virtual-LAN networking. The underlying `tcpip` stack does not act as a router, so MoonBeam's soft router handles off-subnet forwarding in parallel. `getTun()` remains exposed for compatibility and tests, but the runtime forwarding path uses the soft router.
