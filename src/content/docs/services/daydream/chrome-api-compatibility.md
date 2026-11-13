---
title: Chrome API Compatibility
description: Current Helium and ExtensionManager compatibility matrix for Chrome extension APIs.
---

# Chrome API Compatibility

This is a source-based compatibility guide for extensions running in Daydream. It describes the current `ExtensionManager` dispatch path and Helium runtime, not the Chrome API type surface. A namespace can be present in `chrome` while its method is still a throwing stub. Likewise, a method registered by `ExtensionManager` is only an implementation path, not a claim of complete Chromium behavior.

The matrix prioritizes `src/apis/extensions.ts` (`ExtensionManager.handlerImpls()`), Helium host handlers, and Helium tests in the current DDX source. The MV2/MV3 API class stubs are used to identify methods that have no host override. See [Extensions](./extensions/) for lifecycle and permissions, [Runtime and Proxy](./runtime-and-proxy/) for the iframe/proxy model, and [limitations](./limitations/) for broader product constraints.

## Reading the Matrix

- **Supported** means a concrete host implementation is registered for the listed family. It remains subject to its manifest permission and available Daydream host services.
- **Partial** means a handler exists, but it has a documented no-op, synthesized result, omitted Chrome behavior, host dependency, or limited method subset.
- **Unsupported/stubbed** means the current execution path throws, is a type-only surface, or has no `ExtensionManager` override. Do not use it as a feature-detection fallback.

All extension calls pass `ExtensionManager.runChromeHandler()`: the method must be registered, its mapped manifest permission must be granted, and its handler must be available. Content scripts, extension pages, and background contexts are relayed through iframe/window channels, so browser-process semantics do not apply.

## Matrix

