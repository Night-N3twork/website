---
title: Limitations
description: Explicit current constraints, stubs, and stale artifacts in Daydream.
---

# Limitations

Daydream is under active implementation. These limits are explicit in the current source and should be treated as product constraints.

## Hosting and transport

- Static hosts are unsuitable: Fastify must serve the application and accept `/wisp/` WebSocket upgrades.
- The supported source does not establish Vercel deployment support. `vercel.json` points to obsolete `index.js`, while the executable server entry is `index.ts`.
- The README is stale: its `config.example.js`/`config.js` setup does not match the current configuration model and the named clone path is outdated.
- A Cloudflare Quick Tunnel is for temporary development sharing, not a production service.

## Extension compatibility

Helium has explicit throwing stubs. Examples include `chrome.loadTimes`, `chrome.csi`, `chrome.tabGroups.get/move/query/update`, reading-list methods, all `chrome.webAuthenticationProxy` methods, several permissions operations, and portions of DevTools, identity, context menus, web request, browsing-data removal, and legacy APIs. Extension manifests and API names are not proof that a feature works.

Some methods exist as generic shared API stubs while Daydream's `ExtensionManager` supplies selected browser-side handlers. Verify the actual handler path for the API an extension needs; do not assume one layer's interface overrides another in every context.

## Browser model

- Browsing is iframe-backed and proxied. It does not provide native-browser process isolation or complete Chromium behavior.
- NyxBridge access is limited to its allowlisted origins and iframe-bound authenticated sessions. It is not a general page automation endpoint.
- Night+ CAPTCHA integration is explicitly disabled in active proxy initialization because repeated hook-handshake failures occurred.
- The generated Wisp fallback and Wisp endpoint detection are runtime behavior, not an availability or reconnection guarantee for an upstream server.
- The TAPP build packages a Terbium application and shares its Wisp/VFS integration; it does not create a tb-repo catalog submission.
