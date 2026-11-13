---
title: Daydream
description: Source-grounded documentation for the Daydream browser service.
---

# Daydream

Daydream is a browser experience with an in-page proxy runtime, iframe-backed tabs, a Fastify/Wisp backend, and a browser-extension compatibility layer named Helium. This documentation reflects `/home/amplify/Projects/DDX-Rewrite-Bak`, which is the canonical current implementation despite its folder name.

## Components

- The browser UI owns tabs, bookmarks, history, profiles, settings, internal `ddx://` pages, and the omnibox.
- `Proxy` initializes Scramjet with a selected transport, a Wisp endpoint, a service worker, injection hooks, and per-frame plugins.
- Helium unpacks and hosts extension files, starts extension contexts, and exposes selected Chrome-compatible APIs.
- NyxBridge gives allowlisted NyxAI frames an authenticated RPC surface to control tabs, inspect pages, send input, use storage, and access browser data.
- The Node process serves the built site and `/api`, and upgrades `/wisp/` WebSocket traffic to Wisp.

## Read Next

- [Architecture](./architecture/) maps these layers and their boundaries.
- [Tabs and navigation](./tabs-and-navigation/) describes the iframe-backed browsing model.
- [NyxBridge](./nyxbridge/) documents the AI integration and its RPC API.
- [Extensions](./extensions/) covers Helium's supported model and gaps.
- [Runtime and proxy](./runtime-and-proxy/) covers Wisp selection and the browser runtime.
- [Development and testing](./development-and-testing/) and [build and deployment](./build-and-deployment/) cover the supported workflows.

## Scope and Status

These pages describe implementation behavior, not a compatibility guarantee. In particular, Helium has explicit unimplemented Chrome API stubs, the Wisp connection does not make the application deployable to static hosting, and the checked-in README and `vercel.json` contain stale instructions. See [limitations](./limitations/) before relying on an integration or a deployment target.
