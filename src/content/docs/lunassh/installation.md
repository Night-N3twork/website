---
title: Installation
---

# Installation

Install the JavaScript package and serve its WASM assets with your application.

```sh
npm install @nightnetwork/lunassh@1.0.0
```

The published package already contains browser assets at:

- `node_modules/@nightnetwork/lunassh/dist/lunassh.wasm`
- `node_modules/@nightnetwork/lunassh/dist/wasm_exec.js`

Copy both files to a location your application serves publicly:

```sh
mkdir -p public/assets
cp node_modules/@nightnetwork/lunassh/dist/lunassh.wasm public/assets/
cp node_modules/@nightnetwork/lunassh/dist/wasm_exec.js public/assets/
```

The 1.0.0 package exports JavaScript entry points including `.` and `./dusk`, but does not export `./dist/*` asset subpaths. Vite consumers can import the installed assets by relative path from a file under `src/` (for example, `../node_modules/@nightnetwork/lunassh/dist/lunassh.wasm?url` and `../node_modules/@nightnetwork/lunassh/dist/wasm_exec.js?url`) and pass the resulting URLs to `initialize()`. Do not alias these paths to a sibling source checkout. For other bundlers, copy the two assets as shown above.

Pass the served URLs explicitly to `SSHClient.initialize()`:

```ts
import { SSHClient } from '@nightnetwork/lunassh';

await SSHClient.initialize({
  wasmPath: '/assets/lunassh.wasm',
  wasmExecPath: '/assets/wasm_exec.js',
});
```
