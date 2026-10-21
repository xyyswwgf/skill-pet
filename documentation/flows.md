# Flows

## Browse Added Skills

| Field | Detail |
| --- | --- |
| Actor | Local macOS user. |
| Precondition | Codex skills or plugin cache exist on the same machine. |
| Success outcome | Personal skills are grouped, sorted by update time, and shown with concise English descriptions. |

1. The WebView invokes `discover_skills`.
2. Rust scans known local roots with directory and file-size limits.
3. Rust excludes Codex runtime/bundled marketplaces from the personal set.
4. The WebView groups personal records and renders the result.

Trust boundary: WebView to Rust command, then Rust to local filesystem. There is no authorization claim because this is a single-user local app. The deny case is an unreadable or missing directory; it is returned as unavailable rather than bypassed.

## Move And Expand The Floating Ball

| Field | Detail |
| --- | --- |
| Actor | Local macOS user. |
| Precondition | Skill Pet is running. |
| Success outcome | The ball stays on-screen; a click expands from its current screen position without moving that position. |

1. Pointer movement invokes `move_window` with a delta.
2. Rust clamps the target window position to the current monitor work area.
3. A click invokes `set_panel_mode`.
4. Rust selects the side with the most available horizontal and vertical work area, records the matching corner anchor, resizes the panel, and preserves the ball coordinate.
5. The WebView applies the returned corner class and reserves that corner as a content-safe zone, so the SP button cannot cover the title, search field, or list.
6. `Escape` clears an active search first; pressing it again collapses the panel.

## Refresh The Inventory

1. Opening the panel scans the local skill roots again.
2. The user can select “Refresh” to trigger the same read-only scan without collapsing the panel.
3. The interface displays a scanning state, an actionable retry state on failure, and an explicit empty state when no personal skills match.

Trust boundary: WebView to local window-management commands. No filesystem or network side effect occurs in this flow.
