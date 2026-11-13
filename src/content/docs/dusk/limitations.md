---
title: Limitations
---

# Limitations

Dusk is Node.js-compatible, not Node.js running natively. Its public compatibility table marks `node:util` as partial and `node:dns`, `node:cluster`, and `node:worker_threads` as unimplemented. Treat other Node module behavior as runtime-specific unless it is documented or tested.

The process model consumes browser memory. SpiderMonkey WASI is the fallback engine, and the public documentation estimates that omitting an idle pid-0 SpiderMonkey engine can save about 100 MB. Core process configurations can run in less than 100 MB of RAM, but total use varies with selected engines, packages, and workload. Persistent storage is origin-scoped OPFS, so users can erase it by clearing site data.

Networking requires an explicitly supplied Nova proxy or MoonBeam relay for the relevant use case. Browser security requirements are non-negotiable: Dusk cannot boot without `SharedArrayBuffer`, cross-origin isolation, and the corresponding COOP/COEP deployment headers.

Arbitrary native `.node` addons and Vite 8/Rolldown WASI are outside the supported browser runtime contract. DPM keeps lifecycle scripts disabled and does not support arbitrary Git clones or a full npm-style dependency backtracking solver. See [1.0 release readiness](./release-readiness/) and [browser limitations](./dpm/browser-limitations/) before depending on advanced package or registry behavior.
