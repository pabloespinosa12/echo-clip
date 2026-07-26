# Design decisions

Decisions made during early development and their rationale.

| Decision | Why |
|----------|-----|
| **Separate React app + Electron main** | Keeps UI tooling (Vite HMR) independent from the main process; clear boundary between renderer and backend. |
| **C++ addon for reading clipboard** | Native Win32 access instead of Electron's clipboard API — chosen for reliability and future multi-format support. Writing still uses Electron's `clipboard.writeText()`. |
| **`clipboard-event` for change detection** | Lightweight notification on clipboard changes without polling. |
| **In-memory history in React state** | Simplest MVP; history is lost on restart. Persistence deferred. |
| **Singleton `clipboardController`** | One listener for the whole app; exported as `module.exports = new ClipboardController()`. |
| **Skip flag for programmatic copies** | Prevents duplicate entries when the user re-copies from history. |
| **Hide on close, not quit** | Matches "always running in background" UX for a clipboard manager. |
| **Plain JavaScript (no TypeScript)** | Keeps the stack minimal during early development. |
| **Hardcoded `Alt+V` shortcut** | Quick to ship; configuration deferred to a future settings page. |
| **Auto-start at login (hardcoded)** | Enabled via `app.setLoginItemSettings({ openAtLogin: true })` with no user toggle yet. |

## Current limitations

- **Windows only** — Native addon and clipboard monitoring are Windows-centric.
- **Text only** — Images, files, rich text, and HTML formats are not captured.
- **No persistence** — History does not survive restarts.
- **No item management** — Cannot pin, delete, or clear entries.
- **Weak deduplication** — Only consecutive duplicates are filtered.
- **No keyboard navigation** — Mouse-only selection.
- **No system tray** — Only the global shortcut opens the app.
- **No settings UI** — Shortcut, auto-start, and storage are not configurable.
- **Fixed window size** — 330×445 px, no resize logic.
- **No cleanup policy** — History grows unbounded in memory for the session.
