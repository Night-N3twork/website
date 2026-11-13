---
title: Dusk Networking Setup
description: Provide a Nova LibCurl instance to Dusk's documented boot path.
---

# Dusk Networking Setup

Dusk requires the public `@nightnetwork/dusk` package and a browser worker-capable environment. Do not preload Nova's LibCurl WASM or configure its initial Wisp transport: when Dusk's `createNet` bridge first uses the supplied LibCurl instance, it calls `load_wasm()` and then `set_websocket(proxyUrl)` itself.

```ts
import { bootRepl } from '@nightnetwork/dusk';

const dusk = await bootRepl(console.log, {
  skipPidZero: true,
  net: {
    loadLibcurl: async () => libcurl,
    proxyUrl: wispUrl,
    relay,
  },
});

const shell = await dusk.processManager.spawn('/bin/dsh', [], {
  pty: { cols: 80, rows: 24 },
});
```

Topology: Dusk process -> Dusk network host functions -> supplied Nova LibCurl -> direct Wisp or MoonBeam relay -> Wisp endpoint.

Verify boot by spawning `/bin/dsh`, then run a simple HTTP command supported by the installed Dusk binary set. Attach `shell.master.onMasterData()` to display terminal data and drain stdout/stderr. With `skipPidZero: true`, do not call `dusk.feed()`; it rejects by design.

When `net` supplies both `loadLibcurl` and `proxyUrl`, the returned `dusk.tcpProvider` is a hybrid provider: raw requests use Wisp TCP and NodeWorker TLS/HTTPS requests use Nova Rustls over the same route. See [NodeWorker Adapter](/dusk/reference/nodeworker-adapter/) for setup, certificate validation semantics, and TLS limitations.

Dusk does not add raw browser-network privileges. Browser policy and the supplied LibCurl/relay implementation determine whether an outbound request can succeed. See [Dusk networking](/dusk/reference/networking/).
