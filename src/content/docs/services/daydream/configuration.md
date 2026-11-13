---
title: Configuration
description: Environment variables, browser settings, and Terbium metadata.
---

# Configuration

The current implementation uses process environment variables for listening and development ports, plus browser settings for runtime choices. It does not use the README's `config.js` workflow.

## Environment variables

| Variable | Used by | Default | Effect |
| --- | --- | --- | --- |
| `HOST` | Fastify and development Vite | Fastify: `127.0.0.1`; Vite: `localhost` | Bind host for the relevant process. Set deliberately when exposing a service on a network. |
| `PORT` | Fastify; `tunnel.sh` fallback | `8080` for Fastify; `5173` for tunnel script | Production server listen port; the tunnel uses it only when no positional port is supplied. |
| `DEVPORT` | `devserver.ts` | `5173` | Vite development port; strict, so an occupied port fails rather than selecting another. |
| `PLAYWRIGHT_BASE_URL` | Playwright specs | `http://localhost:5173` | Test target URL. |
| `APOCALYPSE_REMOTE` | Vite config | unset | Enables the remote Apocalypse configuration when exactly `1`. |
| `APOCALYPSE_SEED` | Vite config | `daydream-remote-test` | Seed for that remote configuration. |
| `APOCALYPSE_REPOSITORY` | Vite config | unset | Remote repository input. |
| `APOCALYPSE_REVISION` | Vite config | unset | Remote revision input. |

Platform-specific variables such as `RENDER_EXTERNAL_URL`, `RAILWAY_PUBLIC_DOMAIN`, `FLY_APP_NAME`, Codespaces, Gitpod, Replit, Koyeb, Heroku, Adaptable, and CleverCloud variables are used only to print a detected platform URL at startup. They do not implement deployment adapters or establish support for those platforms.

## Browser settings

`transports` selects the runtime transport and defaults to `libcurl`. `wisp` stores the active Wisp URL. `aiBridgeDevOrigin` adds one development NyxBridge origin to the default allowlist. In a Terbium TAPP, the parent Wisp override takes precedence over saved `wisp` so the shared transport remains aligned.

## Terbium metadata

The `terbium` object in `package.json` controls the TAPP package name (`daydream`), display name, developer, window title/size/minimums, and window capabilities. It is build-time package metadata, not a standalone server configuration file.
