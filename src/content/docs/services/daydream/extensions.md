---
title: Extensions
description: Helium extension hosting, lifecycle, and compatibility boundaries.
---

# Extensions

Daydream's extension layer is Helium. `ExtensionManager` tracks spawned extension contexts, their hidden or auxiliary frames, ports, content-script relays, permission grants, storage, popup windows, URL overrides, and handler implementations. It validates at construction that every registered handler has a permission mapping.

## Lifecycle

At initialization Helium creates its container and installs the content-script relay, port router, scripting handlers, active-tab listeners, and handler families. The manager then exposes implementations for browser APIs including tabs, windows, alarms, runtime, extension, bookmarks, history, cookies, i18n, web navigation, action, commands, notifications, context menus, omnibox, web request, declarative network request, DevTools, permissions, side panel, downloads, identity, management, idle, offscreen, debugger, and declarative content.

Extension packages are unpacked and stored by the extension filesystem layer. Extension-hosted `https://<id>.ddx/` pages are served locally through a plugin, avoiding an attempted network fetch for the synthetic host. Content scripts and extension pages communicate through the relay/channel infrastructure.

## Permissions and overrides

Handlers are permission-gated. Active-tab grants are maintained per extension, and URL overrides are coordinated so install can stage an override while disable or uninstall removes its active and pending slots. Do not assume that a manifest permission makes every Chromium API available: the API may be implemented, partially implemented, or an explicit stub.

## Compatibility warning

Helium is a compatibility layer, not Chromium. It has known stubs across API families, including tab groups, reading list, web authentication proxy, permissions operations, browsing-data removal, parts of DevTools, identity, context menus, web request, and legacy timing APIs. Test an extension against the exact APIs it uses and consult [limitations](./limitations/) for concrete examples.
