---
title: Troubleshooting
description: Common Eclipse demo failures.
draft: true
---

# Troubleshooting

If asset downloads fail, set `ECLIPSE_ASSETS_URL` to a mirror or `ECLIPSE_ASSETS_DIR` to a local copy and re-run setup; completed downloads are retained.

`E_NOT_CROSS_ORIGIN_ISOLATED` means COOP/COEP is not active. The demo service worker needs a second page load, so hard-refresh once. If port 8080 is busy, serve `deploy/demo` on another port. `E_WISP_HANDSHAKE` indicates that the configured Wisp server cannot be reached; choose another endpoint or operate a compatible server.

If the persistent demo loops during bootstrap, clear the page's OPFS storage in browser developer tools and reload.
