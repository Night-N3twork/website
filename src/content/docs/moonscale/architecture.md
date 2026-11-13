---
title: Architecture
description: MoonScale client, worker, and Tailscale Connect runtime boundaries.
---

# Architecture

MoonScale is a TypeScript client around a browser Go/WASM runtime built from Tailscale Connect. `MoonScaleClient.create()` creates a worker-backed runtime bridge, starts the runtime, and then connects client callbacks to runtime state, netmap, authorization URL, and error events.

## Browser and worker boundary

The client owns socket adapters, pending dials, and listeners. The worker owns the runtime bridge and forwards requests and events across `postMessage`. Socket data is transferred as `ArrayBuffer` values; the client exposes copied `Uint8Array` values to socket listeners. Calling `close()` closes listeners, pending dials, active sockets, and the worker runtime.

## Runtime boundary

The worker imports the packaged runtime module and uses its `createIPN()` bridge. The bridge provides login state, netmap updates, tailnet TCP and UDP operations, DNS resolution, exit-node operations, HTTP fetches, Tailscale WebSockets, and Funnel or serve configuration. `stateStorage`, when supplied, is mediated across the worker boundary for persistent runtime state.

## Application lifecycle

`onAuthURL` receives an interactive authorization URL. `onState` receives runtime state transitions, and `onNetMap` receives an immutable netmap snapshot. After a client is closed, operations that need the bridge reject or throw rather than reopening it.

See [integration](./integration/) for lifecycle usage and [API reference](./api-reference/) for the public surface.
