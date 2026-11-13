---
title: Troubleshooting
description: Diagnose Nova mux, TLS, proxy, and browser integration failures.
---

# Troubleshooting

## `NoTransport` or transport-not-ready errors

In Rust, provide a connected and handshaken mux through `NovaClient::builder().mux(...)` or `NovaHandle::set_mux()`. In the published JavaScript package, use a configured `LibCurl`; the exported `NovaClient` does not wire its stored transport to a mux and cannot be fixed by waiting or retrying.

## Requests hang after handshake

Ensure a receive loop calls `transport.recv()` and sends every frame to `Mux::dispatch_inbound()`. Post-handshake DATA, stream confirmations, and CONTINUE credits require that pump. The WASM `LibCurl` layer starts it; a native caller integrating at the transport level must do so itself.

## TLS configuration fails

Keep peer verification enabled. Check that the selected minimum and maximum TLS versions overlap and that a supplied PEM bundle contains certificate blocks. On wasm32, replace filesystem-backed CA and key options with supported in-memory or browser-appropriate configuration.

## Proxy connection fails

Validate the first hop's Wisp-reachable host and port, then check the chain order. Each proxy negotiates to the next proxy, not directly to the final destination until the last hop. SOCKS and HTTP CONNECT failures are surfaced as proxy negotiation errors.

## JavaScript WebSocket code fails

`LibCurl.WebSocket` is available through `new client.WebSocket(url, protocols?, options?)`; its factory is bound to that `LibCurl` instance. Configure the instance's transport first, register event handlers immediately, and wait for `onopen` before sending. Failures are reported through `onerror` and `onclose`, including mux and connection failures. `NovaClient.connectWebSocket()` remains a separate placeholder-wired path; use the `LibCurl` factory or HTTP fetch/session flows where suitable.

## `LibCurl.TLSSocket` does not connect

Create it with `new client.TLSSocket(host, port, options?)` from the configured `LibCurl` instance. It opens asynchronously over a Wisp TCP stream, so wait for `onopen` and do not send before then because pre-open sends are dropped. Inspect `onerror` and `onclose` for mux, proxy, certificate, TLS-handshake, and stream failures.
