---
title: MoonBeam Relay Setup
description: Start the demo's in-page Wisp relay and verify attached clients.
---

# MoonBeam Relay Setup

This is the small relay pattern used by `night-network-demo`. It requires a browser that supports `WebSocket` and a reachable Wisp endpoint; the endpoint is infrastructure you operate or trust.

```ts
import { MoonbeamRelay } from '@nightnetwork/moonbeam';

const relay = await MoonbeamRelay.create({ wispUrl: 'wss://example.test/wisp/' });
const port = relay.attach();
console.log(relay.clientCount(), relay.streamCount());
```

Topology: browser clients attach through `MessagePort` instances to one MoonBeam relay, which owns the upstream Wisp WebSocket.

Verify that `clientCount()` increases after `attach()`, then hand the port or relay to a supported consumer such as the demo's Nova path. Close consumer ports first and finally `await relay.close()`; `isClosed()` should then be true.

The demo polls relay statistics every 500 ms and provides a test attachment. It does not establish relay availability, reconnect policy, authentication, or production capacity guarantees. See [MoonBeam integration](/moonbeam/integration/).
