---
title: Limitations
---

# Limitations

LunaSSH provides interactive SSH terminal sessions over Wisp or MoonBeam. It does not provide raw browser TCP.

The current Dusk adapter does not include SCP, SFTP, agent forwarding, SSH config-file parsing, arbitrary `-o` options, or direct socket transports. It requires a Wisp endpoint or injected MoonBeam relay and explicit host-key policy.
