---
title: Limitations
description: Known MoonScale boundaries.
---

# Limitations

MoonScale requires an existing Tailscale tailnet and runs its Tailscale Connect runtime in browser Go/WASM. Interactive authorization is surfaced through `onAuthURL`; the application must present the URL to the user.

## InsecureSkipVerify

Both `fetch()` and `createTailscaleWebSocket()` use `InsecureSkipVerify: true`. Certificate validation is not performed, including for non-tailnet destinations reached through an exit node. This is a current runtime constraint, not an HTTPS security guarantee.

Funnel uses Tailscale Funnel on ports 443 and 8443. Other ports use a direct netstack listener rather than the Tailscale serve proxy. Real-tailnet integration tests require Chromium plus explicitly supplied test credentials and are skipped unless their environment variables are set.
