const clipboardListener = require('clipboard-event');
const clipboard = require('./clipboard-addon/build/Release/clipboard');
const path = require('path')
const { app, BrowserWindow } = require('electron');

let mainWindow;
clipboardListener.startListening();

app.whenReady().then(() => {
  console.log("Waiting for Ctrl + C...");
  
  mainWindow = new BrowserWindow({
    width:400, 
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  mainWindow.webContents.openDevTools();


  // TODO extract in a controller
  clipboardListener.on('change', () => {
    console.log('Clipboard changed');
    const copiedContent = clipboard.getClipboardContent(); // Read content via your C++ addon
    mainWindow.webContents.send("clipboard-update", copiedContent)
    console.log("Copied content:", copiedContent);
  });
  // dev mode
  mainWindow.loadURL("http://localhost:5173"); // Load the React app in development mode
  // prod mode
  // mainWindow.loadFile(path.join(__dirname, 'clipboard-react-app', 'dist', 'index.html'));
});

app.on('will-quit', () => {
    clipboardListener.stopListening();
});

