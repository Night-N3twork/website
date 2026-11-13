---
title: Dependency Resolution
---

# Dependency Resolution

DPM 1.0.0 accepts one or more root requests. Root requests may be registry versions or tags, direct HTTPS `.tgz` URLs, `file:` directories or tarballs, immutable `git+https` commits on supported GitHub or GitLab hosts, or `workspace:*` and `workspace:^` packages from array-form workspace declarations.

Transitive dependencies are limited to registry version specifications and are installed in nested npm paths rather than through a general hoisting solver. Required and optional peers are resolved at the project root when possible. npm aliases, unrestricted workspace globs, mutable Git references, and arbitrary Git hosts are unsupported.

Tarballs are cached, verified against integrity metadata, and safely extracted before installation. The core writes lockfile metadata and browser package-bin launchers; lifecycle scripts are reported as disabled and never run.
