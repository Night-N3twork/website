---
title: Runtime and Proxy
description: Scramjet controller, transport selection, service worker, and Wisp behavior.
---

# Runtime and Proxy

`Proxy` coordinates the browser-side browsing runtime. It reads the selected transport from settings (default `libcurl`), resolves a Wisp URL, creates the Scramjet controller against the active service worker, waits for it, and installs runtime hooks.

## Wisp resolution

The runtime resolves Wisp in this order:

1. A synchronous Terbium override in `window.__ddxOverrideWisp`.
2. The saved `wisp` setting.
3. The same-origin `/wisp/` endpoint if `checkServerWisp()` succeeds, using `ws:` or `wss:` from the current page protocol.
4. A generated fallback Wisp server URL.

The selected URL is persisted to settings. `swapWispServer()` changes the endpoint at runtime. This is a transport decision, not a guarantee that an arbitrary remote endpoint or deployment topology is supported.

## Controller hooks

After the controller is ready, the proxy installs event bridging, script injection, DevTools integration, downloads, site permissions, error pages, NyxBridge frame hooks, and an HTTP cache plugin manager. The cache is origin-scoped and distinguishes HTTP methods; earlier code comments identify a historical HEAD/GET cache-key collision as the reason for that requirement.

## Terbium runtime

When built as a TAPP, the early boot script detects `parent.tb` and looks for a parent Wisp URL in this order: `parent.$scramjet.config.wisp`, `parent.tb._sj.config.wisp`, `parent.tb.proxy.wispUrl`, then same-origin `/wisp/`. It publishes the result before Proxy initialization, persists it, can hot-swap an already-created proxy for up to five seconds, and notifies the service worker. Without a parent Terbium bridge, the module does nothing and standalone fallback behavior applies.
