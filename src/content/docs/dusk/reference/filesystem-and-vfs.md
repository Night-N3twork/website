---
title: Filesystem and VFS
description: Compose Dusk filesystem backends and understand the default layout.
---

# Filesystem and VFS

`FSBackend` is asynchronous. It provides text and byte file methods, directory operations, `stat`, rename, and file-handle operations. All methods accept an optional `{ pid }` caller identity. Optional `symlink`, `readlink`, and `lstat` are not guaranteed by every backend.

```ts
import {
  createMemoryBackend,
  createTfsBackend,
  createLayoutBackend,
  ProcessManager,
} from '@nightnetwork/dusk';

const persistent = await createTfsBackend();
const ephemeral = createMemoryBackend();
const manager = new ProcessManager(persistent);
const fs = await createLayoutBackend({
  ephemeral,
  persistent,
  processManager: manager,
  user: 'user',
  hostname: 'duskjs',
});
```

`createMemoryBackend()` is synchronous and ephemeral. `createTfsBackend()` is asynchronous and is the `bootRepl` default. Browser persistence still depends on the backing storage and browser policies; do not treat it as durable server storage without testing your deployment.

## Layout composition

`createLayoutBackend()` combines two backends and the manager. The user home (`/home/<user>`) maps to the persistent backend. Most other ordinary paths map to the ephemeral backend. It seeds `/etc/hostname`, `passwd`, `group`, `os-release`, and `profile`, then creates `/tmp`, `/root`, `/var`, and `/home`.

`/bin` is a synthetic read-only view of manager binaries. `/proc` is a synthetic read-only view with limited process fields such as `cmdline`, `environ`, `status`, `cwd`, and `exe`. `/dev` exposes limited `null`, `zero`, random, and stdio-like names. These are compatibility views, not host OS mounts.

## Handles and cross-mount rules

The interface exposes `openHandle`, `readHandle`, `writeHandle`, `fstatHandle`, `ftruncateHandle`, `fsyncHandle`, and flag constants including `O_CREAT`, `O_TRUNC`, and `O_APPEND`. In the shipped layout implementation, handle operations route only to the ephemeral backend. Synthetic mounts reject byte writes and handle operations with `ENOSYS`; cross-mount rename rejects with `EXDEV`; synthetic writes reject with `EROFS`.

That behavior is more specific than the broad `FSBackend` declaration. Keep durable application data under the configured user home, avoid assuming handles work on every mount, and use copy-plus-remove rather than cross-device rename.

For the narrower `node-worker` bridge, see [NodeWorker adapter](./nodeworker-adapter/). It maps a structural Dusk backend under a non-root NodeWorker mount and supports only byte file, directory, stat, and rename operations; it does not add handles, symlinks, timestamp mutation, native ranges or streams, or `statfs`.
