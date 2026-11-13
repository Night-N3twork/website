---
title: Troubleshooting
description: Diagnose LunaSSH asset, transport, and session failures.
---

# Troubleshooting

## Initialization fails

`SSHClient.initialize()` needs both `lunassh.wasm` and `wasm_exec.js` to be served to the browser. Confirm the URLs passed through `wasmPath` and `wasmExecPath`, or the paths selected from `publicDir`, resolve successfully. The initialization error identifies a missing asset, a failed WASM fetch, a failed Go runtime load, or a timeout waiting for the SSH runtime.

Do not connect until initialization resolves. `SSHClient.connect()` rejects when the client is not initialized.

## Direct Wisp connection fails

Confirm that the Wisp endpoint is reachable and that it can open TCP to the configured SSH host and port. The Wisp transport waits for the Wisp handshake before it opens the SSH stream. When stream-open confirmation is used, `connectionTimeoutMs` bounds the wait; its default is 30 seconds.

If the transport reports that it is already connected, create a new transport instance for a new connection. If it reports that it is not connected, call `connect()` before `send()`.

## MoonBeam transport does not open

Pass an existing relay with an `attach()` method. LunaSSH obtains a `MessagePort` from that relay, opens a nonzero Wisp stream, and waits for its initial CONTINUE credit. Stream ID 0 is reserved and cannot be selected. Check the relay's upstream Wisp connection and the SSH destination it can reach.

## Authentication or host-key verification fails

Verify the user credentials and the SSH server's real OpenSSH host-key entry or pin. Do not use `insecureSkipHostKeyVerification` outside development. See [security](./security/) for the available verification choices.

## Session ends unexpectedly

The direct Wisp transport closes its Wisp stream and client when either peer closes. The MoonBeam transport closes its `MessagePort` when the stream closes. Handle the session or transport close in application code, release terminal UI state, and create a new session when reconnecting.
