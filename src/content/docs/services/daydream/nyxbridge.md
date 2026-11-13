---
title: NyxBridge
description: Authenticated NyxAI-to-Daydream RPC bridge and API surface.
---

# NyxBridge

NyxBridge connects an allowlisted NyxAI iframe to Daydream's browser controls. It injects a client bundle only into approved real origins, authenticates a session against the specific iframe, and dispatches registered methods to the tab, proxy, DOM, storage, and browser-data handlers.

## Trust model

The default allowlist is `https://nyx.night-x.com`, `https://nyx.ampscat.dev`, and `https://nyxai.me`. The `aiBridgeDevOrigin` browser setting can add one development origin. At initialization, Daydream creates a random host marker; the handshake issues a 32-byte nonce and session ID, and expects `SHA-256(nonce:hostMarker:nyx-bridge-v1)`. The completion path uses constant-time comparison, binds the trusted session to its iframe, and rejects wrong origins, unknown or removed sessions, and mismatched message sources.

## Prefill flow

The omnibox can queue a `?`-mode query before navigating to `ddx://ai`. NyxBridge holds one payload per iframe in a `WeakMap`, then dispatches `__nyx_prefill` after that iframe completes its handshake. A later queued value replaces an earlier one. `dispatchPrefillNow()` is for an already-handshaken frame; it is intentionally a no-op when no content window exists.

## API surface

The `DDX` API is asynchronous. Its namespaces are:

- `tabs`: query, get/create/update/remove/duplicate/reload, history movement, capture, messaging, movement/grouping, and events.
- `scripting`: execute scripts, CSS operations, and registered content scripts.
- `dom` and `input`: page snapshots, element handles, query/read/mutate-style actions, keyboard, and mouse operations.
- `webNavigation`: frame inspection, waits, and navigation lifecycle events.
- `cookies`, `storage`, `history`, and `bookmarks`: browser data access.
- `windows`, `debugger`, `search`, `dialogs`, `runtime`, `auth`, and `host`: browser/window control, debug commands, search, dialog handling, runtime metadata, Night+ identity, and bridge capabilities.

`DDXError` codes include `tab_not_found`, `frame_not_found`, `element_not_found`, `timeout`, `nav_aborted`, `permission_denied`, `handshake_required`, `session_expired`, `cdp_error`, `invalid_argument`, and `not_supported`. `session_expired` is returned when the session is unknown or has been removed, not because it elapsed by time. Callers must handle these as normal remote-operation outcomes.
