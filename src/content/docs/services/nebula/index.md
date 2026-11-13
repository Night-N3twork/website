---
title: Nebula
description: Nebula service history, Night Network hosting, and deployment documentation.
sidebar:
  order: 1
---

# Nebula

Nebula is a web proxy service with an Astro/Svelte frontend, a Scramjet proxy runtime, and a Fastify backend. The current customized implementation supports both full-server and static-frontend deployment.

## History and Night Network operation

According to the current operator's account, **Nebula has been a well-known service since 2021 and is now hosted and run by [Night Network](https://night-x.com)**.

The current checkout also credits “Hosted by Night Network” in `src/pages/[lang]/settings/credits.astro`. The 2021 history, reputation, and operational responsibility are operator-provided; the source files reviewed do not independently establish the historical claims. Service operation does not imply a transfer of copyright or ownership of all upstream code.

## Deployment

- **Full server:** Node.js and Fastify serve Astro SSR, frontend assets, an optional marketplace API, and an optional Wisp WebSocket endpoint.
- **Static frontend:** generated assets can be published to a static host, but require an external Wisp service and a separate backend if the marketplace is enabled.

Read [Deployment and operation](./deployment/) for prerequisites, build commands, configuration, persistence, Docker limitations, and production checks.

## Documentation scope

These pages describe `/home/amplify/Projects/DDX-Rewrite-Bak/Nebula`, including its local customizations. They are based on source inspection, not a live verification of Night Network's production infrastructure.
