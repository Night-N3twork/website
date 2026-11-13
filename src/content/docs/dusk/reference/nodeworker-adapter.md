---
title: NodeWorker Adapter
description: Run NodeWorker on structural Dusk filesystem and TCP providers.
---

# NodeWorker Adapter

`node-worker` can run an anonymous Node-compatible worker over Dusk's filesystem and TCP abstractions. `createDuskAdapter({ fs, tcp })` is intentionally structural: it imports no Dusk package and accepts objects matching the interfaces below. This is an adapter for NodeWorker, not an addition to Dusk's executable or process registry.

```ts
import {
  createDuskAdapter,
  type DuskFSBackend,
  type DuskTcpProvider,
} from 'node-worker';

const fs: DuskFSBackend = duskFs;
const tcp: DuskTcpProvider = duskTcp;
const adapter = createDuskAdapter({ fs, tcp });
```

## Source contracts

`DuskFSBackend` is the required structural subset of Dusk's `FSBackend`:

```ts
interface DuskFSBackend {
  readFileBytes(path: string): Promise<Uint8Array>;
  writeFileBytes(path: string, data: Uint8Array): Promise<void>;
  readdir(path: string): Promise<string[]>;
  mkdir(path: string, opts?: { recursive?: boolean }): Promise<void>;
  rm(path: string, opts?: { recursive?: boolean }): Promise<void>;
  stat(path: string): Promise<{
    isFile: boolean;
    isDirectory: boolean;
    size?: number;
    mtimeMs?: number;
    atimeMs?: number;
    ctimeMs?: number;
    birthtimeMs?: number;
  }>;
  rename(from: string, to: string): Promise<void>;
}

interface NetworkStream {
  /** Required to authorize a TLS request; true only after host verification. */
  tls?: { verified: boolean };
  write(data: Uint8Array): Promise<void> | void;
  end(): Promise<void> | void;
  close(): Promise<void> | void;
  onData(callback: (data: Uint8Array) => void): void;
  onEnd(callback: () => void): void;
  onError(callback: (error: unknown) => void): void;
}

interface NetworkAdapter {
  open(host: string, port: number, options?: {
    tls?: boolean;
    servername?: string;
    alpnProtocols?: string[];
  }): Promise<NetworkStream>;
}

interface DuskTcpProvider extends NetworkAdapter {
  open(host: string, port: number, options?: NetworkOpenOptions): Promise<DuskTcpStream>;
}
```

`NetworkAdapter` is the named public NodeWorker contract. `DuskTcpProvider` is its Dusk-facing structural equivalent, and `DuskTcpStream` is the same byte-stream contract as `NetworkStream`. NodeWorker uses that provider directly and does not initialize its Epoxy/Wisp transport when this adapter is installed.

## Dusk Nova TLS provider

When Dusk boots with both `net.loadLibcurl` and `net.proxyUrl`, `bootRepl()` exposes `tcpProvider`. It preserves raw `node:net` connections over Wisp and sends TLS/HTTPS requests through Nova's Rustls client over that same Wisp or MoonBeam WebSocket route. Pass the exposed provider directly to NodeWorker:

```ts
import { bootRepl } from '@nightnetwork/dusk';
import { createDuskAdapter } from 'node-worker';

const dusk = await bootRepl(write, {
  skipPidZero: true,
  net: { loadLibcurl: async () => libcurl, proxyUrl: wispOrMoonBeamUrl },
});
if (!dusk.tcpProvider) throw new Error('Dusk network route is not configured');

const adapter = createDuskAdapter({ fs: duskFs, tcp: dusk.tcpProvider });
```

For a TLS request, Dusk forwards NodeWorker's `servername` and `alpnProtocols` to Nova. Nova uses `servername` (or the dial host when omitted) for both TLS SNI and Rustls hostname validation, advertises the requested ALPN values, and uses Nova's bundled WebPKI root set to validate the chain. The provider resolves only after Nova's TLS handshake opens and then attaches `tls: { verified: true }`. A Wisp connection is never marked verified by itself. Handshake, route, certificate-chain, hostname, or ALPN setup failures reject `open()` and do not produce a stream.

The built-in Dusk provider does not support custom CA roots, client certificates, TLS version/cipher controls, OCSP controls, or `rejectUnauthorized: false`. It is intentionally not an SSH adapter and does not create a TLS server. A Dusk boot configured only with a relay attachment, without Nova `loadLibcurl` and `proxyUrl`, retains raw TCP only and rejects TLS requests rather than returning unverified bytes.

## VFS mapping and operations

`adapter.createVfs({ mount, readOnly })` creates a fresh `NodeVfs` and mounts the Dusk provider below its memory root. `mount` defaults to `/`, but `/` is rejected because the adapter cannot replace NodeWorker's root overlay. Use an absolute non-root mount such as `/project`.

For every backend operation, NodeWorker first canonicalizes the requested provider path from `/`, then joins it to the mount root. Thus, a provider mounted at `/project` maps `/nested/../input.bin` to the Dusk backend path `/project/input.bin`. This is mount-local mapping, not a pass-through of the caller's spelling; callers cannot escape the mount with `..`.

The provider supports `stat`, `readdir`, byte `readFile`, byte `writeFile`, `mkdir`, `rm`, and `rename`. `readdir` rejects backend names that are `.`, `..`, contain slash or backslash, or contain control characters before it joins or stats them; this prevents a malicious backend listing from escaping the mount. It stats each accepted returned name and returns a complete listing. Returned file data is copied both when read and when written, so callers and backends do not share the same `Uint8Array` buffer. A string passed to `writeBinary` is encoded by NodeWorker's VFS; a `Uint8Array` remains byte data.

