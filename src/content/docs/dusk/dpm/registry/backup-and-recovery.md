---
title: Backup and Recovery
---

# Backup and Recovery

Back up the complete configured `data_dir`, including both `packages` metadata and `tarballs`. Metadata alone cannot serve packages because it references content-addressed tarball files; tarballs alone cannot reconstruct package names, versions, or dist-tags.

For a consistent filesystem backup, stop or quiesce the registry before taking a snapshot, then restore the entire directory with its owner-only permissions. The registry's atomic-write and sync sequence protects individual publishes, but it does not implement snapshot coordination, replication, garbage collection, or an administrative recovery API.

After restoration, start the registry with the same `data_dir` and validate representative `GET /<package>` and returned tarball URLs. Preserve the token-hash configuration separately and securely; it is required for future authenticated publishing but does not recover a bearer token that was never retained elsewhere.
