---
title: LunaSSH
description: Browser-native SSH over Wisp and MoonBeam transports.
---

# LunaSSH

LunaSSH is a Go/WASM SSH client for browser applications. It uses Wisp streams to reach an SSH server without giving browser code raw TCP access. Applications can connect directly to a Wisp endpoint or use a MoonBeam relay through a `MessagePort`.

LunaSSH provides the `@nightnetwork/lunassh` library API, while the separate `@nightnetwork/lunassh/dusk` export registers an interactive `ssh` command for Dusk dsh. Start with [installation](./installation/), then choose [direct Wisp or MoonBeam integration](./integration/). Read [architecture](./architecture/), [API reference](./api-reference/), [security](./security/), and [troubleshooting](./troubleshooting/) before connecting to a host.