| Namespace or family | Status | Current behavior and constraints |
| --- | --- | --- |
| `tabs` | Partial | Registered: query/get/current, create/update/remove/duplicate/reload/back/forward/capture/move/group/ungroup, language, discard, highlight, zoom, and `sendMessage`. Most tab operations dispatch to NyxBridge and therefore require the Daydream tab host. `detectLanguage` returns `und`; discard returns tab data; highlight and zoom APIs synthesize/no-op results; reader mode throws. `sendMessage` reaches relayed content scripts and resolves `undefined` after 30 seconds when no reply arrives. |
| `runtime` and message ports | Partial | `sendMessage` uses the background channel with the `onMessage` response contract. Runtime and tab ports are routed through Helium; the port test covers privileged extension-page sender origin and URL. Registered runtime utilities include reload, platform info, options pages, update check, and `getContexts`; package directory access throws. Context enumeration is limited to known iframe-backed background, popup, offscreen, tab, and content-script contexts, with no incognito support. |
| `storage` | Supported | Registered local, sync, session, and managed get/set/remove/clear and byte/key operations use extension storage. This is Daydream extension storage, not Chromium profile sync or enterprise policy infrastructure. |
| `alarms` | Supported | Create, get, getAll, clear, and clearAll are host handlers. Test timing, persistence, and lifecycle behavior against the extension's target use case. |
| `i18n` | Partial | Message lookup, UI language, accept languages, and language detection are registered. Treat locale availability and detection fidelity as host-defined rather than Chrome-equivalent. |
| `action`, `browserAction`, `pageAction`, and `commands` | Partial | Action state, badges, icons, popup settings, enablement, and page-action visibility are persisted and connected to Daydream's toolbar. `openPopup` needs the host popup opener; `getUserSettings` always reports toolbar placement. `commands.getAll` is registered; command dispatch remains dependent on host keyboard integration. |
| `scripting` and content scripts | Partial | Execute/inject/remove CSS plus dynamic content-script registration, lookup, and removal are registered. Injection targets a Daydream iframe and evaluates wrappers in `MAIN` or `ISOLATED` mode; file/function failures are logged and still yield an undefined result. The injector test covers ordered isolated scripts. All-frames/document targeting and native renderer isolation are not complete Chromium semantics. |
| `windows` | Partial | Get/list/create/update/remove dispatch through NyxBridge's window handlers. Window behavior is constrained by Daydream's host UI rather than native browser windows. |
| `bookmarks` and `history` | Supported | Registered CRUD/tree/search bookmark methods and history search/visits/add/delete methods operate on Daydream managers. They do not expose a Chromium profile shared with another browser. |
| `sessions` | Partial | Recently-closed and restore are registered against Daydream's closed-tab stack; device sync returns an empty array. The exposed shared API methods are otherwise stubs unless the ExtensionManager path is active. |
| `cookies` | Partial | Get, list, set, remove, and cookie-store listing use `CookieAccessor` over the active proxy cookie jar. They depend on proxy initialization and the upstream/proxied site; cookie stores are synthesized as one store (`0`) with no tab membership. |
| `webNavigation` | Partial | Only frame lookup and all-frame lookup are registered. Navigation events and full native frame/document semantics are not a supported claim. |
| `webRequest` | Unsupported/stubbed | The event objects are exposed, but the only registered method is `handlerBehaviorChanged`, a no-op because there is no handler cache. The manager may install a proxy-dependent hook when its controller is ready, but that is not full request observation or blocking support. |
| `declarativeNetRequest` (DNR) | Partial | Dynamic/session/static ruleset operations, match queries, regex checks, and test matching are registered, and changes invalidate/sync the DNR engine. Rule enforcement depends on the active proxy/service-worker integration. Static-rule quota always reports 30,000, per-rule static disables return `[]`, and `updateStaticRules` is a no-op. |
| `contextMenus` and `menus` | Partial | Create/update/remove/removeAll are registered. Rendering, click delivery, item contexts, and host-menu integration are limited by Daydream's UI; do not infer full Chrome menu behavior from registration. |
| `downloads` | Partial | Download/search/pause/resume/cancel/remove/erase/open/show/shelf methods are registered through the Daydream downloads manager. Native file-system UI, danger handling, and folder behavior are host-dependent. |
| `devtools` | Partial | Panel/sidebar creation, resource handler, inspected-window operations, and HAR retrieval are registered only when the DevTools host is available. The shared bootstrap surface contains throwing methods until this host path is wired; test from a real Daydream DevTools session. |
| `debugger` | Partial | Attach/detach/sendCommand/getTargets are registered only when `CdpHelper` is installed; otherwise calls report debugger unavailable. Sessions are per extension/tab, one debugger owns a tab, and commands/events depend on the proxied tab's CDP helper. |
| `permissions` | Partial | getAll, contains, request, and remove are implemented for manifest and persisted optional grants. Requests require Daydream's Nightmare prompt and are denied if it is unavailable; requests must be declared optional. Host-access request methods remain stubs. |
| `identity` | Unsupported/stubbed | Auth-token retrieval and web-auth flow throw. Profile info and accounts are empty placeholders; redirect URL generation works, while token-cache removal methods are no-ops. |
| `management` | Partial | Installed extension listing, details, enable/disable, uninstall, and self-uninstall are implemented through extension storage. Permission-warning calls always return `[]`; app launch/shortcut/launch-type APIs throw. |
| `offscreen` | Partial | One hidden extension iframe per extension can be created, queried, and closed. It requires `Proxy.createFrame` and extension plugin/channel wiring; this is an iframe-backed document, not a native offscreen document runtime. |
| `sidePanel` | Partial | Options and panel behavior persist globally or per tab. `open()` intentionally resolves without rendering because Daydream has no extension side-panel UI slot; `getLayout` is stubbed. |
| `proxy` | Unsupported/stubbed | Helium exposes proxy constants, an event, and a `ChromeSetting` object, but there is no registered `chrome.proxy.settings` implementation. It cannot configure Daydream's browsing proxy. See [Runtime and Proxy](./runtime-and-proxy/). |
| native messaging | Unsupported/stubbed | `chrome.runtime.connectNative` and `sendNativeMessage` are registered specifically to throw "Native messaging is not supported." No native host bridge exists. |

## Important Source Boundaries

`ExtensionManager.handlerImpls()` is the authoritative dispatch layer for a spawned extension. The MV2/MV3 `Chrome` classes intentionally expose a broader API shape, many methods in that shape throw until a host handler replaces them. For example, Helium's own API classes contain stubs for scripting, action, DNR, DevTools, side panel, offscreen, sessions, and several other namespaces, while the manager selectively registers implementations for active extension contexts.

Host dependencies change the result materially:

- Tab, window, frame, content-script, and debugger behavior depends on the iframe-backed Daydream host and NyxBridge/CDP routes.
- Cookies, request handling, DNR enforcement, downloads, and offscreen documents depend on the initialized proxy/controller and its available services.
- Permission prompts, action popups, commands, menus, side panels, and DevTools require corresponding Daydream UI integration. A resolving handler can still be data-only or a deliberate no-op.

## Extension Author Guidance

1. Use a feature call with error handling, not namespace or method presence, to determine whether your extension can proceed.
2. Declare both the API permission and any host permissions required by the operation. A manifest declaration permits dispatch; it does not create unavailable host capability.
3. Test messaging, scripts, cookies, DNR, and debugger behavior against the proxy configuration and real destinations you support.
4. Treat the [limitations](./limitations/) page as product constraints and the [Extensions](./extensions/) page as the lifecycle/hosting reference.
