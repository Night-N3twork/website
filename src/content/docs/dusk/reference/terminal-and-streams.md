---
title: Terminal and Streams
description: Use PTYs and byte streams without conflating terminal output with stdout.
---

# Terminal and Streams

Request a PTY when a program needs terminal line discipline, signal handling, dimensions, or terminal-style echo.

```ts
const shell = await runtime.processManager.spawn('/bin/dsh', [], {
  pty: { cols: 80, rows: 24 },
  cwd: '/home/user',
});

const decoder = new TextDecoder();
shell.master?.onMasterData((bytes) => render(decoder.decode(bytes, { stream: true })));
await shell.stdin.write(new TextEncoder().encode('echo hello\n'));
runtime.processManager.resizePty(shell.pid, 120, 36);
```

## Streams

Every process handle exposes `ReadableStream<Uint8Array>` `stdout` and `stderr`. Acquire and drain each stream once with a reader, decode incrementally, and await `exit` for the terminal status. With no PTY, `stdin.write()` enqueues raw bytes for the process and `stdin.close()` marks EOF.

With a PTY, stdin travels through the terminal discipline. Closing it writes `^D` so buffered input can flush. The optional `master` is a `Pty` with `masterWrite`, `onMasterData`, `resize`, `setRawMode`, and `close`.

## PTY output is separate

The host mirrors program output to `stdout` or `stderr` and sends slave writes to the PTY master. It does **not** automatically copy master echo into `stdout`, specifically to avoid duplicate terminal output. A terminal UI should subscribe to `master.onMasterData()` and normally drain `stdout`/`stderr` in the background if it does not otherwise consume them.

`pty: true` uses default dimensions. `pty: { cols, rows }` supplies initial values. `resizePty(pid, cols, rows)` delegates to the PTY manager; for PTYs attached by `spawn`, the source sends `SIGWINCH` with `{ cols, rows }` to the process hook.

## Stream registry

`StreamRegistry` is the host's flow-control mechanism for child-process stream piping. It is public through the manager but is not a browser `ReadableStream` replacement. Consumer code should prefer `stdout`, `stderr`, and the `Pty` API unless it is implementing a Dusk host integration.

## Limits

TTY status in process bootstrap is not a general native terminal guarantee. Raw mode, signal behavior, and line discipline run in the browser-host implementation. Verify resize, Ctrl-C, EOF, and output rendering against the target shell and browser rather than assuming Node `child_process` parity.
