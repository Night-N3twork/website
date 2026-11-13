---
title: Nova Setup
description: Configure Nova WASM for direct Wisp or MoonBeam-relayed requests.
---

# Nova Setup

The demo initializes Nova WASM, creates a direct `LibCurl`, and optionally binds a second instance to MoonBeam. Install `@nightnetwork/nova@1.1.0` (the published package name, not `nova-wasm`); browser WASM support and a reachable Wisp URL are required for live requests.

```ts
import init, { LibCurl } from '@nightnetwork/nova';

await init();
const libcurl = new LibCurl();
await libcurl.load_wasm();
libcurl.set_websocket('wss://example.test/wisp/');

const response = await libcurl.fetch('https://example.com/', { method: 'GET' });
console.log(response.status, await response.text());
```

For the relay path, create a second `LibCurl`, load its WASM, and call the demo-used `set_moonbeam_relay(relay)` binding. Topology is Nova -> direct Wisp WebSocket or Nova -> MoonBeam -> shared Wisp WebSocket.

Verify with an HTTP URL that your endpoint and browser policy permit, and inspect the status/body. The demo applies a UI timeout because Nova does not expose request cancellation there; a timeout does not cancel the underlying request. Browser CORS, CSP, mixed-content, endpoint availability, and Wisp service behavior remain external limits.
