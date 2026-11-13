---
title: Space deployment
description: Build profiles, configured endpoints, SVG and shoestring mirrors.
---

## Build profiles and entry points

Run from the Space source root with Node/npm and Bun available:

```sh
npm install
npm test
npm run typecheck
npm run build:server
```

The server profile retains the existing Fastify backend (`npm start`), optional
APIs and same-origin `/w/`. The static profile is independently configured:

```sh
SPACE_BUILD_ID=release-001 SPACE_WISP_URL=wss://wisp.example.invalid/w/ SPACE_API_ORIGIN=https://api.example.invalid npm run build:static
```

Example domains are placeholders, not working endpoints. Static builds require
an explicit credential-free `wss:` endpoint or the configured generated-domain
mechanism; generated endpoints are not guaranteed available. `SPACE_WISP_DOMAINS`
is a comma-separated domain allowlist; empty disables generation. Reachability
probes do not prove complete Wisp transport functionality. Failed selection is
visible; deployment must not fabricate auth or Plus success.

Serve the entire `dist/` directory, not only the entry document. `index.html` and
`index.svg` are equivalent full-viewport entries; append `?view=games`. SVG hosts
one actual HTML application and reports application readiness, not proxy
capability. Its error deadline is 15 seconds. Keep filenames, worker scope,
relative lazy imports and asset MIME types intact. HTTPS (or localhost), worker
support and COOP `same-origin` / COEP `require-corp` isolation are required for
the standalone transport. Service workers must be revalidated, not immutable.

`space-config.json` is a public build snapshot. The app uses compiled defaults;
editing the JSON alone does not reconfigure the bundle. A deployment can install
the validated full `globalThis.__SPACE_RUNTIME_CONFIG__` before application
scripts: `{mode, wispUrl, apiOrigin, buildId}`. This affects only Space's transport,
not arbitrary game WebSockets. Never place credentials in public build inputs.

With `SPACE_API_ORIGIN` empty, static account/Plus APIs are disabled explicitly;
static operation does not depend on `/api/detect`. A remote API must implement
appropriate CORS, cookie policy and authentication. Server same-origin behavior
is retained. Fonts are local build artifacts; failed font loading must leave
original readable text and URL/input data unchanged.

## Manifest and shoestring-space

The final build validates assets and emits `space-manifest.json` with exact
build identity, MIME, size, SHA-256 and full lazy/proxy/font dependency coverage.
Choose an immutable unique build ID; never mix releases under one identity.
From the `shoestring-space` root:

```sh
npm install
npm test
npm run typecheck
SPACE_SOURCE_ORIGIN=https://space.example.invalid SPACE_SOURCE_BUILD_ID=release-001 SPACE_BOOTSTRAP_WISP_URL=wss://wisp.example.invalid/w/ npm run build
node serve.mjs dist 8092
```

The source origin must serve the matching complete manifest/build and allow CORS
for direct downloads. The installer verifies every asset before committing
completion. CacheStorage is preferred; OPFS fallback persists its selected
backend. IndexedDB selection must work. Partial downloads are retryable, not
complete mirrors. After a completed standalone mirror the one root
`/bootstrap-sw.js` composes the original Space worker handlers; Space must not
register a competing root worker. Loss/takeover of ownership blocks navigation.
Worker evaluation trusts publisher code and needs eval-permitting worker CSP;
it is not a sandbox. Read `shoestring-space/REFERENCE.md` before deployment.

Source-offline recovery applies only after a fully verified mirror. External
game servers and Wisp still need connectivity. Proxied/delegated shoestring
negotiates before storage/transport and hands off to the configured source entry
through its owning host, without a local bootstrap worker. `?entry=html` on the
installer selects HTML; the default is SVG. This handoff requires a reachable
source and is not offline delegated mirroring. Bootstrap ownership never
impersonates delegation. Building the shoestring entry in this workspace needs
the canonical `../Space-v2/src/bridge` source; that client is bundled and sibling
source is not fetched at deployment time.

## Licensing and source availability

Retain Space and dependency licenses, emitted notices and the AGPL-derived
Nebula tooling attribution. Review the shipped `LICENSE` and corresponding
dependency notices. Provide source availability and corresponding build/config
instructions as required by the applicable licenses, including modifications;
a verified binary mirror does not replace those obligations. Space builds are
self-contained and do not require sibling host source at deployment time.

## Verification limits

The installed Scramjet engine intentionally refuses to proxy its own real
hosting origin. Keep controlled game and proxy origins distinct; do not disable
that safeguard or replace it with raw-network fallback for same-origin games.

Run `npm run test:e2e` and the configured local acceptance matrix before rollout.
Build and verify each profile sequentially: run the full Chromium suite after
`build:server`, then rebuild with `build:static` and run `test:acceptance`.
Fixtures consume the current `dist/`; do not rebuild it during a browser run.
The configured list and JSON reporters retain successful controller/protocol
attachments. Set `SPACE_E2E_JSON` to a distinct result path for each run; a
`--reporter=list` override alone discards successful attachment bodies. Keep
the fixed protocol deadlines and zero retries when diagnosing readiness loss.
Ordinary acceptance defaults to tracing off: Playwright DOM snapshots can add
work through the installed proxy's intercepted DOM getters. Use `--trace on`
only for a separately recorded diagnostic run, ideally paired with `--trace off`
on the same build and identical assertions. Keep successful JSON attachments in
both runs; snapshot overhead is not permission to extend readiness deadlines.

Local verification on October 1, 2026: server Chromium **34/34**, static
acceptance **14/14**, and Space units **202/202 per profile**; both profile
typechecks and builds passed with zero browser retries/skips. These are controlled
controller/transport fixtures, not production rollout certification. Both final
matrices recorded eight genuine BFCache denials each; admitted restoration
remains unverified. Detailed commands and historical failures are retained in
the source repository's `VERIFICATION.md` and Task 10 report.

External game outages cannot replace controlled-game acceptance. BFCache
admission is browser-controlled: denied restoration is not a pass. No public
deployment, storage migration/GC, universal UV support, or non-Chromium
compatibility is implied by these instructions.

## Artifact publishing and CDN

Static output publishes to the artifact-only repo `TwiLabs/q7v3m9c2`,
served through jsDelivr. Only built output is published: the artifact
checkout is committed and pushed separately from source branches.

Stage `dist/` plus previously published hashed assets (protects cached
shells), extend `space-manifest.json` for the retained files, re-verify
with `node scripts/verify-build.mjs`, scan staged output for configured
private values (never commit `.env` files or tokens), then commit and push
only the artifact repo.

Purge changed files plus entry points (`index.svg`, `index.html`,
`newtab.html`) at `@main` and unversioned, in batches of at most 10 URLs
per purge request; check each job status and do not retry throttled paths
in a loop. Then byte-compare pinned, `@main`, and unversioned `index.svg`
against `dist/index.svg`.

Detector check (a 200 alone is not a pass):

```sh
GET https://fc.ampscat.dev/detect/site?url=<encoded-target>
# header: X-API-Key: <key>
```

Expect `finalStatus: 200`, `score: 0`, empty `findings`/`errors`,
`shouldBlock: false`.
