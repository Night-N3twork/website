---
title: Browser Limitations
---

# Browser Limitations

In DuskJS, `dpm install` and `dpm npm install` are implemented by the `@nightnetwork/dpm@1.0.0` Rust WASM core; `i` and `add` are aliases. The browser host supplies explicit network and filesystem capabilities. The core accepts one or more root requests, verifies integrity, safely extracts package files, resolves ordinary registry dependencies into nested npm paths, installs peers at the project root, writes lockfile metadata, and creates browser launchers for package bins.

Browser `--offline` installs use an existing lockfile and verified cached tarballs without network access; a missing lockfile or cache entry fails rather than fetching. Select an HTTPS registry base with `DPM_REGISTRY` or an install command's `--registry` option. The command-line option takes precedence.

This is not a native CLI or complete npm implementation. Lifecycle scripts are disabled. Transitive dependencies must use registry version specifications; workspace selectors and globs are restricted; Git sources must be immutable commits on supported GitHub or GitLab hosts; `.npmrc` routing, authenticated registries, aliases, hoisting, and commands outside the documented help/install/exec surface are unsupported. Root HTTPS tarballs, `file:` directories or tarballs, restricted workspaces, and supported immutable Git sources are available despite those limits.
