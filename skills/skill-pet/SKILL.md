---
name: skill-pet
description: Open or explain the local Skill Pet Tauri window for inspecting installed Codex skills, including personal, project, and plugin-distributed SKILL.md files. Use when the user wants to list, search, inspect, or understand available Codex skills without modifying their installation.
---

# Skill Pet

Use this skill when the user wants to browse or inspect their installed Codex skills.

## Behavior

- Prefer the Tauri app with `npm run dev` during development or the packaged app after build.
- Use the web fallback only when Rust/Tauri is unavailable: `node <plugin-root>/scripts/server.mjs --workspace <workspace> --port 0`.
- Do not install, uninstall, enable, disable, rename, or edit skills.
- Do not execute scripts found inside any skill.
- Keep the app local-only. If the user asks for remote exposure, explain that this plugin intentionally does not support it.

## Discovery Scope

Skill Pet scans:

- `~/.codex/skills`
- `~/.agents/skills`
- `.agents/skills` under the selected workspace
- `~/.codex/plugins/cache`

Plugin cache entries are inspection-only.

## Architecture Note

This plugin follows the local-first approach used by `pc-style/skill-view`, but it is tailored for Codex's local plugin cache layout and avoids taking a runtime dependency on the external package.