Mount read-only behavior is enforced by `NodeVfs`: writes, directory creation, removal, and rename through a `{ readOnly: true }` mount reject with `EROFS` before the Dusk backend is mutated. The adapter does not independently make the supplied backend read-only.

Errors with a string `code` are normalized into NodeWorker VFS errors using that code, preserving filesystem outcomes such as `ENOENT`. Other failures become `EIO` and retain the original error message. Metadata uses supplied `size` and timestamps when present; absent timestamp fields are filled from the available timestamp or the current time.

The adapter does not provide timestamp mutation: `utimes` reports unsupported to the provider contract. It also does not advertise native range reads, native file streams, or `statfs`, because `DuskFSBackend` has no corresponding primitive. Do not infer handle, symlink, watch, range, stream, timestamp, or filesystem-capacity support from this adapter.

`createVfsProvider(mount?)` is available when mounting into an existing `NodeVfs`. It defaults to `/`; unlike `createVfs`, that helper only creates a provider and does not replace a root mount itself.

## Worker and binary lifecycle

`createWorker(workerURL, cwd, options?)` creates an anonymous worker, mounts the Dusk VFS at `cwd`, and installs `adapter.network` as its network adapter. `cwd` must therefore be a non-root mount path. Its options omit `vfs`, `net`, and `networkAdapter`; the adapter always supplies those values.

`writeBinary` is not a Dusk executable registry. It writes JavaScript source or bytes into the mounted VFS. Start the resulting path with `worker.import()` for ESM or `worker.require()` for CommonJS.

```ts
import { createDuskAdapter } from 'node-worker';
import workerURL from 'node-worker/worker?url';
import swURL from 'node-worker/sw?url';

const adapter = createDuskAdapter({ fs: duskFs, tcp: duskTcp });
const vfs = adapter.createVfs({ mount: '/project' });

await adapter.writeBinary(
  vfs,
  '/project/cli.js',
  'console.log("hello from the mounted Dusk VFS");\n',
);

const worker = await adapter.createWorker(workerURL, '/project', { swURL });
try {
  await worker.import('/project/cli.js', {
    argv: ['node', '/project/cli.js'],
  });
} finally {
  worker.terminate();
}
```

Synchronous `require` still needs NodeWorker's service worker (`swURL`) in scope of `workerURL`. Set `requireSyncFs: false` only for code that intentionally avoids `require` and synchronous `fs` APIs. The worker is anonymous: its filesystem and network authority come solely from the supplied Dusk providers.

## TCP lifecycle and TLS

`adapter.network` maps each NodeWorker connection request to `tcp.open(host, port, options)`. Register `onData`, `onEnd`, and `onError` on each returned stream. NodeWorker exposes those callbacks as a readable stream; data is copied before enqueueing, end closes it, and error errors it.

NodeWorker awaits `write()`, preserving write order, backpressure, and write failures. Closing the writable side calls and awaits `end()`. Aborting the writable side or cancelling the readable side calls and awaits `close()`. It also closes every still-live host stream once when the NodeWorker terminates. `open()` failures are returned to the worker as connection failures. Hosts should make `end` and `close` safe for their own teardown paths and release Wisp, MoonBeam, or other transport resources when `close` runs.

```ts
const tcp = {
  async open(host: string, port: number, options?: {
    tls?: boolean;
    servername?: string;
    alpnProtocols?: string[];
  }) {
    const connection = await connectDuskTransport(host, port, options);
    return {
      tls: options?.tls ? { verified: connection.tlsVerified === true } : undefined,
      write: (bytes: Uint8Array) => connection.write(bytes),
      end: () => connection.end(),
      close: () => connection.close(),
      onData: (listener: (bytes: Uint8Array) => void) => connection.onData(listener),
      onEnd: (listener: () => void) => connection.onEnd(listener),
      onError: (listener: (error: unknown) => void) => connection.onError(listener),
    };
  },
};
```

For `tls.connect` and HTTPS, NodeWorker passes `{ tls: true, servername, alpnProtocols }` to `open`. The Dusk Nova provider above honors this request and returns verified metadata only after Rustls validates the peer. Other host adapters must do the same. NodeWorker never authorizes a host TLS stream without explicit metadata: missing or `false` verification rejects the default `rejectUnauthorized` connection, while `rejectUnauthorized: false` connects with `authorized === false`.

## Security and testing

Treat the mounted path as the worker's writable authority: mount only the directory the code should access, use `readOnly` for immutable inputs, and validate or restrict code before `writeBinary` imports it. The provider prevents mount traversal through canonical path mapping, but it does not sandbox a backend that itself exposes sensitive files under the chosen mount. Secure the supplied TCP provider, relay credentials, destination policy, and TLS behavior according to its Wisp, MoonBeam, or other host transport.

Test an integration with a fake or test Dusk backend that records paths and copies bytes. Cover canonical paths such as `/nested/../input.bin`, byte values including `0x00` and `0xff`, backend error codes and uncoded errors, and read-only write rejection. For TCP, use a deferred `write()` to verify ordered backpressure; assert that stream error reaches the consumer, writable close calls `end`, and readable cancellation or writable abort calls `close`. Run NodeWorker's adapter test suite and the documentation checks before release.

See [Filesystem and VFS](./filesystem-and-vfs/) for Dusk's own broader filesystem contract and [Networking](./networking/) for Dusk's LibCurl, Nova, and MoonBeam browser-host networking model.
