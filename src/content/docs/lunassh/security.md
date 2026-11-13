---
title: Security
---

# Security

LunaSSH verifies SSH host keys by default. Configure one of:

- OpenSSH `knownHosts` entries;
- a SHA-256 or MD5 `hostKeyFingerprint`;
- an OpenSSH `hostKey` public-key pin.

Connections without a matching host identity fail before a terminal session starts. `insecureSkipHostKeyVerification: true` is available only as an explicit opt-in and is unsuitable for production.

Keep Wisp and MoonBeam endpoints authenticated and authorize their egress to approved SSH destinations. Do not embed reusable passwords or private keys in browser bundles. Prefer a per-session credential flow and a restrictive relay policy.
