---
title: Build and Deployment
description: Supported Node/Fastify build and serving path, plus Terbium packaging.
---

# Build and Deployment

The supported standalone path is a Node process that builds frontend artifacts and runs the Fastify entry point:

```bash
pnpm install
pnpm build
pnpm start
```

## Rust and WebAssembly prerequisites

Daydream includes Obscura, a Rust `cdylib` that provides proxy encoding and compression support in WebAssembly. A complete build requires the Rust toolchain and `wasm-pack` in addition to Node.js and pnpm.

```bash
# Install Rust with rustup if it is not already available.
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install the WebAssembly build target and wasm-pack.
rustup target add wasm32-unknown-unknown
cargo install wasm-pack

# Confirm the tools available to Daydream's build.
rustc --version
cargo --version
wasm-pack --version
```

The root build runs this Rust step automatically before Vite:

```bash
pnpm obscura:build
```

That command runs `wasm-pack build --target web` inside `src/pkgs/Obscura`. It compiles the `obscura` crate as a browser-facing WebAssembly package, then the root build runs the two Rolldown bundle steps that expose it to Daydream. Run the full `pnpm build` after changing Rust, generated bindings, or proxy encoding behavior; it rebuilds Obscura together with the dependent browser artifacts.

Obscura uses Rust 2021 and `wasm-bindgen`; its compression dependency uses the pure-Rust `zlib-rs` backend, so no system zlib development package is required for this crate.

### Rust build failures

- `wasm-pack: command not found`: install it with `cargo install wasm-pack` and ensure Cargo's bin directory is on `PATH`.
- Missing `wasm32-unknown-unknown`: run `rustup target add wasm32-unknown-unknown` for the active toolchain.
- Stale generated package output: rerun `pnpm obscura:build`, followed by `pnpm obscura:bundle` and `pnpm obscura:bundle:iife`, or use `pnpm build`.
- Native compiler errors are not expected from Obscura's declared dependencies because its compression backend is pure Rust. Treat a host-toolchain error as an environment issue rather than adding an undocumented system dependency.

`pnpm build` runs the required generated-artifact steps before `vite build`: Neutron, Obscura/WASM bundles, service worker, Scramjet config/controller, Helium bootstrap, content workers, DevTools agents, NyxBridge client and agent, and TypeScript build checking. `pnpm start` runs `tsx index.ts`.

Fastify serves `dist/` at `/`, registers API routes, compresses with Brotli/gzip/deflate, and returns `dist/internal/error/index.html` for unmatched routes. Its HTTP server receives WebSocket upgrades: only URLs ending in `/wisp/` are passed to the Wisp server; all other upgrade sockets are destroyed. Wisp is configured for v2 with DNS resolution through `1.1.1.1` and `1.0.0.1`.

## Not static hosting

Do not deploy Daydream to static-host platforms such as Netlify, GitHub Pages, or Cloudflare Pages. The app requires a live Node/Fastify process for API handling and the `/wisp/` WebSocket upgrade. A static asset host cannot supply that backend just because it can serve `dist/`.

## Terbium package

```bash
pnpm build:tapp
```

This produces `dist-tapp/daydream.TAPP.zip`, containing the Daydream build, generated `.tbconfig`, icon, and Terbium shims. The package metadata under the `terbium` key in `package.json` is the source of truth for package name, display name, and window constraints; the runtime app ID is derived as `com.tb.<pkg-name>`. The TAPP shares Terbium's Wisp transport and routes downloads through Terbium's VFS. It does not produce a tb-repo catalog `manifest.json`.

## Stale deployment files

The README instructs users to copy a nonexistent `config.example.js`, names an old clone path, and describes `config.js`-based startup. The current server reads environment variables instead. `vercel.json` names `./index.js`, while the current entry point is `index.ts`; it is not evidence of a working Vercel deployment. Do not infer Vercel support from that stale file.
