---
title: API Reference
description: Public LunaSSH JavaScript API.
---

# API Reference

Import the primary API from `@nightnetwork/lunassh`.

## `SSHClient`

- `initialize(options?)` loads the Go runtime and WASM asset. `InitializationOptions` accepts `wasmPath`, `wasmExecPath`, `autoDetect`, `publicDir`, `cacheBusting`, and `timeout`.
- `connect(options, transport, callbacks?)` connects through a `WispTransport` or `MoonbeamTransport` and returns an `SSHSession`.
- `disconnect(sessionId)` and `send(sessionId, data)` operate on a runtime session by ID.
- `getVersion()` returns the initialized runtime version.

`ConnectionOptions` requires `host`, `port`, and `user`. It also supports password or private-key authentication, a timeout, and host-key verification options: `knownHosts`, `hostKeyFingerprint`, `hostKey`, `insecureSkipHostKeyVerification`, and `trustOnFirstUse`. See [security](./security/) before choosing host-key verification.

`SSHSession` provides `sessionId`, `send(data)`, `disconnect()`, and `resizeTerminal(cols, rows)`. `SSHClientCallbacks` can observe sent and received packets, connection state, and plaintext terminal output.

## Transport helpers

`WispTransport(id, options)` connects directly to a Wisp endpoint. Its options require `wispUrl`, `sshHost`, and `sshPort`; they can also set `connectionTimeoutMs` and Wisp client settings including protocol fallback, handshake timeout, authentication, and initial buffer size.

`MoonbeamTransport(id, relay, options)` uses a relay exposing `attach()`. Its options require `sshHost` and `sshPort` and can select a nonzero `streamId`.

`SSHWispClient` provides convenience methods:

- `connectViaWisp(options, callbacks?)`
- `connectViaMoonbeam(options, relay, callbacks?)`
- `createWispTransport(id, options)`
- `createMoonbeamTransport(id, relay, options)`

`LunaSSHHelpers` exposes asset-path detection and initialization helpers for Next.js, Vite, and generic applications. See [installation](./installation/) for explicit asset setup.

The shared [LunaSSH reference](/reference/lunassh-api/) links back to this page.
