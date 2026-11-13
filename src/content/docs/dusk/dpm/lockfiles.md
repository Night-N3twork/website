---
title: Lockfiles
---

# Lockfiles

DPM reads and writes `package-lock.json` with `lockfileVersion: 3`. It records the root package plus package entries keyed by npm-style installation paths such as `node_modules/foo` and nested conflict paths. Resolved entries retain the version, tarball URL, integrity string, registry, dependency map, and development flag when available.

Use `dpm install --frozen-lockfile` to require an existing lockfile whose root entries satisfy the manifest. It also requires verified cached tarballs. `dpm install --offline` requires a lockfile and installs only cached artifacts whose integrity values verify; it does not download a missing tarball.

Do not add packages with `--frozen-lockfile`: the command rejects that combination. Normal installs update the lockfile after resolution; frozen installs leave it unchanged.
