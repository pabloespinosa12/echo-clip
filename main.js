const clipboardListener = require('clipboard-event');
const clipboard = require('./clipboard-addon/build/Release/clipboard');
const path = require('path')
const { app, BrowserWindow } = require('electron');

let mainWindow;
clipboardListener.startListening();

app.whenReady().then(() => {
  console.log("Waiting for Ctrl + C...");
  clipboardListener.on('change', () => {
    console.log('Clipboard changed');
    const copiedContent = clipboard.getClipboardContent(); // Read content via your C++ addon
    console.log("Copied content:", copiedContent);
  });
  mainWindow = new BrowserWindow({
    width:400, 
    height: 600,
    webPreferences : {
      nodeIntegration: true
    }
  });

  mainWindow.loadURL(`file://${path.join(__dirname, 'frontend', 'build', 'index.html')}`);
});

app.on('will-quit', () => {
    clipboardListener.stopListening();
});

