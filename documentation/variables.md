# Variables

| Name | Used by | Scope | Source | Rotation | Risk |
| --- | --- | --- | --- | --- | --- |
| `HOME` | Rust scanner | Local process | Operating system | Not applicable | Determines candidate local skill roots. |

No API keys, passwords, tokens, service-role credentials, or user secrets are bundled into the app or stored in this repository.

Before distributing a build:

- Confirm the release build still has no network client or remote endpoint.
- Confirm the scanner remains read-only and bounded.
- Confirm `macOSPrivateApi` is acceptable for the intended non-App-Store distribution channel.
- Confirm the packaged app is launched from the current build output, not an older running process.
