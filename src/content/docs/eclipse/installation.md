---
title: Installation
description: Run the Eclipse demo locally.
draft: true
---

# Installation

Eclipse requires Node.js 20 or newer, npm, curl, a Chromium-based browser or Firefox, about 300 MB of disk space, and a Wisp server for outbound networking.

Clone the repository, run `./setup.sh`, then run `npm start`. Setup installs dependencies, downloads Alpine VM assets, extracts the persistent root filesystem, and bundles the demo. The binary VM assets are not committed to source control.

Open `/` for the memory-backed demo. Open `/persistent.html` for the `DedicatedWorkerShell` and OPFS-backed disk persistence. The persistent root filesystem downloads on first use. Set `ECLIPSE_ASSETS_DIR` for a local asset mirror or `ECLIPSE_ASSETS_URL` for another asset URL.
