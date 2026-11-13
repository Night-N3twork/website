---
title: Dusk
description: A Node.js-compatible runtime that runs inside a browser tab.
---

# Dusk

DuskJS runs its primary Node-compatible runtime in the browser. SpiderMonkey WASI remains available as a fallback engine rather than the default runtime path. Dusk supplies a POSIX-style shell, SQLite, Python, a virtual filesystem, and optional network transports without moving application execution to a conventional server.

Use Dusk when the browser must host the workspace itself. The main-thread `ProcessManager` owns process lifecycle, IPC, files, networking, signals, and terminal attachments. Core process configurations can run in less than 100 MB of RAM; memory use varies with selected engines, tools, and workloads.

Start with [installation](./installation/), then choose persistent or temporary [storage](./storage-and-vfs/). Package management, including the self-hosted registry catalog and search API, is documented in the nested [DPM](./dpm/) track. See [1.0 release readiness](./release-readiness/) for the supported workflow and deployment checklist.
