---
title: Limitations
description: Eclipse browser and deployment constraints.
draft: true
---

# Limitations

Eclipse is browser-hosted and requires a Wisp server for outbound networking. The persistent demo depends on `FileSystemSyncAccessHandle` and worker support; Safari may not support the required combination.

The downloaded VM assets are substantial, and first boot depends on their availability and network speed. Memory mode does not persist VM disk state. Persistent mode requires browser storage and cross-origin isolation. Wisp v1 compatibility is enabled by default because v2 is not widely deployed; set `allowV1: false` only when v2-only operation is required.
