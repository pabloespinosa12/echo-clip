# Echo-Clip

A lightweight clipboard history manager for Windows. Echo-Clip runs in the background, remembers text you copy, and lets you search and paste from past entries with a global shortcut.

> **Status:** Early development — text-only clipboard history on Windows. Uses a native C++ addon for OS-level clipboard access (see [why](docs/native-clipboard.md)). See [Roadmap](docs/roadmap.md) for what's coming next.

## Features

- **Clipboard history** — Automatically saves copied text while the app is running
- **Quick access** — Press `Alt+V` to open the history window
- **Search** — Filter entries by keyword
- **Re-copy** — Click any entry to copy it back to your clipboard
- **Background mode** — Stays running hidden until you need it

## Requirements

- Windows 10 or later
- Node.js 18+ (for building from source)

## Download

Pre-built installers will be available on [GitHub Releases](https://github.com/pabloespinosa12/echo-clip/releases) once releases are published.

## Usage

1. Launch Echo-Clip — it starts in the background.
2. Copy text as usual — entries are added to your history.
3. Press **Alt+V** to open the history window.
4. Search or scroll to find an entry, then click it to copy.
5. Press **Alt+V** again (or click close) to hide the window.

> History is kept in memory for the current session only. It does not survive app restarts yet.

## Building from source

```bash
# 1. Build the native addon (requires Visual Studio Build Tools)
cd src/clipboard-addon && npm install

# 2. Install dependencies
cd ../ && npm install
cd ../clipboard-react-app && npm install

# 3. Run in development (use two terminals)
# Terminal 1:
cd clipboard-react-app && npm run dev

# Terminal 2:
cd src && npm run dev
```

For a production build:

```bash
cd clipboard-react-app && npm run build
cd ../src && npm run build
```

See [Development guide](docs/development.md) for full setup details.

## Roadmap

Planned features include pin/delete entries, persistent storage, keyboard navigation, configurable shortcuts, a settings page, system tray support, and cross-platform support (Linux/macOS via a platform-abstracted native clipboard layer).

See the full [roadmap](docs/roadmap.md).

## Contributing

Contributions are welcome. For architecture and development details, see the [docs](docs/) folder. If you use Cursor, also read [AGENTS.md](AGENTS.md).

## License

MIT
