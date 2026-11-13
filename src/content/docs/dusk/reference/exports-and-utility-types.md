---
title: Exports and Utility Types
description: Public Dusk exports and the boundary between declarations and shipped behavior.
---

# Exports and Utility Types

The package root exports these runtime values:

```ts
bootRepl
createRunner
createEngine
ProcessManager
startRepl
createMemoryBackend
createTfsBackend
createLayoutBackend
initEnginePool
isPoolWarm
prewarmEngine
```

Its root declaration also exports `RelayListener` and `RelaySocket` as types, plus `BootReplNetOptions`, `BootReplOptions`, and `BootReplResult`. `BootReplResult` extends `DuskRepl`, whose only method is `feed(line): Promise<void>`.

Useful host types are declared in public submodules but are not re-exported from the root declaration: `FSBackend`, `LayoutOptions`, `SpawnOptions`, `DuskProcessHandle`, `SpawnSyncResult`, `Pty`, `PtyManager`, `LibCurl`, `NetHost`, and `ReplEngine`. Import only paths exposed by the package's `exports` map. The package explicitly exposes `.` and `./src/*`; do not depend on `lib/types/*` paths as public import paths.

## Declared versus actual behavior

Declarations describe shapes, not all behavioral constraints. Source inspection for this release establishes the following caveats:

- `skipPidZero` still returns an `engine` typed as `EngineInstance`, but it is a stub; `run` and `dispatch` throw.
- A result still has `feed()` in its type with `skipPidZero`, but calling it rejects rather than acting as a REPL.
- PTY `master` exists only for PTY spawns and terminal echo travels through it separately from `stdout`.
- `FSBackend` describes generic handle methods, while the composed layout routes handles to its ephemeral backend and synthetic mounts reject them.
- Signal names are accepted by the internal compatibility layer, but stop/continue semantics are not native process suspension.

Pin the package version, test against the target browser, and treat source-derived behavior as version-specific. The DPM Registry documentation is separate under [DPM](../../dpm/).
