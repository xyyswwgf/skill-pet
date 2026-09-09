# Contributing to Skill Pet

## Scope

Skill Pet is a macOS-only, local-only and read-only viewer for Codex skills. Contributions must preserve those boundaries: do not add remote data collection, accounts, cloud synchronization, skill execution, or skill mutation without an explicit product decision.

## Before Opening a Pull Request

1. Search existing issues and pull requests to avoid duplicates.
2. Keep one pull request focused on one behavior or documentation change.
3. Do not include local skill files, personal paths, `node_modules`, `src-tauri/target`, or release archives.
4. Run the checks below from the repository root.

```bash
npm install
npm run build
node --check web/main.js
```

## Pull Request Expectations

- Explain the user-visible behavior and the reason for the change.
- Add or update focused tests when changing scanning, source classification, window positioning, or interaction behavior.
- Test native UI changes on macOS, including collapsed transparency, drag movement, expansion direction, and list scrolling when relevant.
- Update README or documentation whenever a user-facing behavior, dependency, permission, or distribution requirement changes.

## Reporting Bugs and Proposing Features

Use the provided GitHub issue templates. Include macOS version, Skill Pet version, reproduction steps, expected result, actual result, and screenshots that do not reveal private paths or skill content.

Security-sensitive issues should follow [SECURITY.md](SECURITY.md) rather than a public issue.
