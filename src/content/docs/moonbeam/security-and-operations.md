---
title: Security and Operations
description: Operate MoonBeam with deliberate egress and lifecycle controls.
---

# Security and Operations

## Start from least privilege

The default gateway policy is `allow: ['public']`. It excludes IANA special-use ranges, including RFC1918, CGNAT, loopback, multicast, and reserved ranges. A deny CIDR or denied port always wins over an allow rule. The `'*'` token is broader, but loopback remains blocked unless `allowLoopback: true` is explicitly set.

Do not enable loopback merely to make a remote service reachable. Routing localhost through a remote Wisp exit can target services that callers did not intend to expose. Use explicit local relay listeners for in-page services instead. Attach `onBlocked` to record structured `{ ip, port, proto, reason }` denials without changing forwarding behavior.

## Observe and close resources

Use relay snapshots and counts for diagnostics, not as authorization state. Detach clients when their workers or WASM instances terminate. `relay.close()` detaches clients, closes listeners, and closes the upstream client. Gateway destruction likewise stops data-plane consumers before closing the Wisp connection.

The Wisp client surfaces `open`, `close`, and `error` events. Gateway emits `connect`, `disconnect`, `error`, and `wisp-changed`. Treat a close as terminal for that client: MoonBeam does not implement automatic Wisp reconnection.

## Browser deployment

Use secure `wss://` Wisp endpoints and restrict the origins that may load your application. Cross-origin isolation is needed only for `SharedArrayBuffer` users, but when it is required it is an application deployment requirement rather than a library fallback.
