---
title: Terminal and Processes
---

# Terminal and Processes

`ProcessManager.spawn()` returns a `DuskProcessHandle` with a PID, `exit` promise, stdin writer, stdout and stderr byte streams, `kill()`, and an optional PTY master. `spawnSync()` instead returns captured stdout, stderr, and status. Use a PTY only for interactive programs; noninteractive commands can consume their streams directly.

The built-in `/bin/dsh` shell supports pipelines, redirects, variables, substitutions, `&&` and `||`, and commands such as `grep`, `sed`, `awk`, `jq`, `find`, and `sqlite3`. `/bin/node` offers a persistent REPL context, while Python is provided through Pyodide.

PTY line discipline handles echo, `^C`, `^D`, and resize. A browser terminal should pass arrow-key escape sequences unchanged rather than translating them into application events. Resizing sends `SIGWINCH` with the new column and row dimensions to the attached process.

Each process is isolated in a SpiderMonkey Web Worker. Process isolation does not mean browser-origin isolation: Dusk instances sharing an origin still use that origin's browser storage and permissions.
