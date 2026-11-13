---
title: Integration
---

# Integration

Use `WispTransport` for a direct browser-to-Wisp connection. The Wisp server opens the TCP connection to the SSH target.

```ts
import { SSHClient, WispTransport } from '@nightnetwork/lunassh';

await SSHClient.initialize({
  wasmPath: '/assets/lunassh.wasm',
  wasmExecPath: '/assets/wasm_exec.js',
});
const transport = new WispTransport('ssh-session', {
  wispUrl: 'wss://wisp.example/',
  sshHost: 'ssh.example',
  sshPort: 22,
});
const session = await SSHClient.connect({
  host: 'ssh.example',
  port: 22,
  user: 'alice',
  password: 'example-only',
  // Replace with the SSH server's real OpenSSH host-key entry.
  knownHosts: ['ssh.example ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA...'],
}, transport);
```

Use `MoonbeamTransport` when the application already owns a MoonBeam relay. The relay supplies a `MessagePort` to LunaSSH while sharing its upstream Wisp connection.

The Dusk adapter is separately exported:

The demo uses published LunaSSH 1.0.0 alongside published Dusk 1.0.1. It does not build or serve sibling package sources. A reachable Wisp endpoint and SSH host are still required to verify a live connection, but Dusk boot and DPM help do not require SSH credentials.

```ts
import { registerSSHCommand } from '@nightnetwork/lunassh/dusk';

registerSSHCommand(processManager, {
  wispUrl: 'wss://wisp.example/',
  knownHosts: ['ssh.example ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA...'],
  readFile: (path, cwd) => vfs.readFileText(path, cwd),
});
```

It registers `ssh [-p PORT] [-l USER] [-i PRIVATE_KEY_PATH] host`. Password authentication uses `DUSK_SSH_PASSWORD`; `-i` reads a private key through the supplied VFS callback.
