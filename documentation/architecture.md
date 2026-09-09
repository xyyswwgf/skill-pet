# Architecture

## Product

Skill Pet is a macOS-only, local-only Tauri utility for viewing skills that a user added to Codex. It reads `SKILL.md` metadata, groups personal skills, and never executes, edits, enables, disables, uploads, or deletes a skill.

## Components

| Component | Responsibility |
| --- | --- |
| `web/` | Search, grouping, Chinese summaries, inline skill details, floating-ball interaction. |
| `src-tauri/src/main.rs` | Read-only filesystem scan, personal-source classification, window movement, transparent-window setup, and directional panel placement. |
| `src-tauri/tauri.conf.json` | Local asset loading, CSP, undecorated always-on-top window, and macOS private transparent-window support. |

## Trust Boundaries

| Boundary | Rule |
| --- | --- |
| WebView to Rust command | The UI can invoke only the compiled read-only discovery and window commands. |
| Rust to local filesystem | Scans bounded skill roots and limits file/tree sizes before returning content. |
| App to network | No network client, remote API, localhost server, or cloud sync exists in the packaged app. |

## Assumptions And Risks

- Transparency relies on macOS private WebKit APIs because WKWebView does not provide a stable public transparent-background API. This makes the App Store an unsupported distribution channel.
- Skill roots and marketplace layout are discovered from local Codex conventions. Future Codex layout changes may require scanner updates.
- The app refreshes its inventory when opened; it does not currently run a filesystem watcher while collapsed.
- No scheduled work, email, SEO surface, embedded agent, authentication, database, or external provider exists.

## Related Documents

- [Flows](flows.md)
- [Permissions](permissions.md)
- [Variables](variables.md)
- [Tests](tests.md)
