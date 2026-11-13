---
title: Runtime and Boot
description: Boot a Dusk browser runtime and understand the resulting host handles.
---

# Runtime and Boot

```ts
bootRepl(write, options?): Promise<BootReplResult>
startRepl(runner, write): DuskRepl
```

`bootRepl` is the public convenience boot path. Its first argument receives decoded REPL output. The result has `feed(line)`, `processManager`, and `engine`; `node` is present only for `via: 'node'`.

## Options

`fs` is `'tfs' | 'memory'` and defaults to `'tfs'`. `user` and `hostname` default to `user` and `duskjs`. `seed` writes a record of path-to-text entries after the effective backend is created. Parent directories are created while seeding.

`layout` defaults to `true`. With it enabled, Dusk composes persistent storage, an in-memory ephemeral backend, and synthetic system mounts. Set `layout: false` only when the raw selected backend is what the application expects.

`via` defaults to `'startRepl'`. That route wraps input through the pid-0 engine. `via: 'node'` instead spawns `/bin/node`, appends a newline to every `feed()` call, and forwards decoded child stdout and stderr to `write`.

`runtime` selects the pid-0 and child-process engine factory. It is `'native' | 'spidermonkey-legacy'` and defaults to `'native'`. The legacy value initializes the SpiderMonkey engine pool before boot; use it only when the application needs that compatibility runtime rather than the default native runtime.

`nativePackageReplacements` injects browser-owned source for exact package specifiers that would otherwise depend on native code. It accepts either a record or an ordered tuple list:

```ts
type NativePackageReplacementEntry = readonly [
  specifier: string,
  source: string,
  scope?: {
    packageVersion?: string;
    packagePathSuffix?: string;
    packageEntryPath?: string;
  },
];

type NativePackageReplacementEntries =
  | Readonly<Record<string, string>>
  | readonly NativePackageReplacementEntry[];
```

Record entries apply to the exact specifier. Tuple entries can additionally require a resolved package version or package-root suffix; `packageEntryPath` chooses the virtual replacement path for a matching package entry. Caller entries with the same specifier replace Dusk's built-in `esbuild` or `rollup` replacements. Specifiers must be package-style names, not absolute or relative paths, and cannot end in `.node`.

`net` has these complete valid shapes:

```ts
type BootReplNetOptions =
  | {
      loadLibcurl: () => Promise<LibCurl>;
      proxyUrl: string;
      relay?: RelayListener;
      relayTls?: RelayTlsHostCapability;
    }
  | {
      relay: RelayListener;
      relayTls?: RelayTlsHostCapability;
      loadLibcurl?: never;
      proxyUrl?: never;
    };

type RelayTlsHostCapability = {
  Connection: new (
    certificateChain: string | Uint8Array,
    privateKey: string | Uint8Array,
    options?: unknown,
  ) => TlsServerConnection;
  authorize: (request: {
    hostname: string;
    port: number;
    pid: number;
    tls: boolean;
  }) => boolean;
};

type TlsServerConnection = {
  onciphertext: ((data: Uint8Array) => void) | null;
  onplaintext: ((data: Uint8Array) => void) | null;
  onsecure: (() => void) | null;
  onerror: ((error: unknown) => void) | null;
  onend: (() => void) | null;
  acceptCiphertext(data: Uint8Array): void;
  writePlaintext(data: Uint8Array): void;
  close(): void;
};
```

The LibCurl shape creates Dusk's outbound network host functions. Either shape can provide `relay` for in-runtime listener bridging; a relay alone does not create a LibCurl client. `relayTls` is a host capability for relay-backed TLS server listeners: Dusk constructs `Connection` with the in-runtime server certificate and key, sends encrypted bytes to the relay through `onciphertext`, accepts inbound encrypted bytes through `acceptCiphertext()`, and exposes plaintext after `onsecure`. It only permits a listener when `authorize()` returns `true` for its hostname, port, PID, and TLS request. It requires `relay`; providing the capability alone does not expose a TLS server.

## Minimal boot

```ts
import { bootRepl } from '@nightnetwork/dusk';

const repl = await bootRepl((text) => console.log(text), {
  fs: 'memory',
  seed: { '/home/user/hello.txt': 'hello\n' },
});

await repl.feed("require('node:fs').readFileSync('/home/user/hello.txt', 'utf8')");
await repl.engine.terminate();
```

## pid-0 trade-off

`skipPidZero: true` avoids creating the pid-0 SpiderMonkey worker. In the shipped source this saves the worker allocation, but changes behavior: `engine` is only a lightweight stub and `feed()` rejects with an error. Use `processManager.spawn()` to start a shell or program instead.

```ts
const runtime = await bootRepl(console.log, { skipPidZero: true });
const shell = await runtime.processManager.spawn('/bin/dsh', [], {
  pty: { cols: 80, rows: 24 },
});
```

Do not call `feed()` in this mode. The declaration describes a `DuskRepl` result, but the runtime behavior intentionally narrows it.

## Verification and limits

Verify boot with a small seeded read or `spawnSync('/bin/dsh', ['-c', 'pwd'])`. Browser storage availability, the SpiderMonkey worker, and optional LibCurl/WASM assets are runtime prerequisites. This API provides an in-browser runtime; it does not provide OS process execution, Node native addons, or server-side isolation.
