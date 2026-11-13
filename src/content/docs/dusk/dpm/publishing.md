---
title: Publishing
---

# Publishing

The `@nightnetwork/dpm@1.0.0` browser core does not export publishing and has no native CLI. Use npm's compatible publisher to publish a package to `dpm-registry`; this is not an external npm publish.

The nested [DPM Registry](./registry/) accepts npm publish documents over authenticated HTTP `PUT`. A compatible publisher must send one package version and one base64 `_attachments` tarball, with `_id`, `name`, and the embedded manifest all agreeing with the target package and version. The registry derives the authoritative SHA-512 SRI integrity value and rejects replacement versions.

Configure an authorized token in the publisher environment, then publish from the package directory:

```sh
export DPM_REGISTRY_TOKEN='replace-with-the-plaintext-token-once'
export DPM_REGISTRY_URL='https://registry.example.test/'
npm config set --location=project "//registry.example.test/:_authToken" "$DPM_REGISTRY_TOKEN"
npm publish --registry "$DPM_REGISTRY_URL"
```

For the browser archive workspace, build and pack before publishing each package. `npm pack` only creates a local tarball; it does not publish.

```sh
cd /path/to/dpm-browser-archive-packages
npm test
npm run build
npm pack --workspace=@nightnetwork/dpm-tar --pack-destination artifacts
npm pack --workspace=@nightnetwork/dpm-zip --pack-destination artifacts
npm pack --workspace=@nightnetwork/dpm-unzip --pack-destination artifacts
npm publish --workspace=@nightnetwork/dpm-tar --registry "$DPM_REGISTRY_URL"
npm publish --workspace=@nightnetwork/dpm-zip --registry "$DPM_REGISTRY_URL"
npm publish --workspace=@nightnetwork/dpm-unzip --registry "$DPM_REGISTRY_URL"
```

The registry is not a proxy. A Dusk install using it must be able to resolve `fflate` and `nanotar` from the same registry, so publish or mirror those dependencies there before testing the archive packages against an isolated registry.

Use DPM for the supported browser install, resolution, lockfile, and cache workflows. Validate a published consumer through `@nightnetwork/dusk@1.0.1` or call `execute` from `@nightnetwork/dpm@1.0.0`; neither workflow requires a sibling Dusk source checkout.
