---
title: Installation and Use
---

# Installation and Use

Install the browser Rust/WASM package as an application dependency. Version 1.0.0 does not provide a global or native Node CLI:

```bash
npm install @nightnetwork/dpm@1.0.0
```

```ts
import init, { execute } from '@nightnetwork/dpm';
import wasmUrl from '@nightnetwork/dpm/wasm?url';

const wasmBytes = await fetch(wasmUrl).then((response) => response.arrayBuffer());
await init({ module_or_path: wasmBytes });
const result = await execute(['--help'], { exists: async () => false }, '/project', { env: {} });
```

Browser hosts provide every filesystem, network, and output capability reached by a command. A complete install host supplies the documented text, binary, directory, stat, fetch, and output methods. `execute` returns `{ status, stdout, stderr, plan? }`; `npm exec` returns a plan for the host and does not start a process itself.

Inside Dusk 1.0.1, use `dpm install <packages...>`, `dpm i`, or `dpm add`; use `dpm npm install`, `i`, or `add` for the public npm registry. The core also supports `--help`, `npm --help`, and `npm exec`. Other historical commands are not part of the 1.0.0 package contract.

`dpm publish` is not exported by the browser core. See [publishing](./publishing/) for the registry publishing boundary.
