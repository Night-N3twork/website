---
title: DPM
description: The Dusk Package Manager.
---

# DPM

DPM 1.0.0 is the browser-only Rust WebAssembly core of the Dusk Package Manager. The npm package exports an async WASM initializer and `execute(args, capabilities, cwd, context)`; it does not ship a native Node CLI, install a terminal command, or expose the legacy TypeScript API.

Inside Dusk 1.0.1, the host integrates this core behind `/bin/dpm` and compatibility entry points. The supported core covers help, DPM and npm install aliases, and `npm exec` planning; it is not a general npm replacement. Read [installation and use](./installation-and-use/) and [browser limitations](./browser-limitations/) before relying on a command.

The self-hostable [DPM Registry](./registry/) is nested here because it is a DPM package-distribution component, not a separate NightDocs product. Its public root catalog and npm-style search endpoint let users discover packages before installing them.
