# AGENTS.md — AI assistant guide for Echo-Clip

This file helps Cursor and other AI coding assistants understand Echo-Clip before making changes. Read this alongside the [technical docs](docs/) — especially [docs/native-clipboard.md](docs/native-clipboard.md) for why the C++ addon exists. The root `README.md` is the public-facing overview only.

---

## Project overview

**Echo-Clip** is an Electron clipboard history manager (Windows-first). It monitors the system clipboard, stores copied **text** in an in-memory list, and shows a searchable overlay when the user presses a global shortcut.

**Stack:** Electron 34 · React 19 · Vite 6 · JavaScript (no TypeScript) · C++ N-API addon (Win32)

**Maturity:** Early MVP. Core loop works (monitor → display → re-copy). Most product features are planned, not built.

---

## Repository layout

| Path | Responsibility |
|------|----------------|
| `src/main.js` | Electron entry: window, global shortcut, IPC handlers, auto-start |
| `src/preload.js` | Secure bridge exposing `window.electron` API to renderer |
| `src/controllers/clipboardController.js` | Clipboard listener, dedupe logic, native read orchestration |
| `src/clipboard-addon/` | C++ module: `getClipboardContent()` via Win32 API |
| `clipboard-react-app/src/App.jsx` | Root React component; owns in-memory history state |
| `clipboard-react-app/src/components/` | UI: `SearchBar`, `ClipBoardList`, `ClipBoardItem` |
| `clipboard-react-app/vite.config.js` | Vite config; `base: './'` in production for Electron file loading |
| `.github/workflows/release.yml` | CI: build React → electron-builder → GitHub release |

**Run Electron from `src/`**, not the repo root.

---

## Architecture rules — do not break

These constraints exist for security, correctness, or project structure. Violating them causes bugs or makes cross-platform work harder.

### 1. Renderer isolation

- **`contextIsolation: true`** and **`nodeIntegration: false`** in `BrowserWindow` webPreferences.
- The renderer must **never** import Node/Electron modules directly.
- All main↔renderer communication goes through **`preload.js`** via `contextBridge`.

When adding IPC:

```js
// preload.js — expose a typed, minimal API
contextBridge.exposeInMainWorld("electron", { ... });

// main.js — handle with ipcMain.on / ipcMain.handle
// React — call window.electron.*
```

Prefer `ipcMain.handle` + `ipcRenderer.invoke` for request/response patterns (e.g. future delete/pin APIs).

### 2. Single clipboard listener

`clipboardController.js` exports a **singleton**. Only one `clipboard-event` listener should exist. Do not instantiate multiple controllers.

### 3. Skip flag for programmatic copies

When the app writes to the clipboard (user selects a history item), **always** call `clipboardController.skipClipboardChange()` before writing. Otherwise the entry is duplicated in history.

### 4. Native addon for reads, Electron for writes (current pattern)

- **Read:** C++ addon (`clipboardAddOn.getClipboardContent()`)
- **Write:** Electron `clipboard.writeText()` in `main.js`

The addon exists because Electron's clipboard API is too high-level for a history manager — no change events, no format enumeration, poor multi-type support. See [docs/native-clipboard.md](docs/native-clipboard.md). Do not replace the addon with `clipboard.readText()` polling without an explicit decision.

### 5. Platform-specific code stays isolated

Windows-only code belongs in `src/clipboard-addon/` (future: `src/native/windows/`). Do not sprinkle `#include <windows.h>` logic into JS. Cross-platform support requires a `clipboard-service.js` interface with per-OS native backends — see [docs/native-clipboard.md](docs/native-clipboard.md).

### 6. Do not persist data silently

History is in-memory today. Adding persistence requires an explicit storage module and migration strategy — do not write to disk ad hoc from React components.

### 7. Two-package structure

- `src/package.json` — Electron main process
- `clipboard-react-app/package.json` — React renderer

Do not merge these without a deliberate refactor. Production loads `clipboard-react-app/dist/index.html` from the Electron app.

---

## Coding conventions

