const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'HTML Builder',
    backgroundColor: '#0b0b14',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile('index.html');
  Menu.setApplicationMenu(null);

  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.webContents.on('did-finish-load', () => {
    autoUpdater.checkForUpdates().catch(() => {});
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { app.quit(); });

// ─── AUTO-UPDATER ────────────────────────────────────────────────────────────

autoUpdater.autoDownload = false;

autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update:available', { version: info.version });
});

autoUpdater.on('download-progress', (progress) => {
  mainWindow?.webContents.send('update:progress', { percent: Math.round(progress.percent) });
});

autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('update:ready');
});

ipcMain.handle('update:download', () => autoUpdater.downloadUpdate());
ipcMain.handle('update:install',  () => autoUpdater.quitAndInstall());

// ─── PROJECT: FILE SYSTEM ────────────────────────────────────────────────────

ipcMain.handle('dialog:saveProject', async (_e, defaultName) =>
  dialog.showSaveDialog(mainWindow, {
    title: 'Projekt speichern',
    defaultPath: defaultName || 'projekt.htmlbuilder',
    filters: [{ name: 'HTML Builder Projekt', extensions: ['htmlbuilder'] }],
  })
);

ipcMain.handle('dialog:openProject', async () =>
  dialog.showOpenDialog(mainWindow, {
    title: 'Projekt öffnen',
    properties: ['openFile'],
    filters: [{ name: 'HTML Builder Projekt', extensions: ['htmlbuilder'] }],
  })
);

ipcMain.handle('fs:writeFile', async (_e, filePath, content) => {
  const fs = require('fs').promises;
  await fs.mkdir(require('path').dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
  return { success: true };
});

ipcMain.handle('fs:readFile', async (_e, filePath) => ({
  content: await require('fs').promises.readFile(filePath, 'utf8'),
}));

ipcMain.handle('app:getDataPath',  () => app.getPath('userData'));
ipcMain.handle('app:getVersion',   () => app.getVersion());

ipcMain.handle('dialog:question', async (_e, title, message, buttons) => {
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'question', title, message, buttons, defaultId: 0, cancelId: 1,
  });
  return response;
});
