# Skill Pet

<p align="center">
  <img src="assets/skill-pet-icon.png" width="120" alt="Skill Pet icon">
</p>

<p align="center">
  <strong>A local-first macOS floating viewer for skills you add to Codex.</strong>
</p>

<p align="center">
  <a href="https://github.com/xyyswwgf/skill-pet/releases"><img src="https://img.shields.io/github/v/release/xyyswwgf/skill-pet?display_name=tag&label=release" alt="Latest release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-4b86f7" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/platform-macOS%2012%2B-4b86f7" alt="macOS 12 or later">
  <img src="https://img.shields.io/badge/data-local%20only-4b86f7" alt="Local only">
</p>

Skill Pet brings your added Codex skills into a searchable, expandable local inventory. It does not run, modify, or install skills, and it does not send local paths or `SKILL.md` contents over the network.

## Why Skill Pet

As your skills collection grows, it can be hard to see what you added and what each skill does. Skill Pet keeps that information one click away in a floating window. Drag the circular SP button to position it, expand the viewer when needed, and collapse it when you are done.

## Highlights

- Shows personally added skills while filtering out the Codex runtime and bundled marketplace content.
- Scans Codex user directories, shared local directories, workspace `.agents/skills` folders, and user-added plugin cache entries.
- Groups skills by plugin and purpose, sorts them by update time, and offers concise English summaries and search.
- Lets you drag the SP button. When expanded, the panel chooses a direction based on available screen space while keeping the button in place.
- Supports scrolling, expandable groups, refresh, empty states, and error recovery.
- Performs scanning and window management locally, with no account, cloud sync, telemetry, or network client.

## Product Boundaries

| Skill Pet does | Skill Pet does not |
| --- | --- |
| Read local `SKILL.md` metadata and descriptions | Run, edit, install, delete, or enable skills |
| Show names, groups, uses, and sources | Change Codex configuration or plugin state |
| Manage its own window position and expanded state | Upload content, call remote APIs, or start a network service |

## Quick Start

### Run from source

Requirements: macOS 12+, Node.js 18+, stable Rust with `cargo`, and Xcode Command Line Tools.

```bash
git clone https://github.com/xyyswwgf/skill-pet.git
cd skill-pet
npm install
npm run dev
```

A circular SP button appears at startup. Drag it to move the window, then click it to expand or collapse the viewer.

### Build a local app

```bash
npm install
npm run build
open "src-tauri/target/release/bundle/macos/Skill Pet.app"
```

The build output is `src-tauri/target/release/bundle/macos/Skill Pet.app`. The current build is unsigned and not notarized. If macOS blocks it on first launch, Control-click the app in Finder and choose **Open**.

### Download the source package

Download the latest `Skill-Pet-*-source.zip` from [GitHub Releases](https://github.com/xyyswwgf/skill-pet/releases), extract it, and follow the build steps above. The source package excludes `node_modules` and build output.

## How It Works

Skill Pet scans these local locations in read-only mode:

- `~/.codex/skills`
- `~/.agents/skills`
- `.agents/skills` in the current workspace and its subdirectories
- User-added plugins under `~/.codex/plugins/cache`, excluding bundled OpenAI marketplace content

It scans again when you expand the panel or choose **Refresh**. This version does not watch the filesystem continuously, so newly installed skills appear after the next expand or refresh.

## Architecture

| Layer | Responsibility |
| --- | --- |
| `web/` | Search, grouping, English summaries, list interaction, and floating-button interaction. |
| `src-tauri/src/main.rs` | Bounded local read-only scanning, source classification, window movement, and panel placement. |
| `src-tauri/tauri.conf.json` | Local assets, content security policy, transparent borderless window, and macOS configuration. |

See [architecture](documentation/architecture.md), [flows](documentation/flows.md), and [permissions](documentation/permissions.md) for the design and product boundaries.

## Privacy and Security

- No sign-in, account, database, telemetry, or cloud sync.
- No network client, remote API, or local HTTP service, apart from the development preview mode.
- The Rust backend exposes only scanning and window-management commands; it has no file-write or skill-execution command.
- The transparent window uses a private macOS WebKit API, so this project is not suitable for Mac App Store distribution.

Read the [Security Policy](SECURITY.md) for vulnerability reporting and release boundaries.

## Development

```bash
npm install
npm run build
node --check web/main.js
```

To preview only the web interface:

```bash
npm run preview
```

Then open `http://127.0.0.1:4174`. The browser preview cannot reproduce native transparency, system-level dragging, or screen-aware expansion.

Read [Contributing](CONTRIBUTING.md) before contributing. The [test notes](documentation/tests.md) and [roadmap](documentation/roadmap.md) cover current verification, known gaps, and future work.

## Releases

Each release includes a reproducible source ZIP. The maintainer workflow is documented in [BUILD.md](BUILD.md). Before distributing a `.app` to other users, add Apple Developer ID signing and notarization.

## License

Skill Pet is released under the [MIT License](LICENSE).
