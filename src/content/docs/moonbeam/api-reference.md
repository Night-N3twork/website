---
title: API Reference
description: Primary MoonBeam public exports.
---

# API Reference

MoonBeam's package root re-exports the modules below. Consult the TypeScript declarations for the complete type surface.

## `MoonbeamRelay`

```ts
const relay = await MoonbeamRelay.create(options);
const port = relay.attach(metadata?);
relay.detach(port);
const unregister = relay.registerListener(host, port, handler);
await relay.close();
```

Use `clientCount()`, `streamCount()`, `listenerCount()`, `clientsSnapshot()`, `listenersSnapshot()`, and `isClosed()` for observability. Snapshot methods return frozen views; do not treat them as mutable configuration.

## `WispClient`

```ts
const client = new WispClient({ url, allowV1, udpAssumedInV1 });
await client.ready();
const stream = client.createStream('example.com', 443, 'tcp');
```

A `WispStream` exposes `readable`, `writable`, `send()`, `close()`, `closed`, and event registration. Call `createStream()` only after `ready()` resolves. `udpSupported`, `confirmStreamOpen`, `motd`, `isV1`, and `connected` expose negotiated state.

## `Gateway`

Construct with a required `wispUrl` plus optional LAN, DHCP, DNS, egress, and Wisp compatibility settings. Call `init()` before `getStack()`, `getTap()`, `getTun()`, `getSoftRouter()`, `connectTcp()`, `listenTcp()`, or `openUdp()`. `getVmIp()` returns the resolved VM address even if DHCP is disabled.

## Policy and packets

`EgressPolicy` accepts `allow`, `deny`, `denyPorts`, `allowLoopback`, and `onBlocked`. `permits(ip, port, proto)` returns a boolean without allocating on the allow path; `evaluate()` returns an allow/deny result with a reason. Packet exports include Ethernet, IPv4, TCP, UDP, ICMP, ARP, CIDR, MAC, and IP conversion helpers.
