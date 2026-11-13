---
title: Connect Dusk, MoonBeam, and Nova
description: Use a MoonBeam relay as the documented browser transport path.
---

# Connect Dusk, MoonBeam, and Nova

Create a `MoonbeamRelay` for a Wisp endpoint, then use its attachment interface with a Nova WASM client. MoonBeam provides the relay transport; Nova performs its own asynchronous mux handshake. Wait for transport readiness and handle the documented not-ready error according to your application's lifecycle policy.

For a Dusk-hosted service, MoonBeam can register a local listener or route Wisp traffic through its gateway. Dusk remains responsible for starting and managing the in-browser process or HTTP server. Close the Nova client or transport consumer first, then detach relay ports and close the relay when no consumers remain.

See [MoonBeam integration](/moonbeam/integration/), [Nova WASM integration](/nova/wasm-integration/), and [Dusk networking](/dusk/networking/).
