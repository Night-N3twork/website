---
title: Cross-Library Composition
description: Compose the demo's MoonScale, MoonBeam, Nova, and Dusk paths with explicit limits.
---

# Cross-Library Composition

`night-network-demo` composes the published Nova, MoonBeam, MoonScale, LunaSSH, Dusk, and DPM packages. A standalone checkout installs them from npm; it does not require sibling repositories:

```sh
git clone https://github.com/Night-N3twork/night-network-demo
cd night-network-demo
npm install
npm test
```

Node.js and npm are the consumer prerequisites. Published WASM and worker assets are installed through the package lock; Rust, `wasm-pack`, and local package source trees are not part of the demo setup.

```text
MoonScale client -- optional tailnet TCP/dial path --+
                                                     |
Nova LibCurl -> MoonBeam relay -> Wisp WebSocket ----+-> remote service
     ^
     +-- Dusk bootRepl loadLibcurl
```

The demo creates MoonBeam, initializes direct and relayed Nova clients, then boots Dusk with Nova and the relay. If MoonScale becomes available, its bridge listens on a tailnet port and forwards connections through a MoonBeam attachment, or uses `dialTcp()` when the direct-dialer toggle is selected.

The automated release smoke verifies direct and MoonBeam-routed Nova HTTPS status responses, Nova and libcurl.js WebSocket echoes, Dusk readiness, and DPM help without MoonScale authentication or SSH credentials. MoonScale and SSH remain optional manual paths requiring their own authorization and credentials. Close the bridge, MoonScale client, relay consumers, and relay in that order.

The demo contains retries and UI diagnostics, not a production control plane. It hardcodes demo endpoint/configuration values, relies on browser security policy and external services, and does not prove reliability, TLS policy, access control, or operational suitability.
