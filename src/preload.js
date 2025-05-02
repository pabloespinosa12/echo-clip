const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("electron", {
  onClipboardUpdate: (callback) => {
    ipcRenderer.on("clipboard-update", (_, data) => callback(data))
  },
  removeClipboardUpdate: (callback) => {
    ipcRenderer.removeListener("clipboard-update", callback);
  },
  copyText: (text) => ipcRenderer.send("copy-text", text)
});