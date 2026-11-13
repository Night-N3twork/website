---
title: Authentication
---

# Authentication

All publishing requires `Authorization: Bearer <token>`. The registry SHA-256 hashes the presented token and compares it against configured hashes using a constant-time comparison. It never needs the original token value after configuration.

Scopes are either `*` or prefixes ending in `/*`; for example, an `@acme/*` token can publish `@acme/widget` but cannot publish `@other/widget`. A failed authentication responds with 401 and `WWW-Authenticate: Bearer`; a valid token outside its package scope receives 403.

Set `read_auth` to `true` when packuments and tarballs must also require bearer authentication. `/-/ping` stays public even then, while `/-/whoami` always requires a token. The installed DPM fetch client does not send authorization headers, so read authentication is not a drop-in DPM private-registry workflow.
