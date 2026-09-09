# Product Roadmap

## Current Product Baseline

- A local-only, read-only macOS utility for skills added to Codex.
- A movable floating ball that expands inward from any screen corner without hiding panel content.
- Search, grouped browsing, inline skill names, concise Chinese descriptions, refresh feedback, empty/error states, and keyboard collapse.

## Next Priorities

| Priority | Improvement | Outcome |
| --- | --- | --- |
| P0 | Persist the ball position and last panel anchor across app restarts. | The utility returns exactly where the user left it. |
| P0 | Add a menu-bar item with Show/Hide and Quit actions. | The App remains discoverable after the panel is collapsed. |
| P1 | Watch local skill roots and show a subtle “skills updated” refresh affordance. | Newly installed skills appear without reopening the panel. |
| P1 | Add fixture-based Rust tests for marketplace classification and corner-placement calculations. | Codex layout changes and multi-monitor regressions are caught before release. |
| P1 | Add a macOS visual smoke test for transparent collapse, all four anchors, wheel scrolling, and keyboard controls. | Native WebKit behavior is verified instead of assumed. |
| P2 | Sign and notarize release builds, then publish a `.dmg` alongside source ZIP files. | Other users can install the App with fewer macOS security prompts. |
| P2 | Add optional language selection for Chinese/English UI summaries. | The viewer can be shared beyond the current Chinese-first workflow. |
