---
title: MoonScale
description: Browser Tailscale client built from Tailscale Connect.
---

# MoonScale

MoonScale is a TypeScript ESM client for connecting a browser application to an existing Tailscale tailnet. Its Go/WASM runtime is bundled with the package; it is not a replacement for a tailnet.

Start with [installation](./installation/), then use [integration](./integration/) to create a `MoonScaleClient` and provide `onAuthURL` to handle interactive authentication. The client does not open authorization URLs itself.

MoonScale supports tailnet TCP and UDP dials and listeners, DNS resolution, exit-node selection, HTTP fetches, and Funnel or serve configuration. Call `close()` when the application is finished to release sockets, listeners, and pending dials.

See [architecture](./architecture/), [API reference](./api-reference/), [security](./security/), [limitations](./limitations/), and [troubleshooting](./troubleshooting/).
