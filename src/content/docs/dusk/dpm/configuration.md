---
title: Configuration
---

# Configuration

The published 1.0.0 browser core has no `dpm config` command and does not read `.dpmrc` or `.npmrc`. Select a registry for a direct DPM install with an HTTPS `--registry` argument:

```sh
dpm install @acme/widget --registry https://registry.example.com
```

The host can also set `DPM_REGISTRY` in the execution context passed to `execute`. `--registry` takes precedence over that context value. Direct DPM installs otherwise use the DPM registry and may fall back to npm after a registry `404` unless `--no-npm-fallback` is set. `dpm npm install` uses the public npm registry.

Registry bases must use HTTPS in the browser path. Scoped `.npmrc` routing and authenticated registry configuration are not part of the 1.0.0 package contract.
