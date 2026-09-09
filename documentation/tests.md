# Tests

## Existing Coverage

| Use case | Rule | Evidence | Status |
| --- | --- | --- | --- |
| Compile native commands | Rust types and Tauri command registration compile | `cargo check --manifest-path src-tauri/Cargo.toml` | Existing manual build check |
| Build package | Release application bundles successfully | `npm run build` | Existing manual build check |
| Parse frontend | Browser module has valid JavaScript syntax | `node --check web/main.js` | Existing manual build check |

## Proposed Tests

| Use case | Expected behavior | Test type | Evidence source | Status |
| --- | --- | --- | --- | --- |
| Transparent ball | Collapsed app contains only the circular PNG, without white WebView backing | Guarded live manual | Native desktop capture, v0.1.4 | Verified on macOS |
| Corner expansion | Each screen corner expands inward while preserving the SP screen coordinate | Guarded live manual | `flows.md` move/expand flow | Proposed |
| Scroll | Expanded list consumes mouse-wheel input and reaches its final skill | Guarded live manual | `web/styles.css` list region | Manual verification required per release |
| Scanner classification | Bundled/runtime skills are excluded while user-added marketplace skills remain | Automated Rust unit | `discover_skills` rules | Proposed |
| Drag bounds | Ball/panel cannot leave the current monitor work area | Automated Rust unit | `move_window` clamp rule | Proposed |

## Gaps

| Gap | Exposure | Priority |
| --- | --- | --- |
| No automated macOS visual test | The collapsed transparent state was manually verified in v0.1.4, but it can still regress across macOS/Tauri upgrades | High |
| No fixture-based scanner tests | Codex cache-layout changes may misclassify skills | Medium |
| No release signing/notarization process | End users may see macOS trust prompts when moving beyond local development | Medium |
