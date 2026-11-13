---
title: Persistence
---

# Persistence

The registry stores package metadata below `data_dir/packages/<sha256(package-name)>/metadata.json` and tarballs below `data_dir/tarballs/<sha256(contents)>.tgz`. Tarballs are deduplicated by their SHA-256 content digest; metadata gives each version a generated tarball URL and SHA-512 SRI integrity value. It also stores an atomically replaced `data_dir/index.json` for fast durable package enumeration. Search merges that index with hashed metadata directories, so data written by earlier registry versions remains discoverable.

Versions are immutable. A publish refuses an existing version, and a dist-tag may only target the new version or one already present in that package metadata. This prevents a tag update from referencing a nonexistent version.

Writes use a temporary file, file sync, atomic rename, and parent-directory sync. Files are written mode `0600`, while storage directories are mode `0700`. If a metadata rename has committed but its directory sync reports an error, the implementation keeps the referenced tarball rather than deleting a potentially committed artifact.
