# Development guide

## Prerequisites

- **Node.js 18+**
- **Windows** (native addon uses Win32 APIs)
- **Visual Studio Build Tools** (for compiling the C++ addon via `node-gyp`)

## Initial setup

### 1. Build the native addon

```bash
cd src/clipboard-addon
npm install
```

This runs `node-gyp rebuild` and produces `build/Release/clipboard.node`.

### 2. Install dependencies

```bash
# Electron app
cd src
npm install

# React app
cd ../clipboard-react-app
npm install
```

## Running in development

Use two terminals:

**Terminal 1 — Vite dev server:**

```bash
cd clipboard-react-app
npm run dev
```

**Terminal 2 — Electron:**

```bash
cd src
npm run dev
```

Notes:

- The window starts hidden; press **Alt+V** to show/hide it.
- DevTools open automatically when `NODE_ENV=development`.
- Electron loads `http://localhost:5173`.

> **Important:** Run Electron from `src/`, not the repo root. The main entry is `src/main.js`.

## Production build

```bash
cd clipboard-react-app
npm run build

cd ../src
npm run build    # electron-builder → Windows NSIS installer
```

## Releasing

Pushes to the `develop` branch trigger `.github/workflows/release.yml`, which:

1. Builds the React app
2. Installs Electron dependencies
3. Runs `electron-builder --publish always` (requires `GH_TOKEN` secret)

Releases are published to GitHub via electron-builder's GitHub provider.

> **Note:** The CI workflow currently does not build the C++ addon. Releases may fail on a clean checkout unless the addon is pre-built or a build step is added.

## Implementation notes

1. **Native addon path is hardcoded** — `clipboardController.js` requires `../clipboard-addon/build/Release/clipboard`. Rebuild after cloning or changing C++ code.
2. **History is not persisted** — `clipboardHistory` lives in React `useState`; restarting clears everything.
3. **Text only** — The C++ layer reads `CF_TEXT` (ANSI). Unicode (`CF_UNICODETEXT`) and binary formats are not handled.
4. **HMR guard in App.jsx** — `isListenerAttached` ref prevents double IPC listeners during Vite hot reload.
5. **Filename casing inconsistency** — `ClipBoardList.jsx` imports `./ClipboardItem` but the file is `ClipBoardItem.jsx`. Works on Windows but breaks on case-sensitive filesystems.
6. **Unused dependency** — `node-keylogger` is in `src/package.json` but not used.
7. **No tests** — `npm test` is a placeholder.

## Known bugs

| Issue | Location | Fix |
|-------|----------|-----|
| `clipboardListener` undefined on quit | `src/main.js` | Should call `clipboardController.stopListening()` |
| CI branch name mismatch | `release.yml` | Workflow name says `master`, trigger is `develop` |
| CI missing addon build | `release.yml` | Add `node-gyp rebuild` step for `src/clipboard-addon` |

## Rebuilding native code

After any change to `src/clipboard-addon/`:

```bash
cd src/clipboard-addon
npm run install   # or: node-gyp rebuild
```
