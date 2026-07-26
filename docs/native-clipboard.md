# Why native clipboard access?

Echo-Clip uses a C++ addon with the Windows API instead of relying on Electron's built-in clipboard API. This was one of the more interesting engineering decisions in the project — it turned a simple Electron app into a real OS integration project.

## Short version

Electron's `clipboard.readText()` is not broken. It works well for normal copy/paste in typical apps. But it is a high-level wrapper around Chromium's clipboard implementation and does not expose the low-level Windows clipboard features that a clipboard history manager needs.

For Echo-Clip, we needed native Windows clipboard access, so we added a C++ addon using the Windows API.

---

## What Electron gives you

```js
const { clipboard } = require('electron');

const text = clipboard.readText();
```

This internally uses Chromium's clipboard implementation. It supports:

```js
clipboard.readText();
clipboard.writeText("hello");
clipboard.readImage();
clipboard.readHTML();
```

**Good for:**

- Copy/paste functionality
- Simple utilities
- Reading the current clipboard content on demand

**Not enough for Echo-Clip.**

---

## Problem 1: Clipboard history requires listening to changes

A clipboard manager needs to react every time the user copies something:

```
User copies text
        |
        v
Windows clipboard changes
        |
        v
Echo-Clip receives event
        |
        v
Store item in history
```

### What Windows provides

Windows has a native clipboard notification system:

- `AddClipboardFormatListener(hwnd)` — register for updates
- `WM_CLIPBOARDUPDATE` — sent whenever the clipboard changes

This is **event-driven**: the OS notifies you immediately when something changes.

### What Electron provides

Electron does **not** expose `AddClipboardFormatListener` or `WM_CLIPBOARDUPDATE` directly.

The fallback with Electron's API is polling:

```js
setInterval(() => {
  clipboard.readText();
}, 500);
```

```
10:00:00.0  check clipboard -> "hello"
10:00:00.5  check clipboard -> "hello"
10:00:01.0  check clipboard -> "hello"
10:00:01.5  check clipboard -> "password123"
```

Problems with polling:

- Inefficient
- Delayed detection (up to the poll interval)
- Unnecessary CPU usage
- Misses some clipboard types
- Feels hacky

A native listener is event-driven and immediate.

### Current implementation

Today, Echo-Clip uses the `clipboard-event` npm package for change detection (which wraps native OS notifications on Windows) combined with the C++ addon for reading content. The C++ layer does not yet implement `AddClipboardFormatListener` directly — that is a natural next step as the native layer matures.

---

## Problem 2: Accessing clipboard formats

The Windows clipboard is not text-only. Data is stored in multiple formats:

| Format | Example |
|--------|---------|
| `CF_TEXT` | Plain ANSI text |
| `CF_UNICODETEXT` | Unicode text |
| `CF_BITMAP` | Image data |
| `CF_HDROP` | File paths |
| HTML Format | Rich HTML content |
| Custom formats | App-specific data |

### Example: copying a file from Explorer

The clipboard contains:

```
CF_HDROP
  C:\Users\Pablo\Desktop\test.pdf
```

But:

```js
clipboard.readText()
// returns ""
```

because it is not text.

A clipboard manager needs to know: **is this text, an image, a file, rich text, or a URL?**

### What the Windows API provides

```cpp
UINT format = 0;
while ((format = EnumClipboardFormats(format)) != 0) {
    // inspect each format on the clipboard
}
```

Electron does not expose `EnumClipboardFormats()` or equivalent format inspection.

### Current implementation

The C++ addon currently reads **`CF_TEXT` only**. Format enumeration and multi-type support are planned — this is exactly why the native addon exists.

---

## Problem 3: Clipboard ownership and timing

Windows clipboard ownership is tricky. When an app copies content:

```
Chrome copies text
       |
       v
Chrome writes to clipboard
       |
       v
Echo-Clip immediately reads
```

Sometimes the clipboard is still owned by the source application. Native code can handle this with more control:

```cpp
OpenClipboard(hwnd);
GetClipboardData(format);
CloseClipboard();
```

Electron's high-level API abstracts this away, which is fine for one-off reads but limits control for a manager that reads on every change.

---

## Why the C++ addon was the right solution

The architecture became:

```
                React UI
                   |
             Electron IPC
                   |
          Node.js main process
                   |
          C++ native addon
                   |
       Windows Clipboard API
```

The C++ addon is responsible for (now and in the future):

- Listening for clipboard changes (via `clipboard-event` today; native listener later)
- Reading clipboard formats (`CF_TEXT` today; full enumeration later)
- Extracting native clipboard data
- Sending events back to Electron

Conceptually:

```cpp
void onClipboardUpdate() {
    std::string content = readClipboard();
    sendToNode(content);
}
```

Then the main process receives the update and stores it:

```js
// Future shape once format support is added
clipboardAddon.onChange((item) => {
  history.add(item);  // { type, content, formats, ... }
});
```

**Writing** to the clipboard still uses Electron's `clipboard.writeText()` in `main.js` — that part of the Electron API is sufficient for re-copying text from history.

---

## Implications for Linux and macOS

The Windows implementation at `src/clipboard-addon/src/clipboard.cpp` cannot run everywhere. Cross-platform support requires separate native implementations behind a shared interface.

### Target architecture

```
clipboard-service (JS interface)
        |
 -------------------------
 |           |           |
Windows     macOS       Linux
C++         ObjC++      C++
Win API     NSPaste     X11 / Wayland
```

Electron and React only talk to the service:

```js
clipboardService.onClipboardChange((item) => {
  history.add(item);
});
```

This keeps the UI and main-process logic platform-independent.

### Platform notes

**Windows** — Windows Clipboard API (`OpenClipboard`, `EnumClipboardFormats`, `AddClipboardFormatListener`). Current implementation lives in `src/clipboard-addon/`.

**macOS** — `NSPasteboard` via Objective-C++, Swift bridge, or a Node native addon:

```objc
NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];
```

**Linux** — More complicated due to multiple clipboard systems:

| Display server | Mechanism |
|----------------|-----------|
| X11 | XFixes extension |
| Wayland | wlroots / Wayland protocols |

Clipboard persistence and behavior also differ across Linux desktop environments.

### Suggested future directory layout

```
src/native/
├── clipboard-service.js      # Platform-agnostic JS interface
├── windows/
│   └── clipboard.cpp
├── macos/
│   └── clipboard.mm
└── linux/
    └── clipboard.cpp         # X11 / Wayland abstraction inside
```

Today everything lives in `src/clipboard-addon/` as a Windows-only MVP. Refactor to this layout when adding a second platform.

---

## Summary

| Need | Electron API | Native Windows API |
|------|-------------|-------------------|
| Read current text | Yes | Yes |
| Listen for changes | No (poll only) | Yes (`WM_CLIPBOARDUPDATE`) |
| Enumerate formats | No | Yes (`EnumClipboardFormats`) |
| Read files/images | Limited / empty | Yes (`CF_HDROP`, `CF_BITMAP`) |
| Control read timing | No | Yes (`OpenClipboard` / ownership) |

Echo-Clip chose native access not because Electron is broken, but because a clipboard history manager is an OS integration problem — and that requires operating at the OS level.
