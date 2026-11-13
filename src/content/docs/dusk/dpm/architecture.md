---
title: Architecture
description: DPM package resolution, verification, installation, and runtime paths.
---

# Architecture

DPM 1.0.0 ships one public runtime: a Rust core compiled to browser WebAssembly. The npm package contains wasm-bindgen JavaScript, declarations, and WASM. It has no native Node CLI and does not ship the legacy TypeScript implementation.

## Host boundary

The browser host initializes the WASM module, calls `execute`, and supplies explicit asynchronous filesystem, network, and output capabilities. This keeps browser policy and storage ownership outside the package manager. Dusk 1.0.1 supplies those capabilities when it exposes the built-in `dpm` command.

The `@nightnetwork/dpm/wasm` export lets bundlers emit the WASM as an asset URL. `execute` is asynchronous and returns captured output plus an optional execution plan; it never starts a native process.

## Install path

The core accepts one or more root requests, verifies and caches tarballs, safely extracts package files, installs registry dependencies in nested npm paths, resolves peers at the project root, writes lockfile metadata, and creates browser launchers for package bins. Direct DPM installs use the DPM registry with controlled npm fallback; `dpm npm install` uses the public npm registry.

Supported root requests include registry versions and tags, HTTPS tarballs, `file:` directories or tarballs, restricted workspace selectors, and immutable GitHub/GitLab `git+https` commits. Transitive requests remain registry-version-only, lifecycle scripts are disabled, and general npm command parity is outside the contract. See [browser limitations](./browser-limitations/).
