---
title: Operations
description: Operate an Eclipse browser VM demo.
draft: true
---

# Operations

Configure a reachable Wisp server with `?wisp=wss://your-server/`; the demo supplies a default but production deployments should select their own endpoint. The default resolved network policy allows public egress, so set explicit egress policy when the deployment needs tighter restrictions.

Memory storage is the default. Use the persistent demo only where cross-origin isolation and OPFS support are available. First boot downloads the disk image; later persistent starts reuse browser storage.

Run `npm test`, `npm run test:integration`, and `npm run typecheck` in the Eclipse project when validating changes. Monitor asset availability, Wisp reachability, browser isolation, and browser storage state during operation.
