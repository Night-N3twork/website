---
title: Storage and VFS
---

# Storage and VFS

`bootRepl` selects one of two built-in filesystem modes: persistent `tfs` storage or ephemeral `memory` storage. It does not accept an arbitrary VFS adapter option. Applications that need a custom composition can build on Dusk's exported `createTfsBackend`, `createMemoryBackend`, and `createLayoutBackend` primitives.

`tfs` is the default and uses TFS backed by the browser Origin Private File System (OPFS), so its files survive reloads. `memory` is useful for disposable workspaces and tests. With the default layout enabled, only `/home/<user>` is mounted on the persistent backend. The layout seeds `/etc` in ephemeral storage; `/tmp`, `/proc`, `/etc`, and other transient state do not persist.

`FSBackend` supports text and byte reads and writes, directory operations, rename, stat, and descriptor-style handles. Custom layouts must provide both persistent and ephemeral `FSBackend` values plus the process manager, user, and hostname expected by `createLayoutBackend`.

Clearing browser storage deletes all OPFS data for the origin, not just a Dusk directory. Keep unrelated OPFS applications on a separate origin when that distinction matters.
