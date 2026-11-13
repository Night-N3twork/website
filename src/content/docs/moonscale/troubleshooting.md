---
title: Troubleshooting
description: Diagnose MoonScale runtime, authentication, and connection failures.
---

# Troubleshooting

## Runtime creation fails

MoonScale requires a browser with Web Worker, WebAssembly, and `fetch` support. Confirm that the package runtime assets are present in the built application. If you supply `wasmURL`, ensure it resolves to the runtime WASM asset. A worker startup failure is reported as a MoonScale runtime error.

## The client needs authentication

Provide `onAuthURL` and present the reported URL through the application. MoonScale does not open authorization URLs. Confirm that the application connects to an existing tailnet and that any supplied `authKey` or `controlURL` is valid for that tailnet.

## Dials or listeners fail

Wait for client creation to complete and inspect `onError`. Check the destination host, port, tailnet policy, and current authentication state. A client cannot create new dials or listeners after `close()`. Close sockets and listeners deliberately when finished so they do not remain active until client shutdown.

## State storage fails in the worker

When using `stateStorage`, the worker requires `SharedArrayBuffer` to synchronously bridge storage access. Omit `stateStorage` if the application cannot provide that browser capability, or configure the application environment so `SharedArrayBuffer` is available.

## HTTP or Tailscale WebSocket traffic is not certificate-verified

`fetch()` and `createTailscaleWebSocket()` disable TLS certificate verification in the current WASM runtime. This is not a connection error, but it is a security boundary: do not treat a successful HTTPS request to a non-tailnet destination reached through an exit node as certificate-verified. See [security](./security/).

## Exit-node or Funnel configuration does not take effect

Use an ID returned by `listExitNodes()` with `setExitNode()`, then inspect the read-only `exitNode` selection. Funnel uses Tailscale Funnel on ports 443 and 8443; other ports use a direct netstack listener. Call `clearExitNode()` or `clearFunnel()` to remove prior configuration.
