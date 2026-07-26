# Roadmap

Feature status as of the current codebase. Do not mark items as done unless the code actually implements them.

## Implemented

- Background operation with a hidden window (close hides, does not quit)
- Global shortcut **Alt+V** to toggle the history window
- Real-time clipboard monitoring for plain text
- In-memory clipboard history (newest first)
- Client-side text search (case-insensitive substring)
- Click an entry to copy it back and auto-hide the window
- Consecutive duplicate suppression
- Skip re-recording when copying from the app's own UI
- Auto-start at login (hardcoded, no UI toggle)
- GitHub Actions release workflow (push to `develop`)
- Secure renderer (`contextIsolation`, no `nodeIntegration`)

## Partially implemented

| Feature | Current state |
|---------|---------------|
| Duplicate avoidance | Only skips if identical to the immediately previous entry |
| Auto-start | Enabled in code only; no settings toggle |
| Background / tray | Window hides on close, but no system tray icon |
| Search | Substring filter only; no type, date, or frequency sorting |
| Global shortcut | Hardcoded `Alt+V`; not configurable |
| Content types | Text only; images and files are ignored |

## Planned

### Clipboard item management

- [ ] Pin important clipboard entries
- [ ] Delete individual entries
- [ ] Clear clipboard history
- [ ] Avoid storing duplicates (full-history dedup, not just consecutive)
- [ ] Add clipboard categories/types (text, images, files, etc.)

### Better search and organization

- [ ] Fast search through clipboard history
- [ ] Filtering by type
- [ ] Sorting by date/frequency
- [ ] Favorites

### User experience

- [ ] Better UI/UX
- [ ] Keyboard navigation (arrow keys, Enter to paste, Escape to close)
- [ ] Configurable global shortcuts
- [ ] Settings page
- [ ] Start automatically with the OS (user toggle)
- [ ] System tray icon for background operation

### Data and storage

- [ ] Persistent storage strategy (e.g. SQLite)
- [ ] Efficient handling of large histories
- [ ] Cleanup policies (max entries, max age, max size)

### Cross-platform

- [ ] Introduce `clipboard-service.js` platform-agnostic interface
- [ ] Refactor `src/clipboard-addon/` → `src/native/windows/`
- [ ] macOS backend (`NSPasteboard` via ObjC++ / Swift bridge)
- [ ] Linux backend (X11 via XFixes, Wayland via wlroots/protocols)
- [ ] Avoid Windows-only patterns outside `src/native/`

See [native-clipboard.md](native-clipboard.md) for rationale and target architecture.

## Suggested implementation order

1. History item model (`{ id, text, createdAt, pinned? }` instead of raw strings)
2. Persistence (SQLite in main process)
3. Delete and clear history
4. Full deduplication
5. Pin / favorites
6. Keyboard navigation
7. Settings page (shortcut, auto-start, max history)
8. System tray
9. Content types (image/file support in native layer)
10. Cross-platform abstraction
