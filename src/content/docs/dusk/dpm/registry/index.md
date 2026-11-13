---
title: DPM Registry
description: A small filesystem-backed npm-compatible registry.
---

# DPM Registry

`dpm-registry` is a small hostable npm-compatible registry written only with the Go standard library. It publishes immutable package versions and serves packuments and content-addressed tarballs from a local data directory. Its public root URL is a no-dependency package catalog with search and DPM install commands.

The catalog queries `GET /-/v1/search`, which accepts `q`, `from`, and `size`. Results are deterministically ordered by package name and include the package description, latest version, dist-tags, and total count. Use this track for [setup](./setup/), HTTP semantics, bearer-token authentication, durable local persistence, and filesystem backup and recovery.
