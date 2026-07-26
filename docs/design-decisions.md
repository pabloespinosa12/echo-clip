# Design decisions

Decisions made during early development and their rationale.

| Decision | Why |
|----------|-----|
| **Separate React app + Electron main** | Keeps UI tooling (Vite HMR) independent from the main process; clear boundary between renderer and backend. |
| **C++ addon for reading clipboard** | Electron's clipboard API is too high-level for a history manager — no change events, no format enumeration, poor multi-type support. See [Why native clipboard access?](native-clipboard.md). |
| **`clipboard-event` for change detection** | Bridges the gap until the C++ layer implements native listeners directly; wraps OS clipboard notifications on Windows. |
| **In-memory history in React state** | Simplest MVP; history is lost on restart. Persistence deferred. |
| **Singleton `clipboardController`** | One listener for the whole app; exported as `module.exports = new ClipboardController()`. |
| **Skip flag for programmatic copies** | Prevents duplicate entries when the user re-copies from history. |
| **Hide on close, not quit** | Matches "always running in background" UX for a clipboard manager. |
| **Plain JavaScript (no TypeScript)** | Keeps the stack minimal during early development. |
| **Hardcoded `Alt+V` shortcut** | Quick to ship; configuration deferred to a future settings page. |
| **Auto-start at login (hardcoded)** | Enabled via `app.setLoginItemSettings({ openAtLogin: true })` with no user toggle yet. |
| **Platform abstraction (planned)** | Windows C++ addon cannot run on macOS/Linux. Future `clipboard-service` JS interface with per-OS native backends. See [native-clipboard.md](native-clipboard.md). |

## Native clipboard — the key decision

The most significant architectural choice was using a C++ addon instead of `electron.clipboard.readText()`.

Electron's API works for normal copy/paste, but a clipboard history manager needs:

1. **Event-driven change detection** — not polling every 500 ms
2. **Format inspection** — text, files, images, HTML, custom formats
3. **Low-level read control** — clipboard ownership and timing on Windows

Full explanation: **[Why native clipboard access?](native-clipboard.md)**

## Current limitations

- **Windows only** — Native addon and clipboard monitoring are Windows-centric.
- **Text only** — Images, files, rich text, and HTML formats are not captured yet (native layer exists to add them).
- **No persistence** — History does not survive restarts.
- **No item management** — Cannot pin, delete, or clear entries.
- **Weak deduplication** — Only consecutive duplicates are filtered.
- **No keyboard navigation** — Mouse-only selection.
- **No system tray** — Only the global shortcut opens the app.
- **No settings UI** — Shortcut, auto-start, and storage are not configurable.
- **Fixed window size** — 330×445 px, no resize logic.
- **No cleanup policy** — History grows unbounded in memory for the session.
