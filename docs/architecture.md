# Architecture

Echo-Clip is an Electron desktop app with a React frontend and a small C++ native addon for reading the Windows clipboard.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     clipboard-react-app/                        │
│              React 19 + Vite (renderer / UI)                    │
│   SearchBar, ClipBoardList, ClipBoardItem                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ preload bridge (contextBridge)
                            │  - onClipboardUpdate
                            │  - copyText
┌───────────────────────────▼─────────────────────────────────────┐
│                          src/                                   │
│                   Electron main process                         │
│   main.js  ·  preload.js  ·  clipboardController.js             │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
                │ clipboard-event             │ C++ N-API addon
                │ (change notifications)      │ (read clipboard text)
┌───────────────▼─────────────────────────────▼───────────────────┐
│              src/clipboard-addon/  (Windows Win32 API)          │
│   addon.cpp  ·  clipboard.cpp  ·  clipboard.h                   │
└─────────────────────────────────────────────────────────────────┘
```

## Layers

| Layer | Technology | Role |
|-------|------------|------|
| UI | React 19, Vite 6, plain CSS | Display history, search, re-copy items |
| Main process | Electron 34 | Window lifecycle, global shortcut, IPC, system clipboard write |
| Controller | Node.js (`clipboardController.js`) | Listen for clipboard changes, dedupe, notify renderer |
| Native addon | C++ / node-addon-api | Read clipboard text via Win32 `OpenClipboard` / `CF_TEXT` |
| Clipboard events | `clipboard-event` npm package | Fires when the OS clipboard changes |
| Packaging | electron-builder | Windows NSIS installer, GitHub releases |

## Data flow

### New clipboard copy (OS → UI)

1. User copies text in any application.
2. `clipboard-event` fires a change event.
3. `clipboardController` reads content via the C++ addon.
4. Empty entries and consecutive duplicates are filtered out.
5. Main process sends `clipboard-update` to the renderer.
6. React prepends the new entry to in-memory history.

### Re-copy from history (UI → OS)

1. User clicks an entry in the UI.
2. Renderer calls `window.electron.copyText(text)`.
3. Main process sets `skipClipboardChange` flag (prevents re-recording).
4. Main process writes text via Electron's `clipboard.writeText()`.
5. Window hides automatically.

## IPC surface

Exposed on `window.electron` via `preload.js`:

| API | Direction | Purpose |
|-----|-----------|---------|
| `onClipboardUpdate(callback)` | Main → Renderer | Push new clipboard text to the UI |
| `removeClipboardUpdate(callback)` | — | Remove listener (defined but unused in UI today) |
| `copyText(text)` | Renderer → Main | Write text to system clipboard |

## Project structure

```
echo-clip/
├── clipboard-react-app/     # React frontend (Vite)
│   └── src/
│       ├── App.jsx
│       └── components/      # SearchBar, ClipBoardList, ClipBoardItem
├── src/                     # Electron main process (run from here)
│   ├── main.js
│   ├── preload.js
│   ├── controllers/
│   │   └── clipboardController.js
│   └── clipboard-addon/     # C++ native module (Windows)
├── docs/                    # Technical documentation
└── .github/workflows/       # CI release pipeline
```

## Platform-specific code

| Location | Platform |
|----------|----------|
| `src/clipboard-addon/src/clipboard.cpp` | Windows only (`<windows.h>`, `CF_TEXT`) |
| Everything else | Electron/JS — portable in theory, tested on Windows only |

When adding cross-platform support, keep OS-specific clipboard reads behind an abstraction in the main process.

## Security model

- `contextIsolation: true`
- `nodeIntegration: false`
- Renderer cannot access Node.js or Electron APIs directly
- All privileged operations go through the preload bridge
