---
title: Architecture
description: LunaSSH browser, transport, and Go/WASM boundaries.
---

# Architecture

LunaSSH has three layers: the application-facing TypeScript API, a transport adapter, and the Go/WASM SSH runtime. `SSHClient.initialize()` loads `wasm_exec.js`, instantiates `lunassh.wasm`, and waits for the runtime to expose its SSH client in the browser. The TypeScript layer then registers a transport with that runtime before opening an SSH session.

## Transport boundary

The WASM transport manager gives the Go runtime a transport identifier and callbacks. Bytes written by the SSH runtime are sent through the selected transport; bytes received by that transport are injected into the runtime. A transport close also closes its runtime-side transport registration.

## Direct Wisp path

`WispTransport` creates a MoonBeam `WispClient`, waits for its handshake, then opens a TCP stream to the configured SSH host and port. SSH bytes travel between the Go runtime and that Wisp stream. If the server requires stream-open confirmation, the transport waits for it before completing the connection.

## MoonBeam relay path

`MoonbeamTransport` attaches to an existing MoonBeam relay and receives a `MessagePort`. It sends one Wisp packet per port message, opens a TCP CONNECT stream for SSH, and waits for that stream's initial CONTINUE credit before it reports a connected transport. This path shares the relay's upstream Wisp connection rather than creating another direct Wisp client.

See [integration](./integration/) for choosing a transport and [API reference](./api-reference/) for the public types.
