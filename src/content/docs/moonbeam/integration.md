---
title: Integration
description: Connect WASM clients or QEMU-wasm guests through MoonBeam.
---

# Integration

## Relay for WASM clients

Create one relay for an upstream Wisp connection, then hand the attached port to a consumer that understands Wisp frames. Nova's WASM bindings can accept a MoonBeam relay object and call `.attach()` themselves; when using a lower-level client, pass the returned `MessagePort` according to that client's transport API.

```ts
import { MoonbeamRelay } from '@nightnetwork/moonbeam';

const relay = await MoonbeamRelay.create({
  wispUrl: 'wss://wisp.example.com/',
});

const port = relay.attach({ label: 'worker-client' });
// Transfer or pass `port` to a Wisp-aware worker/client.
```

Detach the port when the consumer is finished, then close the relay when no consumers remain. `attach()` throws once the relay has closed.

## Gateway for QEMU-wasm

Initialize the gateway before connecting QEMU's networking shim. Feed guest frames into both the TAP writable stream and soft-router ingress; send frames emitted by the TAP and soft router back to the guest. `installFakeWebSocket(Module, host)` patches Emscripten's WebSocket constructor for the sentinel gateway URL and returns an uninstall function.

```ts
const gateway = new Gateway({
  wispUrl: 'wss://wisp.example.com/',
  egress: { allow: ['public'] },
});
await gateway.init();

const tap = gateway.getTap();
const router = gateway.getSoftRouter();
```

Use `gateway.destroy()` when the guest exits. It first stops NAT consumers, then tears down the stream splitter, DHCP service, and Wisp client. The operation is designed to be idempotent.

## Local services

For relay consumers, use `registerListener()` to intercept a Wisp TCP destination in-page. For VM-facing services, `Gateway.connectTcp()`, `listenTcp()`, and `openUdp()` bind through the virtual LAN. These are host-side bindings, not browser socket permissions; reserve UDP port 67 for DHCP.
