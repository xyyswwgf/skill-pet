# Security Policy

## Supported Versions

Security fixes are applied to the latest release on the `main` branch. Older releases are not maintained.

## Security Model

Skill Pet is intentionally local-only and read-only. It should not transmit local skill content, execute skill scripts, change Codex configuration, or write to scanned skill directories.

## Reporting a Vulnerability

Do not include exploit details, personal paths, credentials, or private `SKILL.md` content in a public GitHub issue.

Open a private security advisory for this repository through GitHub's "Security" tab. Include a concise description, affected version, reproduction steps, impact, and a safe proof of concept. The maintainer will acknowledge reports as capacity permits and coordinate a fix before public disclosure.

## Distribution Note

The macOS transparent-window implementation enables `macOSPrivateApi`. Releases are intended for direct local distribution and are not eligible for Mac App Store distribution. Users should obtain builds only from this repository's Releases page or build from audited source.