| Area | Convention |
|------|------------|
| Language | JavaScript only (`.js` / `.jsx`); no TypeScript unless the project is migrated |
| React | Functional components, hooks; no class components |
| Modules | CommonJS in Electron (`require`); ESM in React app (`import`) |
| Components | One component per file in `clipboard-react-app/src/components/` |
| Styling | Plain CSS in `index.css`; no CSS-in-JS or Tailwind currently |
| Naming | Mixed `ClipBoard` / `Clipboard` casing exists — **match surrounding files** in the area you edit; consider normalizing in a dedicated refactor |
| State | React `useState` / `useEffect` for UI state; no Redux/Zustand yet |
| Logging | `console.log` / `console.warn` for debug; no structured logger |

---

## Existing features (verified in code)

### Fully working

- Hidden window on launch; **Alt+V** toggles visibility
- Clipboard change detection → text read via C++ addon → IPC push to React
- In-memory history list (prepend newest)
- Search bar filters by substring (case-insensitive)
- Click item → copy to clipboard → hide window
- Consecutive duplicate skip in controller
- Close button hides window (app keeps running)
- Auto-start at login (hardcoded `openAtLogin: true`)
- Dev/prod loading split (Vite URL vs built `dist/`)

### Partially working / incomplete

- **Duplicate avoidance** — only last-entry comparison in `clipboardController.js`
- **Auto-start** — no user-facing toggle
- **Background mode** — no tray icon
- **Search** — filter only; no sort or type filter
- **Shortcut** — hardcoded; not Win+V

### Not implemented (do not document or imply as done)

Pin, delete, clear history, favorites, categories/types, keyboard nav, settings page, configurable shortcuts, system tray, persistence, cleanup policies, Linux/macOS support, image/file clipboard.

---

## Known bugs and tech debt

Fix these when touching related code:

| Issue | Location | Notes |
|-------|----------|-------|
| `clipboardListener` undefined on quit | `src/main.js:59-61` | Should be `clipboardController.stopListening()` |
| Import path casing | `ClipBoardList.jsx` imports `./ClipboardItem`, file is `ClipBoardItem.jsx` | Breaks on case-sensitive filesystems |
| Unused dep | `node-keylogger` in `src/package.json` | Safe to remove if not planned |
| Unbounded history | `App.jsx` | No max length; session-only |
| `removeClipboardUpdate` unused | `preload.js` / `App.jsx` | Listeners not cleaned up on unmount |
| CI branch mismatch | `release.yml` | Workflow name says `master`, trigger is `develop` |
| Native addon not in CI | `release.yml` | Workflow does not build C++ addon; release may fail on clean checkout unless addon is committed or build step added |

---

## Important files — quick reference

```
Data flow for a new clipboard copy:
  OS clipboard change
    → clipboard-event (npm)
    → clipboardController.startListening()
    → clipboardAddOn.getClipboardContent()  [C++]
    → dedupe / empty check
    → mainWindow.webContents.send("clipboard-update")
    → preload onClipboardUpdate callback
    → App.jsx setClipboardHistory

Data flow for re-copying from history:
  ClipBoardItem click
    → window.electron.copyText(text)
    → ipcMain "copy-text"
    → skipClipboardChange() + clipboard.writeText()
    → mainWindow.hide()
```

---

## Things to consider before modifying code

### Adding a new clipboard content type (image, file, etc.)

1. Extend C++ addon (or replace with cross-platform library) to read additional formats.
2. Change history item shape from `string` to `{ id, type, content, timestamp, ... }`.
3. Update IPC payloads, React components, and dedupe logic.
4. Update `ClipBoardItem` rendering per type.
5. Do this **before** persistence so the schema is stable.

### Adding persistence

1. Decide storage (SQLite recommended for search + large histories).
2. Store in **main process**, not renderer.
3. Expose load/save via IPC; React requests history on mount.
4. Define cleanup policy (max entries, TTL) at write time.
5. Handle migration if schema changes.

### Adding pin / delete / clear

1. Implement in main process if persisted; otherwise extend React state with actions.
2. Add IPC channels: e.g. `delete-entry`, `pin-entry`, `clear-history`.
3. For delete/clear, decide whether to touch the OS clipboard (usually no).

### Changing the global shortcut

1. Modify `globalShortcut.register()` in `main.js`.
2. Unregister on quit (`globalShortcut.unregisterAll()` in `will-quit`).
3. Future: store preference in settings file, register dynamically.

