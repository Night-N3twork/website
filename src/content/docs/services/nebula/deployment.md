---
title: Deployment and operation
description: Nebula server and static deployment, configuration, and operational limitations.
sidebar:
  order: 2
---

# Nebula deployment and operation

This guide describes the customized Nebula checkout at `/home/amplify/Projects/DDX-Rewrite-Bak/Nebula`. See the [Nebula overview](../) for service history and current hosting.

## Service history and current operator

According to the current operator's account, **Nebula has been a well-known service since 2021 and is now hosted and run by [Night Network](https://night-x.com)**. This describes operation of the hosted service, not a transfer of copyright or ownership of all upstream code.

The checkout's `src/pages/[lang]/settings/credits.astro` credits “Hosted by Night Network” and links to `https://night-x.com`. The 2021 history, reputation, and current operational responsibility are supplied by the operator; the files reviewed do not independently establish those historical claims. No production domain, infrastructure inventory, or live deployment verification is implied by this guide.

## Deployment modes

| Mode | Build | Runtime | Output |
| --- | --- | --- | --- |
| Full server (default) | `pnpm build:client`, then `pnpm build:server` | Node.js + Fastify | `dist/client/`, `dist/server/`, compiled `server/*.js` |
| Static frontend | `pnpm build:static` | Static HTTP host + external Wisp service | `dist/` |

The full server serves Astro SSR, frontend assets, an optional marketplace API, and an optional Wisp WebSocket endpoint at `/wisp/`. A static deployment serves only frontend files: it does **not** start Fastify, a database, marketplace API, or Wisp server.

## Prerequisites and source layout

- Use Node.js 22 (the version selected by the Dockerfile), pnpm, and Git.
- Keep the surrounding `DDX-Rewrite-Bak` source tree available: `astro.config.ts` imports `../srv/vite/svg`. This checkout is not a standalone build unless that sibling module and its dependencies are supplied.
- Native dependencies such as SQLite and the font tooling may require Python and a C/C++ build toolchain when prebuilt binaries are unavailable.
- Run commands below from the `Nebula/` directory.

Install dependencies:

```sh
npm install --global pnpm
pnpm install --frozen-lockfile
```

For a fresh checkout, copy `config.example.toml` to `config.toml`. **Do not overwrite an existing deployment configuration.** Configuration is required at build time as well as by the server; changes to frontend-facing settings require rebuilding.

## Configuration

Edit `config.toml` before building:

- `[marketplace].enabled`: the example currently defaults to `false`.
- `[marketplace].psk`: replace `CHANGEME` with a strong secret before enabling the marketplace.
- `[marketplace].origin`: leave empty for the full same-origin server; for a static marketplace, set the HTTPS origin of a live Nebula backend serving `/api/*` and `/packages/`.
- `[seo].enabled` and `[seo].domain`: configure for the intended public URL. The domain must be a valid URL even when SEO is disabled.
- `[server.server].port`: defaults to `8080`; the server's `PORT` environment variable takes precedence at runtime.
- `[server.server].wisp`: enables the built-in Wisp service in server mode only.
- `[server.server].logging`: controls server/database logging.
- `[db].postgres`: `false` selects SQLite; `true` selects PostgreSQL using `[db]` credentials and `[postgres]` host/port. Use unique database credentials.
- `[masqr]`: optional access-validation integration; configure only if needed.

Never publish `config.toml`, database credentials, or the marketplace PSK with static assets.

## Full server deployment

```sh
pnpm build:client
pnpm build:server
pnpm start
```

Build the client first because the server imports `dist/server/entry.mjs`. The existing `pnpm build` script launches the server compiler in the background, so separate sequential commands are preferable when diagnosing build failures or automating deployment.

The server binds to `0.0.0.0` and normally listens on port `8080`. Keep a production process alive with a supervisor such as systemd or a container restart policy. Put an HTTPS reverse proxy in front of it and forward WebSocket upgrades for `/wisp/`.

Preserve `dist/`, the compiled server, dependencies, `config.toml`, and `database_assets/` in the runtime installation. If the marketplace uses SQLite, preserve `database.sqlite` in the process working directory. For PostgreSQL, persist and back up the database separately. Back up package assets and configuration as well.

