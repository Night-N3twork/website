---
title: Troubleshooting
description: Diagnose Dusk startup, storage, networking, and process-operation failures.
---

# Troubleshooting

## Dusk does not boot

Check that the page is served over HTTPS, unless it is on `localhost`, and that both COOP and COEP headers are returned for the document and runtime assets:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Then verify `crossOriginIsolated` and `SharedArrayBuffer` in the deployed browser. A missing header, ordinary HTTP away from `localhost`, or an incompatible cross-origin resource prevents boot. See [security and operations](./security-and-operations/) and [deployment](./deployment/).

## Persistent filesystem is unavailable or data disappeared

The `tfs` backend requires OPFS. Verify that the target browser provides OPFS and that site storage has not been cleared. OPFS is scoped to the full origin, so clearing site data erases all OPFS entries on that origin, not only Dusk data. See [storage and VFS](./storage-and-vfs/) for backend selection.

## A terminal-only integration cannot accept `feed()` input

If the runtime was booted with `skipPidZero: true`, it has no pid-0 REPL and `feed()` rejects by design. Spawn and communicate with a child process such as `/bin/dsh` through the process manager instead. See [terminal and processes](./terminal-and-processes/).

## Networking requests fail

Dusk requires an explicitly supplied Nova proxy or MoonBeam relay for the applicable network path; it does not bypass browser networking policy. Confirm the supplied transport configuration and browser egress policy, then validate the selected route independently. See [networking](./networking/) and the [Dusk networking setup guide](/guides/dusk-networking/).

## Memory use is higher than expected

The browser process model consumes memory, and total use depends on engines, packages, and workload. When the application only needs child processes, use `skipPidZero: true` to avoid the idle fallback REPL engine. Review the process layout in [architecture](./architecture/) and runtime boundaries in [limitations](./limitations/).
