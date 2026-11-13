---
title: Development and Testing
description: pnpm development, unit testing, UI testing, and temporary tunnels.
---

# Development and Testing

Run commands from the Daydream repository root (`DDX-Rewrite-Bak` in the source snapshot).

```bash
pnpm install
pnpm dev
```

`pnpm dev` runs `tsx devserver.ts`. The development controller starts Vite on `DEVPORT` or `5173`, starts the backend, and proxies `/api`, `/auth`, and WebSocket `/wisp/` traffic to the Fastify backend on port `8080`. Development Vite listens on `HOST` or `localhost` and uses a strict port.

## Test commands

```bash
pnpm test
pnpm test:watch
pnpm test:ui
```

`pnpm test` runs Vitest once. The repository also has Playwright specifications; their default base URL is `http://localhost:5173`, and `PLAYWRIGHT_BASE_URL` can override it. Test the integration you change: NyxBridge has handshake/channel/injection/runtime tests, tabs have unit tests, and Terbium has boot tests.

## Development tunnel

`./tunnel.sh` opens a Cloudflare Quick Tunnel to `http://localhost:5173`; `./tunnel.sh 8080` targets another port, and `PORT=3000 ./tunnel.sh` supplies a port through the environment. It requires `cloudflared` on `PATH` and produces an ephemeral `trycloudflare.com` URL. Because Vite forwards its API and Wisp paths to port `8080`, tunneling `5173` is sufficient for end-to-end development testing.

The tunnel is a development convenience, not a supported production deployment mechanism.
