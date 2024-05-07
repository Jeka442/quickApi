const { app, BrowserWindow } = require("electron");
const path = require("path");
require("./server"); // This line starts the Express server

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 700,
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webviewTag: true,
    },
  });

  win.loadFile("index.html");
  //win.webContents.openDevTools(); // Opens Developer Tools
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
