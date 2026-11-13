---
title: Reference
---

# Dusk Reference

This reference is grounded in the public declarations and shipped source for `@nightnetwork/dusk` 1.0.1. It documents the browser-host API, not a promise of complete Node.js compatibility or a native runtime.

- [Runtime and boot](./reference/runtime-and-boot/) covers `bootRepl`, `BootReplOptions`, and `BootReplResult`.
- [Process manager](./reference/process-manager/) covers process handles, binaries, signals, and lifecycle.
- [Terminal and streams](./reference/terminal-and-streams/) covers PTYs, `ReadableStream` output, stdin, and resize behavior.
- [Filesystem and VFS](./reference/filesystem-and-vfs/) covers `FSBackend`, backend factories, mounts, and handle limits.
- [Networking](./reference/networking/) covers LibCurl/Nova wiring, relay listeners, and browser isolation.
- [NodeWorker adapter](./reference/nodeworker-adapter/) covers the structural Dusk VFS and TCP bridge for an anonymous NodeWorker.
- [Exports and utility types](./reference/exports-and-utility-types/) lists the public package surface and declaration/source caveats.

The [DPM documentation](../dpm/) and its nested registry pages remain in the DPM section; they are not duplicated here.
