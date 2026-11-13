---
title: Space
description: Space games, deployment profiles, and universal proxy-context integration.
---

Space is a games/library interface with a standalone proxy runtime and a
document-local delegated runtime. External games, including legacy `engine:
iframe` entries, use the selected runtime rather than bypassing its policy.

- [Deployment and shoestring](/services/space/deployment/): server/static builds,
  HTML/SVG entries, configured endpoints, source mirrors and operator requirements.
- [Universal proxy bridge](/services/space/proxy-bridge/): adapter contract,
  readiness, navigation ownership, lifecycle and unsupported conditions.

These are source-level deployment instructions, not a claim of a published
production service. Configure your own Space origin in the owning host; there is
no guessed production URL. Controlled localhost acceptance and external smoke
results are tracked in Space's `VERIFICATION.md`.
