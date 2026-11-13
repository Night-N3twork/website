---
title: Security and Operations
description: Secure deployment and operational boundaries for Dusk in the browser.
---

# Security and Operations

Dusk runs browser workers that use synchronous IPC with host services. It requires a secure, cross-origin-isolated browser context before it can start. Serve production and LAN/device deployments over HTTPS, except on `localhost`, and return these headers for both the document and Dusk runtime assets:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

The headers enable `crossOriginIsolated` and make `SharedArrayBuffer` available. Treat an incompatible cross-origin resource as a deployment fault: it can prevent Dusk from booting even when the document response has the required headers. Confirm the conditions in the target browser rather than relying only on a local build. See [deployment](./deployment/) for the complete prerequisite list.

## Storage operations

The persistent `tfs` filesystem uses origin-scoped OPFS. Browser site-data clearing therefore removes Dusk data for that origin. Host Dusk on a dedicated origin or subdomain when clearing storage must not affect unrelated OPFS-using applications.

Check target-browser support for OPFS before enabling persistent storage. Dusk's zlib support also depends on `CompressionStream` and `DecompressionStream`; validate those APIs for the browsers you support. See [storage and VFS](./storage-and-vfs/) for filesystem modes and persistence behavior.

## Runtime and network operations

Dispose terminal sessions and their processes when the embedding UI is removed or restarted. A terminal integration should not retain a running shell after its display surface has gone away.

Dusk does not grant browser network permissions. Provide the required Nova proxy or MoonBeam relay for the selected network path, and treat browser policy plus the supplied transport as the egress boundary. Review [networking](./networking/) before exposing an application to untrusted URLs or networks.

For terminal-only workloads, `skipPidZero: true` avoids the idle REPL engine. In that mode, `feed()` rejects; send input to a spawned process instead. See [architecture](./architecture/) and [terminal and processes](./terminal-and-processes/) for the process-model and memory trade-offs.
