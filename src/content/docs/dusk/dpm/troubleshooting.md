---
title: Troubleshooting
description: Diagnose DPM registry, lockfile, cache, integrity, and browser-install failures.
---

# Troubleshooting

## The selected registry is unexpected or rejected

The browser core uses an HTTPS `--registry` argument first, then `DPM_REGISTRY` from the execution context. It does not read `.npmrc`, scoped routing, or npm configuration environment variables. Direct DPM installs otherwise use the DPM registry with controlled npm fallback; `dpm npm install` uses public npm. See [configuration](./configuration/) and [browser limitations](./browser-limitations/).

## An install reports fetch or resolution errors

Read `status`, `stdout`, and `stderr` from `execute` before treating an install as successful. Confirm that the selected registry contains the requested package and every registry-version transitive dependency, then review [dependency resolution](./dependency-resolution/) and [private registries](./private-registries/).

## Offline or frozen installation fails

Both `--offline` and `--frozen-lockfile` require an existing lockfile. Frozen installs also require the lockfile's root entries to satisfy the manifest, and neither mode can use a missing or integrity-invalid cached tarball. Do not combine `--frozen-lockfile` with new package arguments. Use a normal install to refresh the lockfile and cache when network access is available, then retry the constrained install. See [lockfiles](./lockfiles/).

## A cached tarball fails integrity verification

DPM verifies cached and downloaded tarballs before installation. A failed verification leaves the artifact unusable for offline or frozen installation. The 1.0.0 browser core has no cache-management command; the embedding host must remove the affected cache data before a normal, network-enabled install can repopulate it. See [installation and use](./installation-and-use/).

## A browser install lacks an expected npm feature

The Rust WASM package intentionally has no native Node CLI and does not provide full npm parity. It supports multiple root requests and documented HTTPS tarball, `file:`, restricted workspace, and immutable Git sources, but not lifecycle scripts, `.npmrc` routing, authenticated registries, aliases, general hoisting, or commands outside its help/install/exec surface. Design the browser installation around that documented subset. See [browser limitations](./browser-limitations/).
