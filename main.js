const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { z } = require('zod');
require("./server"); // This line starts the Express server

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 700,
    icon: path.join(__dirname, "icon.png"),
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile("index.html");
  // mainWindow.webContents.openDevTools(); // Opens Developer Tools
}

app.whenReady().then(createWindow);

ipcMain.on("upload-db", async (event) => {
  const { filePaths } = await dialog.showOpenDialog({
    title: "Select DB File",
    properties: ['openFile'],
    filters: [{ name: "JSON Files", extensions: ["json"] }]
  });

  if (!filePaths || filePaths.length === 0) {
    return event.reply('upload-db-reply', { success: false, message: 'No file selected.' });
  }

  const filePath = filePaths[0];
  const dbFilePath = path.join(__dirname, "db.json");

  try {
    const fileData = fs.readFileSync(filePath, "utf8");

    // Validate the file data using Zod
    const data = JSON.parse(fileData);
    const schema = z.object({
      name: z.string(),
      obj: z.any(),
      status: z.string(),
      delay: z.string(),
    });

    const valid = z.array(schema).safeParse(data);

    if (!valid.success) {
      return event.reply('upload-db-reply', { success: false, message: 'Invalid JSON file.' });
    }

    // Write the validated data to the db.json file
    fs.writeFileSync(dbFilePath, JSON.stringify(valid.data, null, 2), "utf8");

    console.log("DB content replaced with:", valid.data);
    event.reply('upload-db-reply', { success: true, message: 'DB uploaded and updated successfully!' });
  } catch (error) {
    console.error("Error processing file:", error);
    event.reply('upload-db-reply', { success: false, message: 'An error occurred while processing the file.' });
  }
});


ipcMain.on("download-db", async () => {
  const dbFilePath = path.join(__dirname, "db.json");
  try {
    const data = fs.readFileSync(dbFilePath, "utf8");

    // Open save dialog
    const { filePath } = await dialog.showSaveDialog({
      title: "Save DB File",
      defaultPath: "db.json",
      filters: [{ name: "JSON Files", extensions: ["json"] }],
    });

    if (filePath) {
      fs.writeFileSync(filePath, data, "utf8");
      return { success: true, message: "DB downloaded successfully!" };
    } else {
      return { success: false, message: "Save operation was cancelled." };
    }
  } catch (error) {
    console.error("Error reading or saving file:", error);
    return { success: false, message: "An error occurred." };
  }
});

ipcMain.on("close-window", () => {
  mainWindow.close();
});

ipcMain.on("minimize-window", () => {
  mainWindow.minimize();
});

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
