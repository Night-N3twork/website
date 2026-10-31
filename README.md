# website

shiii site redesign? @claude write me a readme

## Run

- `bun install`
- `bun run dev`, then open http://localhost:3011 (`/es`, `/fr` and `/ja` for the other locales)
- `bun run test` for unit tests
- `bun run e2e` for browser tests; it starts the fixture upstream and builds and serves the site itself, so stop anything on port 3000 first or set `E2E_PORT`; `PLAYWRIGHT_CHROME` points it at a Chrome binary when the bundled one is missing; screenshots stay out of the repo and are per platform and per backdrop, so `bun run e2e:update` records them on a new machine and after an intended visual change
- the sky has two backdrops, range and peak, picked at build time with `GLASS_BACKDROP` (range when unset). `bun run e2e:peak` builds with peak and runs the visual and accessibility checks against it
- `bun run build && bun run start`, then `bun run lighthouse` in a second shell
- `bun run upstream` serves recorded Uptime Kuma and Discord responses on 127.0.0.1:3900; `bun run e2e` starts it by itself, point `UPTIME_KUMA_BASE`, `DISCORD_API_BASE` and `DISCORD_CDN_BASE` at it to run the app against fixtures by hand
- copy `.env.example` to `.env.local`. `GA_ID` turns analytics on and `SITE_URL` sets the address in canonicals, the sitemap and share links (the old `NEXT_PUBLIC_` names stop the server on purpose). `DISCORD_BOT_TOKEN` and `DISCORD_GUILD_ID` (set both) turn on avatars and the people lists; the bot needs the Server Members intent. `DISCORD_BOOSTER_ROLE_ID` names the role whose holders fill the boosters list; donators are listed by hand in `src/content/donators.ts`, with a Discord id when there is one so the avatar comes along. `REVALIDATE_SECRET` enables `POST /api/revalidate?tag=uptime|discord` with a bearer header; without any of these the site still builds and shows placeholders; share images fall back to English text for locales the bundled Latin font cant set
- with reduced motion on, the scene draws one still frame and every page shows at once
- `GET /api/status` returns status, 24 hour uptime and last check for each monitor from the cached snapshot, with `Cache-Control: public, max-age=30, s-maxage=30, stale-while-revalidate=60`; project pages poll it while the status line is on screen
- every response carries nosniff, a strict referrer policy, a permissions policy that turns off camera, microphone and geolocation, `X-Frame-Options: DENY`, a year of HSTS and a content security policy with a fresh nonce per request, all from `src/lib/security/headers.ts`. The server reads its env at startup, the avatar host included, so a restart picks up a new `DISCORD_CDN_BASE`; a bad value stops it before it listens
- unknown addresses get a real 404, titled "Page not found" in the tab and kept out of the index; server errors get their own page; nothing is written to disk for them; random urls cant fill it
- share images are drawn per request with satori and resvg and kept in memory; satori is pinned, so bump it on purpose

## Structure

- `messages/` all text on site
- `src/content/` product facts: projects, partners, roles, contributors, donators and links
- `src/app/` the root, every route and endpoint; `src/server.ts` serves the build
- `src/ui/glass/` every page and section
- `src/scene/` the three.js canvas: glass moon, sky backdrop and the path the moon takes
- `src/motion/` and `src/navigation/` the intro, scroll chapters, small interactions and page transitions
- `src/styles/glass/` tokens and stylesheets
- `src/lib/` data fetching, SEO, security headers, share images and the generated art
- `public/backdrops/` the two sky photos; `scripts/backdrops.mjs` re-encodes them
- `deploy/` a Caddy config for running the build locally behind https
