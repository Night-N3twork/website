---
title: Deployment
---

# Deployment

Run the registry on loopback and put a TLS reverse proxy in front of it:

```sh
/srv/dpm-registry/bin/dpm-registry -config /etc/dpm-registry/config.json -listen 127.0.0.1:4873
```

The command defaults to `config.json` and `:4873`. Its Go HTTP server sets a 5-second read-header timeout, 30-second read and write timeouts, a 60-second idle timeout, and a 1 MiB header limit. The handler also applies a 30-second request timeout and limits publish bodies to 32 MiB. Use a service manager to restart it and run it as the account that owns the data directory.

The service uses plain HTTP and has no TLS listener. Terminate HTTPS at Caddy, nginx, Traefik, or a load balancer, preserve the request path, and set proxy request-body limits to at least 32 MiB. Do not expose the loopback port directly. The registry has no WebSocket endpoint, so its proxy route does not need `Upgrade` handling. Dusk deployments that use a separate browser network bridge may still require `wss://` and WebSocket proxy settings for that bridge; those settings do not belong on the registry route.

The service does not provide user management, replication, garbage collection, or an administrative UI. Keep both `/etc/dpm-registry/config.json` and the configured data directory on durable, backed-up storage.
