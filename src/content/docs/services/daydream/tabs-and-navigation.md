---
title: Tabs and Navigation
description: Iframe-backed tabs, internal routes, groups, and extension overrides.
---

# Tabs and Navigation

`Tabs` owns an ordered `tabs` array, `activeTabId`, group state, pinned tab IDs, iframe and element maps, split-layout state, a recently-closed stack, and a navigation stack. It composes separate lifecycle, manipulation, frame, metadata, history, pin, group, and menu modules rather than placing all behavior in one class.

## Tab model

Creating a tab assigns an ID such as `tab-1`, creates a managed iframe, creates a visible tab element, and associates both by ID. The default URL is `ddx://newtab`. Bookmarks and protocol URLs navigate through `Protocols`; ordinary URLs are passed to `Proxy.redirect()` and loaded in the active iframe.

The UI supports searching open tabs by title or URL, pinned tabs, groups, reordering and moving tabs between groups, split pairs, closed-tab restoration, history integration, and per-tab metadata watching. A split pair records the focused side because it owns the address bar and navigation controls.

## Internal and proxied URLs

Internal pages use the `ddx://` scheme. Proxied frames retain an encoded iframe URL, so consumers that need the real URL use the proxy decoder rather than treating `iframe.src` as the destination URL.

## Extension-owned pages

Helium can serve an extension page at `https://<extension-id>.ddx/...`. `TabLifecycle` recognizes that host only when the extension is running, creates an extension plugin for it, and wires the auxiliary RPC channel before navigation. Wiring before `load` is required: wiring after a fast local extension page has loaded leaves its `chrome.*` calls waiting for a channel.

Extensions may declare `chrome_url_overrides` for `ddx://newtab`, `ddx://bookmarks`, and `ddx://history`. Overrides are coordinated separately and are staged for user confirmation. While an extension-new-tab page is active, its plugin does not enforce host policy so entering a normal address-bar URL can leave the extension page.
