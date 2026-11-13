---
title: Universal proxy bridge
description: Document-local capability negotiation without host-brand detection.
---

## Contract

`proxy-context-v1` (version 1) negotiates `nested-iframe-navigation` and
`document-fetch` in the current document. Any host may implement it: no service
brand, domain, referrer, query switch or parent-global detection is required.
Nebula and Daydream use host-owned adapter copies with their actual installed
Scramjet controllers. Configure the Space HTTP(S) origin explicitly in the host;
the games URL adds `view=games`. Credentials and non-HTTP(S) origins are rejected.

The client posts `discover` to its own window with a fresh `requestId` and exactly
one transferred MessagePort. The adapter checks source identity/version and
advertises `capabilities` only after document-specific engine hooks are active.
The response carries a fresh `sessionId` and both capabilities. Client `check`
messages correlate request/session IDs; the adapter answers `ready` or
`unavailable`. Discovery is bounded at **1500 ms**, launch readiness at **1000
ms**. Duplicate, stale or wrong-source replies confer no authority. Ports,
timers and listeners are released on settlement/disposal.

Use the emitted `proxy-context-host.js`/declaration and
`proxy-context-adapter.js` with `installScramjetProxyContext(controller,
adapterSource)` before creating/navigating frames. Read the exported types and
protocol tests before writing an alternative adapter. Installing a script alone
does not prove active rewrite hooks. Third-party adapters must truthfully support
the complete document lifecycle and both capabilities, not send unconditional
success from a fake parent. This is capability negotiation, not authentication
or a security boundary; publisher code remains trusted.

## Ownership and failure

Delegated operation means **no local** Space Proxy/BareMux construction, worker
registration, controller boot, or Wisp startup. Space assigns the original game
URL to its iframe; the owning host rewrites it under its own frame prefix and
codec. Never nest the URL under Space's proxy prefix. Document fetch uses that
same session guard. Transport controls are unavailable in delegated mode.

A lost delegated session blocks navigation visibly until reconnection/reload;
there is no raw-network or silent nested-proxy fallback. Document transitions
invalidate sessions. Real BFCache restoration requires fresh negotiation;
synthetic persisted lifecycle tests do not prove browser admission. Record
`persisted` and actual not-restored reasons for genuine attempts.

When diagnosing loss, correlate `requestId` and `sessionId` across check send,
adapter receive/reply and client receipt, together with document generation,
adapter readiness/disposal and deadline firing. A still-ready adapter does not
prove a timely reply: DOM presentation work can delay message delivery. Space
font refreshes batch cascade reads before writes and coalesce mutation bursts
through a cancellable animation-frame refresh; source text and inputs stay
unmodified. This does not extend the 1000 ms readiness deadline or permit late
replies, retries or network fallback.

Paint-only inline style changes avoid unnecessary whole-label refreshes unless
CSS can depend on the style attribute. That conservative dependency check follows
imported stylesheets with cycle protection; opaque or unloaded imports require
refreshes rather than assuming their selectors are safe. Async navigation owns
history before settings preparation, so old-document feedback cannot erase
Forward while the selected destination is still being prepared.

The adapter's bounded active-SVG response envelope lets the owning engine
rewrite the canonical SVG's HTML child. It is not a general XML converter.
Unsupported engines, stale hooks, storage/worker/CSP restrictions and malformed
SVG fail explicitly. Standalone SVG remains XML and is not replaced on disk.

## Deliberate limits

There are no NyxBridge browser-control APIs, credentials, privileged messages or
ancestor relay. Bootstrap worker ownership (`space-bootstrap-v1`) is a distinct
contract and never impersonates proxy delegation. Optional remote APIs still
need operator-managed CORS/authentication. Review `VERIFICATION.md` for current
controlled matrix failures, intermittent-launch diagnosis and BFCache/external
smoke limitations before treating any deployment as accepted.