### Cross-platform work

Read [docs/native-clipboard.md](docs/native-clipboard.md) before touching clipboard code.

| Component | Platform coupling |
|-----------|-------------------|
| `clipboard.cpp` / `clipboard.h` | **Windows only** (`windows.h`, `CF_TEXT`) |
| `clipboard-event` | Works on Windows/macOS/Linux — verify behavior per OS |
| `app.setLoginItemSettings` | Electron API — behavior differs by OS |
| `globalShortcut` | Electron API — may conflict with OS shortcuts |
| electron-builder `win.target: nsis` | Windows installer only |

Target pattern — Electron only talks to a JS service:

```js
const clipboardService = require('./native/clipboard-service');

clipboardService.onClipboardChange((item) => {
  history.add(item);
});
```

Per-OS backends: Windows (Win API), macOS (`NSPasteboard`), Linux (X11 / Wayland).

---

## How to safely add new features

1. **Read `docs/` and this file** — confirm the feature is not already partially there.
2. **Classify the feature** — UI-only, main-process, native, or storage. Touch the minimum layers.
3. **Preserve IPC boundaries** — new capabilities get preload exposure + main handler.
4. **Test the skip-flag path** — any feature that writes to the clipboard must not pollute history unintentionally.
5. **Dev workflow** — two terminals: `clipboard-react-app/npm run dev` + `src/npm run dev`.
6. **Rebuild native code** after C++ changes: `cd src/clipboard-addon && npm run install`.
7. **Do not invent features in docs** — update `docs/roadmap.md` and this file when implementing.
8. **Prefer small PRs** — e.g. persistence schema first, then UI for delete, then pin.

### Suggested implementation order (matches product priority)

1. **History item model** — `{ id, text, createdAt, pinned? }` instead of raw strings
2. **Persistence** — SQLite in main process
3. **Delete + clear** — IPC + UI
4. **Full deduplication** — on insert, check existing entries
5. **Pin / favorites**
6. **Keyboard navigation**
7. **Settings page** — shortcut, auto-start, max history
8. **System tray**
9. **Content types** — image/file support in native layer
10. **Cross-platform** — replace or wrap C++ addon

---

## Development commands

```bash
# Native addon (Windows + VS Build Tools)
cd src/clipboard-addon && npm install

# Terminal 1
cd clipboard-react-app && npm run dev

# Terminal 2
cd src && npm run dev

# Production
cd clipboard-react-app && npm run build
cd ../src && npm run build
```

---

## Future roadmap (planned — not implemented)

Use this checklist when scoping work. Do **not** mark items done unless the code exists.

### Clipboard item management

- Pin important clipboard entries
- Delete individual entries
- Clear clipboard history
- Avoid storing duplicates (full history, not just consecutive)
- Clipboard categories/types (text, images, files)

### Search and organization

- Fast search (indexing for large histories)
- Filter by type
- Sort by date/frequency
- Favorites

### UX

- Better UI/UX
- Keyboard navigation
- Configurable global shortcuts
- Settings page
- Auto-start with OS (user-configurable)
- System tray icon for background operation

### Data / storage

- Persistent storage strategy
- Efficient handling of large histories
- Cleanup policies (count, age, size limits)

### Cross-platform

- Linux and macOS support
- Document Electron limitations per OS
- Abstract platform-specific clipboard code
- Avoid Windows-only patterns outside `clipboard-addon/`
- Fix filename casing for case-sensitive filesystems

---

## What not to do

- Do not enable `nodeIntegration` in the renderer for convenience.
- Do not store clipboard history only in React state if persistence is the goal — use main process.
- Do not add TypeScript piecemeal without a project-wide decision.
- Do not use Windows-only APIs in shared JS files.
- Do not document features as implemented based on intent alone — verify in code.
- Do not remove `skipClipboardChange()` when adding new "copy to clipboard" flows.

---

## Questions to ask the user before large changes

- Should history sync across restarts immediately, or is in-memory still fine for this iteration?
- Preferred storage backend (SQLite, JSON file, etc.)?
- Should pinned items survive "clear history"?
- Target shortcut (Win+V conflicts with Windows 10+ built-in clipboard)?
- Is cross-platform required for this change, or Windows-only acceptable for now?
