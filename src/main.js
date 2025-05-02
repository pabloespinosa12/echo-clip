const clipboardController = require("./controllers/clipboardController")
const path = require("path")
const { app, BrowserWindow, clipboard, ipcMain, globalShortcut } = require("electron");

let mainWindow;

app.whenReady().then(() => {
  console.log("Waiting for Ctrl + C...");
  mainWindow = new BrowserWindow({
    width:330, 
    height: 445,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Register the Alt+V shortcut to show the window
  globalShortcut.register('Alt+V', () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show());

  mainWindow.setMenu(null);

  // mainWindow.webContents.openDevTools();

  // set up clipboardController
  clipboardController.setClipboardUpdateCallback((copiedText) => {
    mainWindow.webContents.send("clipboard-update", copiedText);
  });

  clipboardController.startListening();

  ipcMain.on("copy-text", (event, text) => {
    clipboardController.skipClipboardChange(); // Tell controller to ignore next update
    clipboard.writeText(text);
    // Hide the window once the text is copied to the system clipboard
    mainWindow.hide();
  });

  // dev mode
  // mainWindow.loadURL("http://localhost:5173"); // Load the React app in development mode
  // prod mode
  mainWindow.loadFile(path.join(__dirname, '../clipboard-react-app', 'dist', 'index.html'));

  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow.hide(); // Hide instead of closing
  });

  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath("exe"),
  });
});

app.on('will-quit', () => {
    clipboardListener.stopListening();
});

