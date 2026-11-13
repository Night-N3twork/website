---
title: Architecture
description: MoonBeam relay and virtual LAN data paths.
---

# Architecture

MoonBeam has a lightweight relay path and a virtual-machine gateway path. Both use Wisp streams, but they accept different inputs and have different lifecycles.

## Relay path

`MoonbeamRelay.create({ wispUrl })` creates a `WispClient`, waits for its Wisp handshake, and owns that upstream connection. Every `relay.attach()` call returns a distinct `MessagePort`. The attached client sends Wisp frames on that port; the relay opens or maps upstream streams and rewrites stream IDs in both directions. The relay tests cover the handshake gate, per-client ports, CONNECT forwarding, and returning upstream DATA with the client stream ID restored.

The relay can intercept TCP CONNECT requests before they leave the page. `registerListener(host, port, handler)` routes a matching request to a local handler and returns an unregister function. This is useful for an in-page HTTP service or a bridge, not for publishing a browser listener to the Internet.

## Gateway path

`Gateway` constructs a `tcpip`/lwIP stack after its Wisp client is ready. It creates a TUN interface, loopback, and LAN TAP interface in that order because the underlying stack evaluates interfaces LIFO. DHCP is enabled unless `vmIp: null` is supplied.

Guest Ethernet frames reach lwIP for local LAN behavior and a parallel `SoftRouter` for off-subnet forwarding. `TcpNat` and `UdpNat` consume routed IP packets, apply `EgressPolicy`, and create Wisp TCP or UDP streams. Replies are wrapped back into guest-facing Ethernet frames. The custom TUN splitter exists because WHATWG streams permit one reader and writer; it also avoids a `tee()` cancellation deadlock during teardown.

## Wisp compatibility

`WispClient` multiplexes TCP and UDP over one WebSocket. It supports the Wisp v2 INFO/CONTINUE handshake, UDP and stream-open-confirmation extensions, and an optional v1 fallback. `allowV1` defaults to `true`; set it to `false` to reject v1 servers. TCP flow control uses Wisp CONTINUE credit, while UDP does not use credit accounting.

The client does not reconnect itself after an upstream close. Host code must create and install a replacement client. `Gateway.setWispClient()` is an atomic reference swap; surrounding reset, queueing, and old-client shutdown remain orchestration responsibilities.
