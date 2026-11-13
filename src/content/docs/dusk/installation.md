---
title: Installation
---

# Installation

Install the published Dusk 1.0.1 browser runtime with npm:

```sh
npm install @nightnetwork/dusk@1.0.1
```

The smallest integration imports `bootRepl`, supplies an output callback, and terminates the engine during cleanup:

```ts
import { bootRepl } from '@nightnetwork/dusk';

const repl = await bootRepl((text) => console.log(text));
await repl.feed('console.log("Hello from DuskJS")');
await repl.engine.terminate();
```

The package declares its published Nova, MoonBeam, DPM, TFS, terminal, and other runtime dependencies; consumers do not need sibling source checkouts or a separate Dusk build. DPM is included as the browser-only `@nightnetwork/dpm@1.0.0` Rust/WASM core.

The host page must meet the browser requirements in [deployment](./deployment/) before booting Dusk. A build that loads successfully can still fail to start if COOP/COEP do not make the page cross-origin isolated. Persistent `tfs` storage additionally requires OPFS and the Web Locks API.
