---
title: Networking
description: Wire LibCurl or relay listeners into Dusk's browser-host networking surface.
---

# Networking

Dusk's public network bridge is based on a LibCurl-shaped object, not Node's native socket stack.

```ts
type LibCurl = {
  load_wasm(url?: string): Promise<void>;
  set_websocket(url: string): void;
  fetch(url: string, opts?: unknown): Promise<Response>;
  WebSocket: new (url: string, protocols?: string[]) => WebSocket;
  HTTPSession?: new (opts?: unknown) => { fetch(url: string, opts?: unknown): Promise<Response>; close(): void };
  TLSSocket?: new (host: string, port: number, opts?: unknown) => {
    onopen: (() => void) | null;
    onmessage: ((data: Uint8Array) => void) | null;
    onclose: (() => void) | null;
    onerror: ((error: unknown) => void) | null;
    send(data: Uint8Array): void;
    close(): void;
  };
};
```

Supply `loadLibcurl` and `proxyUrl` through `bootRepl({ net })`. Boot creates the host bridge, while `createNet` obtains the default LibCurl instance, calls `load_wasm()`, and calls `set_websocket(proxyUrl)` together on its first use. The LibCurl object therefore must implement both methods, but callers do not need to preload its WASM or configure its initial Wisp WebSocket.

```ts
const runtime = await bootRepl(write, {
  net: {
    loadLibcurl: async () => libcurl,
    proxyUrl: wispUrl,
  },
});
```

## Nova and MoonBeam topology

The `night-network-demo` creates a Nova `LibCurl`, calls `load_wasm()`, configures the Wisp URL, then creates another Nova client bound to a `MoonbeamRelay`. Dusk receives a LibCurl loader and the same relay. The effective topology is:

```text
Dusk process -> Dusk LibCurl host functions -> Nova LibCurl -> Wisp WebSocket
                                             \-> MoonBeam relay -> shared Wisp WebSocket
```

Choose one transport path per request. MoonBeam multiplexes browser clients over its upstream; it does not turn Dusk into a general-purpose server or remove browser network policy.

## Relay listener contract

`RelayListener.registerListener(host, port, handler)` returns a disposer. The accepted `RelaySocket` has `onData`, `onClose`, `send`, and `close`. Passing a relay to `bootRepl` gives the process manager this listener bridge; process cleanup unregisters listeners and closes relay sockets owned by an exiting PID.

## TLS socket contract

`TLSSocket` is optional, but an implementation that provides it must expose writable `onopen`, `onmessage`, `onclose`, and `onerror` properties initialized to `null` or callbacks. Dusk assigns those handlers immediately after construction. Call `onopen` when the TLS connection is ready, call `onmessage` with each received `Uint8Array`, call `onclose` when it closes, and call `onerror` with the failure value. `send()` accepts a `Uint8Array` and `close()` ends the socket. Dusk forwards these events to the owning in-runtime socket; an error removes the socket as a terminal event.

## Browser isolation and limits

Network requests run under browser origin, CSP, mixed-content, WebSocket, CORS, and service-worker constraints. Dusk does not grant raw TCP, arbitrary certificates, or privileged host networking. `TLSSocket`, `HTTPSession`, `transport`, and `version` are optional LibCurl members, so feature-detect them. A `RelayListener` alone does not configure outbound LibCurl networking.

The [NodeWorker adapter](./nodeworker-adapter/) is a separate host integration: it maps a Dusk `TcpProvider` to NodeWorker's named `NetworkAdapter`, including direct Wisp or MoonBeam-backed streams. Its host must supply any TLS-capable stream requested by NodeWorker; it does not create TLS on its own.
