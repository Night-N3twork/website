---
title: Installation
description: Install MoonBeam and prepare a supported runtime.
---

# Installation

```bash
npm install @nightnetwork/moonbeam@1.1.1
```

MoonBeam requires a modern browser or Node 20+ runtime with typed arrays, `EventTarget`, WHATWG streams, and WebSocket support. Relay consumers also require `MessageChannel` and `MessagePort`. If your application uses `SharedArrayBuffer`, deploy cross-origin isolation headers: `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`.

A reachable Wisp endpoint is required for direct `WispClient`, `MoonbeamRelay`, and default `Gateway` use. Use `wss://` in deployed browser applications so the WebSocket is protected by TLS and compatible with secure-page mixed-content rules.

## Verify the package

```bash
npm run build
npm test
```

The MoonBeam test suite exercises packet codecs, Wisp handshakes and streams, relay lifecycle and routing, policy decisions, NAT flow handling, DHCP, the soft router, and `FakeWebSocket` state transitions.

## Current typecheck constraint

`npm run typecheck` is currently not a green verification command. MoonBeam's `tsconfig.json` sets `rootDir` to `src` while also including `test/**/*`; TypeScript reports the included tests outside `rootDir`. This is a current configuration limitation inherited by the package. The documented build and Vitest workflows are separate and are not evidence that the typecheck issue has been resolved.
