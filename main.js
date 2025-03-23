const clipboardListener = require('clipboard-event');
const clipboardAddOn = require('./clipboard-addon/build/Release/clipboard');
const path = require('path')
const { app, BrowserWindow, clipboard, ipcMain} = require('electron');

let mainWindow;
clipboardListener.startListening();

app.whenReady().then(() => {
  console.log("Waiting for Ctrl + C...");
  mainWindow = new BrowserWindow({
    width:330, 
    height: 445,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  mainWindow.setMenu(null);

  mainWindow.webContents.openDevTools();

  let lastCopiedText = ""; // Store the last copied text
  let isCopiedFromClipboard = false // True if the text was copied by clicking on the clipboard

  // TODO extract in a controller
  clipboardListener.on('change', () => {
    if (isCopiedFromClipboard) {
      console.log("Skipping clipboard update");
      isCopiedFromClipboard = false; // Reset flag after skipping
      return;
    }

    console.log('Clipboard changed');
    const copiedContent = clipboardAddOn.getClipboardContent(); // Read content via your C++ addon
    console.log("Copied content:", copiedContent);

    if(!copiedContent || !copiedContent.trim()){
      console.warn("Empty clipboard entry ignored")
      return;
    }

    // Avoid re-adding if it's the same text as the last copied one
    if (copiedContent == lastCopiedText) {
      console.log("Duplicate clipboard entry ignored:", copiedContent);
      return;
    }
    lastCopiedText = copiedContent;

    mainWindow.webContents.send("clipboard-update", copiedContent)
  });

  ipcMain.on("copy-text", (event, text) => {
    isCopiedFromClipboard = true; 
    clipboard.writeText(text);
  });

  // dev mode
  mainWindow.loadURL("http://localhost:5173"); // Load the React app in development mode
  // prod mode
  // mainWindow.loadFile(path.join(__dirname, 'clipboard-react-app', 'dist', 'index.html'));
});

app.on('will-quit', () => {
    clipboardListener.stopListening();
});

