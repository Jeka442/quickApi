const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  downloadDB: () => ipcRenderer.send('download-db'),
  uploadDB: () => ipcRenderer.send('upload-db'), // Added for upload
  onUploadDBReply: (callback) => ipcRenderer.on('upload-db-reply', callback) // For handling reply
});
