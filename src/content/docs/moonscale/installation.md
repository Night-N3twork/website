---
title: Installation
description: Install MoonScale and prepare a browser application.
---

# Installation

Install the ESM package in a browser application:

```sh
npm install @nightnetwork/moonscale@1.0.0
```

MoonScale bundles its Go/WASM runtime in the package. `MoonScaleClient.create()` starts that runtime in a module Web Worker, which requires a browser with Web Worker, WebAssembly, and `fetch` support.

```ts
import { MoonScaleClient } from '@nightnetwork/moonscale';

const client = await MoonScaleClient.create({
  onAuthURL: (url) => {
    // Present the authorization URL through your application UI.
    console.log(url);
  },
});
```

MoonScale requires an existing Tailscale tailnet. It reports interactive authorization URLs through `onAuthURL`; it does not open them. Supply `wasmURL` only when the runtime WASM asset is served from a different URL. See [architecture](./architecture/) for the worker boundary and [integration](./integration/) for connection lifecycle.
