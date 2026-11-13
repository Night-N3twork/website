---
title: Troubleshooting
description: Diagnose MoonBeam setup, handshake, and lifecycle failures.
---

# Troubleshooting

## `ready()` does not resolve

Confirm the Wisp URL is reachable and that the endpoint speaks a compatible protocol. The client has a 10-second default handshake timeout. A v2 exchange expects server INFO, client INFO, then CONTINUE; a v1 server begins with CONTINUE. Keep `allowV1: true` for known v1 infrastructure, or set it to `false` when v2-only behavior is required.

`E_WISP_AUTH_REQUIRED` means the server advertised required authentication that the client cannot complete. `E_WISP_V1_UNSUPPORTED` means a v1 endpoint was reached while fallback was disabled. `E_WISP_UDP_UNSUPPORTED` means a caller requested UDP without negotiated or assumed support.

## Gateway accessor throws `not initialized`

Call and await `gateway.init()` before accessing the stack, TAP, TUN, or soft router. If initialization fails, inspect the gateway `error` event and the Wisp handshake first. A gateway cannot be initialized again after `destroy()`.

## Traffic is blocked

Use `EgressPolicy.onBlocked` or `evaluate()` to capture the denial reason. Check `denyPorts`, hard CIDR denies, reserved-address handling, and loopback protection before widening `allow`. The NATs intentionally synthesize failures for policy-denied traffic rather than forwarding it.

## Relay client does not receive data

Verify that the attached `MessagePort` has been started by the consumer and that frames are sent as binary payloads. The relay tests assert that its initial handshake packet reaches attached ports as an `ArrayBuffer`. Confirm that a matching local listener has not deliberately intercepted the requested host and port.
