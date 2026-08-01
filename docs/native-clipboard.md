# Native clipboard layer

Echo-Clip uses a native addon for clipboard reads instead of relying only on Electron's clipboard API.

## Rationale

Electron is sufficient for simple copy and paste operations, but a clipboard history manager needs lower-level clipboard access and tighter control over platform-specific behavior.

Native access is the foundation for:

- direct reads from OS clipboard APIs
- future format inspection beyond plain text
- event-driven clipboard integrations where the platform supports them
- platform-specific implementations behind a stable JavaScript boundary

The current implementation reads plain text only. Clipboard change notifications are still handled in JavaScript through `clipboard-event`.

## Current architecture

```text
React UI
   |
preload bridge
   |
Electron main process
   |
clipboardController.js
   |
clipboard-event  ->  clipboard-addon
                     |
                     +-- Windows: Win32 clipboard API
                     +-- macOS: NSPasteboard
```

Responsibilities are split as follows:

- `src/controllers/clipboardController.js` listens for clipboard change events and applies deduplication and skip logic.
- `src/clipboard-addon/src/addon.cpp` exposes the native function to Node.js through N-API.
- `src/clipboard-addon/src/clipboard.cpp` implements clipboard reads on Windows.
- `src/clipboard-addon/src/clipboard_mac.mm` implements clipboard reads on macOS.
- `src/main.js` forwards clipboard updates to the renderer and uses Electron for clipboard writes.

The native module currently exports one synchronous function:

```js
clipboardAddOn.getClipboardContent()
```

The controller calls that function after `clipboard-event` emits a change event.

## Runtime flow

```text
OS clipboard change
   |
clipboard-event emits "change"
   |
clipboardController reads clipboardAddOn.getClipboardContent()
   |
main process sends "clipboard-update" to renderer
   |
React updates in-memory history
```

Clipboard writes follow a separate path:

```text
Renderer click
   |
window.electron.copyText(text)
   |
ipcMain "copy-text"
   |
clipboardController.skipClipboardChange()
   |
Electron clipboard.writeText(text)
```

## Native module structure

The addon is split into a Node-facing layer and an OS-facing layer.

### Node-facing layer

`src/clipboard-addon/src/addon.cpp` registers the module and converts native strings into JavaScript strings. The module is built as `clipboard.node`, which is the standard binary extension for Node.js native addons.

### OS-facing layer

- Windows uses Win32 APIs such as `OpenClipboard` and `GetClipboardData`.
- macOS uses `NSPasteboard` through Objective-C++ in `clipboard_mac.mm`.

The `.mm` extension is required on macOS because the implementation mixes C++ types with Cocoa APIs.

## `binding.gyp`

`binding.gyp` is the build configuration file used by `node-gyp`. It defines the native target, the source files to compile, and the platform-specific build rules.

Current shape:

```json
{
  "targets": [
    {
      "target_name": "clipboard",
      "sources": ["src/addon.cpp"],
      "conditions": [
        ["OS=='win'", {
          "sources": ["src/clipboard.cpp"]
        }],
        ["OS=='mac'", {
          "sources": ["src/clipboard_mac.mm"],
          "link_settings": {
            "libraries": [
              "-framework Foundation",
              "-framework AppKit"
            ]
          }
        }]
      ]
    }
  ]
}
```

This configuration means:

- always compile `addon.cpp`
- compile `clipboard.cpp` on Windows
- compile `clipboard_mac.mm` on macOS
- link `Foundation` and `AppKit` on macOS for `NSPasteboard`

## Build process

The addon is built from `src/clipboard-addon/`.

```bash
cd src/clipboard-addon
npm install
```

The package install script runs:

```json
"install": "node scripts/rebuild.js"
```

`scripts/rebuild.js` resolves `node-gyp` either from the shell PATH or from the copy bundled inside npm, then runs `node-gyp rebuild`.

`node-gyp rebuild`:

1. reads `binding.gyp`
2. generates platform-specific build files
3. compiles and links the native target
4. writes the output to `build/Release/clipboard.node`

That binary is loaded by the main process with:

```js
require('../clipboard-addon/build/Release/clipboard')
```

The output format depends on the platform:

- Windows builds a PE/COFF binary
- macOS builds a Mach-O binary

The generated file must be rebuilt on each platform. A Windows-built `clipboard.node` cannot be loaded on macOS, and a macOS-built `clipboard.node` cannot be loaded on Windows.

## Current scope

Implemented today:

- native clipboard text reads on Windows
- native clipboard text reads on macOS
- JS-driven clipboard change detection through `clipboard-event`
- Electron clipboard writes for re-copying text

Not implemented yet:

- native clipboard change listeners inside the addon
- clipboard format enumeration
- image, file, and rich-text clipboard support
- Linux native backend

## Target direction

The long-term structure is a platform-agnostic clipboard service with per-platform native backends:

```text
clipboard-service
   |
   +-- windows
   +-- macos
   +-- linux
```

That would keep the main-process and renderer logic stable while moving platform-specific clipboard behavior behind a dedicated service boundary.
