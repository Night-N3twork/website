---
title: MoonScale Setup
description: Start a browser MoonScale client and observe tailnet state.
---

# MoonScale Setup

The demo creates `MoonScaleClient` only after the user starts it. A Tailscale account and an appropriate auth flow are prerequisites; use an auth key or complete the supplied browser authorization URL.

```ts
import { MoonScaleClient } from '@nightnetwork/moonscale';

const client = await MoonScaleClient.create({
  authKey: undefined,
  onState: (state) => console.log(state),
  onAuthURL: (url) => console.log('Authorize:', url),
  onNetMap: () => console.log(client.addresses),
  onError: (error) => console.error(error.message),
});
```

Topology: the browser MoonScale client joins or observes a tailnet through its control and transport path. It can later supply `fetch`, TCP dial/listen, and DNS operations to the demo bridge.

Verify `client.state` and at least one value in `client.addresses` after a netmap update. Close it with `await client.close()` when finished. Exit-node and Funnel actions require tailnet policy and authorization; the demo exposes controls but cannot grant those permissions.

## Connect and make a tailnet request

```ts
import { MoonScaleClient } from '@nightnetwork/moonscale';

const client = await MoonScaleClient.create({
  onAuthURL: (url) => window.open(url, '_blank', 'noopener'),
  onState: (state) => console.log('MoonScale state:', state),
  onError: (error) => console.error('MoonScale error:', error),
});

client.login();

// Wait for a connected state or netmap update in application code before use.
const response = await client.fetch('https://100.64.0.10/health');
console.log(response.status, await response.text());

await client.close();
```

`fetch()` routes through the Tailscale dialer. It is useful for a service on the tailnet, but it currently disables TLS certificate verification in the WASM runtime. Do not use it as a substitute for application-level authentication or integrity checks.

## TCP and DNS

```ts
const address = await client.resolveDNS('service.tailnet.ts.net', 443);
const socket = await client.dialTcp(address, 443);

socket.send(new TextEncoder().encode('GET / HTTP/1.1\r\nHost: service\r\n\r\n'));
socket.on('data', (bytes) => console.log(new TextDecoder().decode(bytes)));

socket.close();
```

Use `resolveDNS()` for MagicDNS names before dialing when the target is not already an IP address. Socket callback and close semantics are exposed through the `MoonScaleTcpSocket` type; clean up sockets and listeners before calling `client.close()`.

## Exit node and Funnel

```ts
const [exitNode] = client.listExitNodes();
if (exitNode) {
  await client.setExitNode(exitNode.id, { allowLANAccess: false });
}

// Expose a service through a Tailscale Funnel-capable port.
await client.setFunnel(443, '127.0.0.1:8080');

// Restore direct dialer routing and remove Funnel/serve configuration.
await client.clearExitNode();
await client.clearFunnel();
```

Exit-node selection affects `dialTcp`, `dialUdp`, and `fetch`. Funnel requires tailnet authorization and uses the standard Funnel path only for ports 443 and 8443; other ports use a netstack listener rather than public Funnel exposure.

Known limit: this is a browser integration demo. Consult [MoonScale security](/moonscale/security/) before using its network paths, including the documented TLS verification constraints.
