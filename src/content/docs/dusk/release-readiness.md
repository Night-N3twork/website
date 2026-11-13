---
title: Dusk 1.0.1 Release
description: Supported workflows, intentional boundaries, and deployment checks for published Dusk 1.0.1.
---

# Dusk 1.0.1 Release

Dusk 1.0.1 is the published browser-native, pure-JavaScript Node workspace runtime. It is not a promise to execute every Node workload or native addon. Install it from npm with `npm install @nightnetwork/dusk@1.0.1`; no sibling build is part of the consumer workflow.

## Supported Workflows

- CommonJS and ESM packages, package `exports` and `imports`, `require.resolve()`, and package bin launchers.
- Persistent `/home/<user>` and `/project` workspaces backed by TFS or OPFS.
- The bundled DPM command uses the published `@nightnetwork/dpm@1.0.0` browser Rust/WASM core for DPM-registry installs, explicit npm installs, controlled npm fallback, lockfiles, cache, offline and frozen installs, supported local/workspace sources, peers, and immutable GitHub or GitLab commit archives.
- Dsh, child processes, PTY-compatible terminal streams, `curl`, and browser-native archive CLI packages.
- Dusk's documented Vite 5 runtime workflows; the standalone published-package demo also verifies consumer bundling with patched Vite 7.
- Nova-backed outbound HTTP(S), TLS clients, and relay-only TLS/HTTP/1.1 HTTPS servers.
- LunaSSH's separately built `lunassh/dusk` adapter when a Wisp or MoonBeam transport and host-key policy are supplied.

## Intentional Boundaries

- Arbitrary native `.node` addons are unsupported. Use package-specific JavaScript or WASM replacements.
- Vite 8/Rolldown WASI is not part of the 1.0 contract.
- Advanced TLS features including mTLS, SNI callbacks, PFX/passphrases, HTTP/2, certificate reload, and custom cipher configuration are not supported.
- LunaSSH requires verified host-key configuration by default. Explicit insecure mode is available only when the caller opts in.
- DPM does not run lifecycle scripts. It also does not support arbitrary Git clones or a full npm-style dependency backtracking solver.

## Consumer Deployment

1. Install the published Dusk 1.0.1 package and its declared dependencies from npm; do not build or serve sibling repositories.
2. Deploy every emitted worker, WASM, and dynamic JavaScript asset, including the lazy Babel chunk.
3. Serve the document and runtime assets over HTTPS (or localhost) with COOP `same-origin` and COEP `require-corp`.
4. Verify `crossOriginIsolated`, `SharedArrayBuffer`, and, for persistent TFS, OPFS plus Web Locks in the target browser.
5. Configure any Wisp or MoonBeam endpoint used by networking or LunaSSH and supply explicit SSH host-key policy.
6. Run the standalone demo smoke for Dusk `Ready`, `dpm --help`, direct and MoonBeam-routed Nova HTTPS status responses, redirect and duplicate-header handling, and Nova/libcurl.js WebSocket echoes without assuming MoonScale authentication or SSH credentials. Run persistent refresh, package installation, curl, MoonScale, and SSH checks separately when those workflows are release requirements.

## Verification

The standalone demo's published-consumer gate includes package and lockfile integrity checks, typecheck, a Vite production build, and a Chromium smoke on a free strict port. The smoke requires zero failed requests, page errors, unhandled rejections, and console errors.
