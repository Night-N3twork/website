---
title: Deployment
---

# Deployment

Dusk requires `SharedArrayBuffer` for synchronous IPC between its Web Workers and host. Deploy it in a secure, cross-origin-isolated context. Production and LAN/device testing need HTTPS, except that browsers treat `localhost` as a secure context.

Return both headers from the document and runtime asset responses:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

These are the COOP and COEP requirements that make `crossOriginIsolated` true. Missing either header, serving ordinary HTTP away from localhost, or loading an incompatible cross-origin resource prevents Dusk from booting. Verify this in the deployed browser, not only in a local build.

The persistent `tfs` option also requires OPFS and the Web Locks API. Dusk uses a Web Lock to serialize origin-wide TFS metadata mutations. Dusk's zlib support depends on `CompressionStream` and `DecompressionStream`; validate target browser support before presenting the runtime as generally available.

Deploy every asset emitted by the browser bundler. The published 1.0.1 build dynamically loads optional chunks, including a large `babel-*.js` chunk, and those requests must receive the same compatible cross-origin policy as the main bundle.
