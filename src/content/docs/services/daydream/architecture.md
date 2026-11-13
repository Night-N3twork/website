---
title: Architecture
description: Daydream's UI, proxy, extension, AI bridge, and server layers.
---

# Architecture

Daydream is a multipage Vite frontend served by a Node/Fastify process. It is not a native browser: page content is hosted in managed iframes, navigated through the proxy runtime, and coordinated by browser-side TypeScript objects.

## Runtime layers

1. The UI boot path creates `Proxy`, `Protocols`, `Tabs`, settings/data APIs, and internal `ddx://` pages.
2. `Tabs` creates managed iframes, tracks metadata and active state, and delegates lifecycle, frames, pinning, grouping, split layout, closed-tab restore, history, and navigation stacks to focused modules.
3. `Proxy` waits for a Wisp transport and Scramjet controller, then installs event, script-injection, DevTools, downloads, permissions, error-page, NyxBridge, and HTTP-cache hooks.
4. Helium hosts extension files and contexts and routes supported `chrome.*` calls through browser-side handlers.
5. Fastify serves `dist/`, API routes, and the Wisp WebSocket upgrade endpoint.

## Cross-origin isolation

Development explicitly sends `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`. Production relies on `@fastify/helmet` for the corresponding isolation policy. This enables the `SharedArrayBuffer` and `Atomics` features used by Scramjet, Neutron isolation, and Helium's isolated-world path. A deployment that strips these headers can degrade content-script isolation.

## Persistent browser data

The browser layer owns settings, bookmarks, history, profiles, cookies, downloads, site permissions, and extension state. Treat those browser-side stores as application state; they are not server-side multi-user data services.

## Boundaries

- The Fastify process is the transport and static-asset host; it does not execute web pages on behalf of users.
- A page iframe is not a browser process or security sandbox equivalent to Chromium.
- NyxBridge is deliberately narrower than a general cross-origin control API: an origin check and iframe-bound session gate precede dispatch.
- Helium implements selected APIs; unsupported APIs fail explicitly rather than silently becoming Chromium-compatible.
