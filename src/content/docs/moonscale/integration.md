---
title: Integration
description: Connect MoonScale to a tailnet and manage its lifecycle.
---

# Integration

Create a client, surface interactive authentication, and wait for the runtime to report state through your callback before relying on tailnet connectivity.

```ts
import { MoonScaleClient } from '@nightnetwork/moonscale';

const client = await MoonScaleClient.create({
  onAuthURL: (url) => showAuthenticationLink(url),
  onState: (state) => console.log(state),
  onError: (error) => console.error(error),
});

client.login();

const socket = await client.dialTcp('100.64.0.10', 443);
socket.on('data', (data) => console.log(data));
socket.on('error', (error) => console.error(error));
socket.on('close', () => console.log('closed'));
socket.send(new Uint8Array());
```

Use `dialUdp()` for a UDP socket, including `sendTo(data, host, port)`. `listenTcp()` accepts a socket and peer callback; `listenUdp()` receives a datagram and peer callback. Close individual sockets and listeners when they are no longer needed, then call `await client.close()` to release every client-owned resource.

`stateStorage` can persist runtime node state. `authKey`, `hostname`, and `controlURL` are forwarded during runtime initialization. Keep authentication material out of source control. For exit-node, DNS, Funnel, HTTP, and WebSocket behavior, see [API reference](./api-reference/) and [security](./security/).
