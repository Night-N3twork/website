---
title: Architecture
description: Eclipse runtime components and configuration layers.
draft: true
---

# Architecture

The Gateway provides the VM's lwIP-based virtual LAN, DHCP, TCP NAT, and UDP NAT. `WispClient` provides Wisp protocol transport, `EgressPolicy` controls allowed destinations, and `FakeWebSocket` connects the QEMU-wasm socket path without changing browser globals.

`MainThreadShell` is the simplest host and does not provide OPFS persistence. `DedicatedWorkerShell` runs in a Dedicated Worker, enabling `FileSystemSyncAccessHandle` and OPFS-backed disk storage in cross-origin-isolated contexts.

`Eclipse.start(config)` is the intended public entry point. Configuration is resolved from defaults, persisted state, and user input, in that order. Network, storage, graphics, and shell objects are deep-merged; egress allow rules replace prior rules while deny rules and denied ports are accumulated.