## Static frontend deployment

```sh
pnpm build:static
```

Publish the complete generated `dist/` directory, including localized pages, service workers, JavaScript, fonts, proxy assets, `index.svg`, and `marketplace-config.js`. Use HTTPS (or localhost for local testing) so browser service workers can function. Serve generated paths and asset MIME types correctly; avoid blanket SPA rewrites that replace worker or asset requests with HTML.

Static builds default new users to a generated remote Wisp selection rather than a nonexistent same-origin `/wisp/`. Existing saved user selections are preserved. Ensure users have a reachable `wss://` endpoint; static hosting alone does not provide proxy transport.

To enable the marketplace on a static site, set `[marketplace].enabled = true` and `[marketplace].origin` to the separate backend's HTTPS origin before building. Catalog traffic is routed through the client proxy transport, so both that transport and the backend must be available. Otherwise leave the marketplace disabled.

`pnpm start` is for the full server output, not static builds. Keep static and server output in separate deployment directories or build jobs.

## Docker: known limitations in this checkout

The repository contains a Node 22 Alpine Dockerfile and two Compose files, but they should not be treated as a verified production deployment:

- The Dockerfile uses `Nebula/` as its build context, which does not include the required `../srv/vite/svg` module. A container build needs an adapted context and layout that preserve that dependency.
- `docker-compose.build.yml` defines two services with the same container name and host port. Do not launch both unchanged.
- `docker-compose.yml` references `ghcr.io/nebulaservices/nebula:latest`; availability and correspondence to this customized checkout have not been verified.
- The Dockerfile invokes the parallel `pnpm build` script noted above.
- Existing Compose mounts cover configuration but do not explicitly persist `database.sqlite`; add durable database storage before enabling a SQLite marketplace.
- Keep secrets out of the image build context. `.dockerignore` currently does not exclude `config.toml`.

The correct Docker build syntax is `docker build -t nebula:latest .`, but fixing the command alone does not resolve the source-layout limitation. Prefer the source deployment above until the container layout is adapted and tested.

## Production verification and updates

Before publishing or updating a Night Network instance:

1. Back up configuration, marketplace data, and package assets.
2. Build the selected mode in a staging environment; confirm both build commands succeed for server mode.
3. Check the homepage, localized routes, and `index.svg` entrypoint in a browser.
4. Confirm service-worker registration and a real proxied request over the selected Wisp endpoint.
5. If enabled, check `/api/catalog-stats/`, catalog listing, package downloads, and database persistence after a restart.
6. Verify HTTPS, WebSocket forwarding, secrets handling, and that public access matches the intended policy.
7. Publish the verified artifacts, restart the server if applicable, and retain the previous release for rollback.

This guide is based on source inspection. No build, container launch, or live Night Network deployment was performed as part of this documentation update.

## Artifact publishing and CDN

Static output publishes to the artifact-only repo `TwiLabs/n4x8p1kd`,
served through jsDelivr. Only built output is published: the artifact
checkout is committed and pushed separately from source branches.

Sync `dist/` into the artifact checkout **without** `--delete` (retains
prior hashed assets for cached SVG shells), secret-scan the staged tree
against `config.toml` values, then commit and push only the artifact repo.

Purge changed files plus `index.svg`/`index.html` entries at `@main` and
unversioned, in batches of at most 10 URLs per purge request; check each
job status and do not retry throttled paths in a loop. Then byte-compare
pinned, `@main`, and unversioned `index.svg` against `dist/index.svg`.

Settings persist in IndexedDB via an async localforage store (no
`localStorage` remains in client code); existing values migrate on first
read. Production chunks strip `console.log/info/debug` while keeping
`warn`/`error`.

Detector check (a 200 alone is not a pass):

```sh
GET https://fc.ampscat.dev/detect/site?url=<encoded-target>
# header: X-API-Key: <key>
```

Expect `finalStatus: 200`, `score: 0`, empty `findings`/`errors`,
`shouldBlock: false`.
