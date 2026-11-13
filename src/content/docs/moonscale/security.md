---
title: Security
description: MoonScale TLS and credential handling constraints.
---

# Security

## TLS verification is disabled

MoonScale's `fetch()` and `createTailscaleWebSocket()` use `TLSClientConfig.InsecureSkipVerify: true`. The browser WASM runtime has no operating-system root certificate store, so these APIs do **not** validate server certificates.

Traffic within a Tailscale tailnet is already carried in an encrypted WireGuard tunnel. That does not authenticate a non-tailnet destination reached through an exit node. Do not treat HTTPS through these APIs as certificate-verified transport; use a separately verified application protocol when that guarantee is required.

## Credentials and state

MoonScale passes a supplied auth key to Tailscale Connect during initialization and does not retain it in the client. `stateStorage`, when provided, is passed to the runtime for persistent node state. Keep auth keys out of source control and choose state storage appropriate to the browser application's security boundary.
