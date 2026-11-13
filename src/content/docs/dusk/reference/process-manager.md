---
title: Process Manager
description: Spawn and observe Dusk's browser-hosted processes.
---

# Process Manager

`ProcessManager` owns the Dusk engines, process records, registered binaries, PTYs, streams, file-descriptor tables, and relay cleanup for one booted runtime.

```ts
const child = await processManager.spawn('/bin/dsh', ['-c', 'echo hello'], {
  cwd: '/home/user',
  env: { PATH: '/bin' },
  stdin: 'optional initial input',
});
const status = await child.exit;
```

`spawn()` returns a `DuskProcessHandle`: `pid`, `exit: Promise<number>`, byte-oriented `stdin`, `stdout`, `stderr`, `kill()`, and `master` only when a PTY was requested. `spawnSync()` returns collected `Uint8Array` stdout/stderr and a numeric `status`; it is asynchronous at the JavaScript API boundary despite its synchronous-style result.

## Lifecycle

PIDs start at 1; pid 0 is reserved for the optional REPL engine. `activePids()` reports current records and `getProcess(pid)` returns a handle while it is live. When an engine exits, Dusk closes stdout/stderr, detaches its PTY, removes stream/FD state, cleans up relay sockets and listeners owned by that PID, and resolves `exit`.

`kill()` terminates the underlying engine. It is not a typed signal API. In-process `process.kill()` routes named signals; `SIGKILL` terminates immediately, while `SIGSTOP` and `SIGCONT` are explicitly best-effort no-ops in the shipped host implementation.

## Spawn options and binaries

`SpawnOptions` accepts `env`, `cwd`, `stdin`, and `pty`; the `args` field is declared but the public method already receives arguments separately. `stdin` accepts a string, `Uint8Array`, or number array. Use absolute binary paths such as `/bin/dsh`.

`registerBinary(name, source)` installs source immediately. `registerLazyBinary(name, loader)` defers loading until first spawn. `listBinaries()` includes eager and lazy names, but `getBinarySource()` returns `undefined` for a lazy binary until it has been loaded; use `loadBinarySource()` if source is required.

The host registers `/bin/dsh`, `/bin/sh`, and `/bin/jsh` eagerly. Node, Python, SQLite, and DPM-family binaries are lazy in the shipped source, so their first use can fetch a code-split bundle.

## Process metadata

`getProcessRecord(pid)` returns a snapshot of PID, parent/group IDs, argv, executable path, environment, cwd, title, and start time. It is inspection data, not a stable OS process table. `getStreamRegistry()` and `getPtyManager()` expose host utilities for integrations that need them.

## Known limits

Each process is a browser-hosted engine, not a native child process. Process groups, signals, environment, and executable resolution are compatibility surfaces with documented implementation gaps. Test the exact binary and lifecycle you intend to use in the target browser.
