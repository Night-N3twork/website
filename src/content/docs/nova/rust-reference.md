---
title: Rust Reference
description: Primary Rust crates and public API shapes.
---

# Rust Reference

## `nova-core`

The crate re-exports `Error`, `Result`, `CookieJar`, `Body`, `Header`, `Method`, `NovaHandle`, `Opt`, `OptValue`, and proxy parsing/types. `NovaHandle` is the low-level request object. `Opt` provides table-driven controls for TLS, HTTP, TCP, timeout, cookies, DNS, general settings, a single proxy, and a proxy chain.

Path-based settings such as CA bundle, client certificate/key, TLS key log, TCP interface, and cookie jar have wasm32 restrictions; see [security and operations](./security-and-operations/).

## `nova`

`NovaClient::builder()` creates a `ClientBuilder`. The builder accepts `mux`, grouped option structures, `user_agent`, and repeatable `default_header` calls. `build()` returns a clonable `NovaClient`; request methods return `RequestBuilder` values that can add request-specific headers and bodies before `send().await`.

## Transports and proxy types

`WebSocketTransport` is the native direct-Wisp transport. `MessagePortTransport` is used by WASM relay integrations. A `Proxy` has a `ProxyKind`, host, port, and optional username/password authentication. Supported kinds are SOCKS4, SOCKS4a, SOCKS5, and HTTP CONNECT.
