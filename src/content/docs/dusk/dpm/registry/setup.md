---
title: Setup
---

# Setup

Build the local server, then create a configuration outside the checkout with a durable absolute data directory and SHA-256 hashes of bearer tokens. Token plaintext is not stored by the registry. A token can publish every package with `"*"` or only a scope prefix such as `"@acme/*"`.

```sh
cd /srv/dpm-registry-src
go build -o /srv/dpm-registry/bin/dpm-registry ./cmd/dpm-registry
install -d -m 0700 /srv/dpm-registry/data /etc/dpm-registry
```

```json
{
  "data_dir": "/srv/dpm-registry/data",
  "read_auth": false,
  "tokens": [{ "hash": "SHA256_HEX", "user": "publisher", "scopes": ["@acme/*"] }]
}
```

Generate a high-entropy token in a secret manager or protected shell session, then generate its hash without writing the token to a file:

```sh
printf %s "$DPM_REGISTRY_TOKEN" | sha256sum | cut -d' ' -f1
```

Save the JSON as `/etc/dpm-registry/config.json` with mode `0600`. The handler requires `data_dir` and rejects malformed token hashes. It creates `packages` and `tarballs` subdirectories with owner-only permissions when it starts. With `read_auth` left false, users can browse the registry URL and search its public catalog; publishing still requires an authorized token.
