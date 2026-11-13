---
title: Private Registries
---

# Private Registries

Point an install at a custom public HTTPS registry for a single command:

```sh
dpm install @acme/widget --registry https://registry.example.com
```

DPM requests package metadata, then downloads the tarball URL listed in the selected version. The 1.0.0 browser core does not read `.npmrc`, implement registry authentication configuration, or attach bearer credentials. A read-protected registry therefore needs a compatible authenticated host or proxy; `--registry` alone only changes the public endpoint.

For a small self-hosted distribution service and its publishing token model, use the nested [DPM Registry](./registry/) documentation. Its public read endpoints can be used by the browser core.
