---
title: Architecture
---

# Architecture

`bootRepl()` initializes a filesystem, a `ProcessManager`, and built-in binaries. The process manager runs on the browser main thread. SpiderMonkey WASI is a fallback engine, not the primary runtime path. Worker-side processes communicate with host services through synchronous IPC.

The engine pool can pre-warm fallback SpiderMonkey instances to reduce spawn latency. Set `skipPidZero: true` for a terminal that only launches children, such as `/bin/dsh`; this avoids creating the idle REPL engine and saves approximately 100 MB according to the public API documentation. Core process configurations can run in less than 100 MB of RAM, depending on selected engines and workload. In `skipPidZero` mode, `feed()` rejects because there is no pid-0 REPL.

The filesystem layer, Nova HTTP transport, MoonBeam relay listener, PTY manager, stream registry, file-descriptor tables, and signal routing are host services shared by the process manager rather than features of an individual worker.
