---
title: MoonBeam
description: Browser-side Wisp relay and virtual LAN networking.
---

# MoonBeam

MoonBeam is the browser network stack for Wisp-connected applications. It provides two related paths: `MoonbeamRelay` multiplexes Wisp consumers such as WASM clients over a shared upstream connection, while `Gateway` provides a virtual LAN for QEMU-wasm through DHCP, TCP/UDP NAT, and a packet router.

Install it with `npm install @nightnetwork/moonbeam`. The public package entry point re-exports Wisp framing and types, `WispClient`, packet helpers, `FakeWebSocket`, `EgressPolicy`, `SoftRouter`, DHCP and NAT components, `Gateway`, and `MoonbeamRelay`.

Start with [installation](./installation/), then select the path that matches the consumer:

- Use [MoonbeamRelay](./integration/) when a WASM consumer needs Wisp frames through a `MessagePort`.
- Use [Gateway](./architecture/) when a QEMU-wasm guest needs Ethernet-frame networking.
- Read [security and operations](./security-and-operations/) before widening egress policy or operating a long-lived relay.

MoonBeam targets modern browsers, Web Workers, and Node 20 or later. Its transport and stream APIs rely on `WebSocket`, `MessageChannel`/`MessagePort`, `ReadableStream`, `WritableStream`, typed arrays, and `EventTarget`.
