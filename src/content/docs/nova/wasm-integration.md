---
title: WASM Integration
description: Connect browser Nova consumers through Wisp or MoonBeam.
---

# WASM Integration

Initialize the generated wasm-bindgen module, then use `LibCurl` for the published working browser transport. Configure a direct Wisp URL or pass a `MoonbeamRelay`, whose `.attach()` method supplies a `MessagePort`.

```js
import init, { LibCurl } from '@nightnetwork/nova';
import { MoonbeamRelay } from '@nightnetwork/moonbeam';

await init();
const relay = await MoonbeamRelay.create({ wispUrl: 'wss://wisp.example.com/' });
const client = new LibCurl();
await client.load_wasm();
client.set_moonbeam_relay(relay);

const response = await client.fetch('https://example.com/', { method: 'GET' });
console.log(response.status, await response.text());
```

For a direct path, call `client.set_websocket('wss://wisp.example.com/')` instead. `LibCurl` establishes and reuses connection state when operations need it. Changing its transport configuration invalidates the current mux and closes the active transport asynchronously so a stale handshake is not published.

Do not use `NovaClient` as an alternative in the published 1.1.0 package. Its declaration states that the transport is stored but not wired to a real Wisp mux; `fetch()` returns `NoTransport`-style errors and `connectWebSocket()` remains a placeholder.

For JavaScript WebSocket and TLS-socket compatibility status, do not assume browser-native equivalents. They have explicit caveats in [JavaScript reference](./javascript-reference/).
