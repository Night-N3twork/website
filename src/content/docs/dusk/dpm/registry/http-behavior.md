---
title: HTTP Behavior
---

# HTTP Behavior

`GET /` serves a no-dependency public catalog. It uses `GET /-/v1/search?q=<query>&from=<offset>&size=<limit>` to return name-sorted matching packages, including each description, latest version, dist-tags, and the total count. `GET /-/ping` returns `{ "ok": true }` and remains public. `GET /-/whoami` requires a bearer token and returns the configured username. `GET /<package>` serves a packument, and honors the abbreviated npm media type when the request accepts `application/vnd.npm.install-v1+json`.

`PUT /<package>` publishes exactly one version and one base64 tarball attachment. The path, `_id`, `name`, manifest name, and manifest version must agree. Invalid documents return 400; an existing version returns 409; an unauthorized writer receives 401 and a token without the matching scope receives 403.

`GET /<package>/-/<sha256>.tgz` serves a content-addressed tarball with `application/octet-stream` and `Cache-Control: public, max-age=31536000, immutable`. Missing packages and tarballs return 404. Invalid package paths, traversal attempts, and invalid tarball names are rejected.
