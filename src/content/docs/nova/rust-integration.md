---
title: Rust Integration
description: Use Nova's native Wisp transport and high-level client.
---

# Rust Integration

Native Rust consumers create a Wisp transport, construct a mux, complete its handshake, and supply that mux to `NovaClient`.

```rust
use std::sync::Arc;
use nova::NovaClient;
use nova_core::transport::WebSocketTransport;
use nova_core::wisp::Mux;

# async fn example() -> Result<(), Box<dyn std::error::Error>> {
let transport = WebSocketTransport::connect("wss://wisp.example.com/").await?;
let mux = Arc::new(Mux::new(transport));
mux.run_handshake(&[]).await?;

let client = NovaClient::builder().mux(mux).build()?;
let response = client.get("https://example.com/").send().await?;
# Ok(()) }
```

The high-level builder supports a user agent, repeatable default headers, and grouped option structures. `get`, `post`, `put`, `delete`, `head`, and `request` return a `RequestBuilder`. For libcurl-shaped control, use `nova_core::NovaHandle` and set URL, method, headers, body, options, and mux directly.

The mux's post-handshake inbound receive loop is operationally required. The WASM layer starts this pump itself; native integrations must ensure inbound Wisp frames continue to be dispatched after the initial handshake or response reads, TLS handshakes, and CONTINUE credits can stall.
