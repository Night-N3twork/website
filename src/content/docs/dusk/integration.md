---
title: Integration
---

# Integration

Use `bootRepl(write, options)` as the high-level entry point. `write` receives REPL stdout and stderr text. `seed` adds text files at startup; `user`, `hostname`, and `layout` control the generated environment and filesystem layout.

Import `bootRepl` from `@nightnetwork/dusk@1.0.1`; do not alias it to a sibling checkout. The published build uses dynamic chunks for optional heavy paths. In particular, Babel is loaded from a generated `babel-*.js` chunk when required, so deploy all bundler-emitted chunks beside the entry bundle rather than copying only the main JavaScript file.

For a terminal UI, boot with `skipPidZero: true`, spawn `/bin/dsh` with a PTY, copy `master.onMasterData()` bytes to the terminal renderer, and encode input before calling `stdin.write()`. Await the process handle's `exit` promise and terminate the engine when the UI is disposed.

```ts
const shell = await repl.processManager.spawn('/bin/dsh', [], {
  cwd: '/home/user',
  env: { HOME: '/home/user', PATH: '/bin', TERM: 'xterm-256color', USER: 'user' },
  pty: { cols: 80, rows: 24 },
});
```

Do not treat the browser's JavaScript console as a terminal: preserve raw byte input and resize the PTY through `processManager.resizePty(shell.pid, cols, rows)`.

Serve the document, workers, WASM, and dynamic chunks with compatible resource policy under COOP `same-origin` and COEP `require-corp`. Persistent TFS operations use the browser Web Locks API to serialize origin-wide metadata changes; use `fs: 'memory'` if persistence is unnecessary and Web Locks or OPFS are unavailable.
