# Build Skill Pet

## Requirements

- Node.js 18+
- Rust stable with `cargo`
- Xcode Command Line Tools: `xcode-select --install`

Install Rust:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Development

```bash
cd "/Users/xy/Documents/ChatGPT/skills插件开发/skill-pet"
npm install
npm run dev
```

## Package

```bash
cd "/Users/xy/Documents/ChatGPT/skills插件开发/skill-pet"
npm install
npm run build
```

The packaged macOS app is created under:

```text
src-tauri/target/release/bundle/
```

## Distribution Notes

- `macOSPrivateApi` is enabled to make the floating ball truly transparent. This is appropriate for direct local distribution, not the Mac App Store.
- A locally built App is unsigned. For first launch, Control-click the App in Finder and choose “Open” if macOS warns about the developer.
- For public distribution, sign with an Apple Developer ID and notarize the final `.app` or `.dmg`.
- Create the public source ZIP from a clean checkout. Do not include `node_modules/`, `src-tauri/target/`, `.git/`, or personal Codex skills.

## Preview Without Rust

```bash
cd "/Users/xy/Documents/ChatGPT/skills插件开发/skill-pet"
npm run preview
```

Then open:

```text
http://127.0.0.1:4174
```
