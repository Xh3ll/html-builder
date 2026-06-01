const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron:   true,

  // Project save/load
  saveProject:  (name)            => ipcRenderer.invoke('dialog:saveProject', name),
  openProject:  ()                => ipcRenderer.invoke('dialog:openProject'),
  writeFile:    (path, content)   => ipcRenderer.invoke('fs:writeFile', path, content),
  readFile:     (path)            => ipcRenderer.invoke('fs:readFile', path),
  getDataPath:  ()                => ipcRenderer.invoke('app:getDataPath'),
  getVersion:   ()                => ipcRenderer.invoke('app:getVersion'),
  showQuestion: (title, msg, btns) => ipcRenderer.invoke('dialog:question', title, msg, btns),

  // Auto-updater
  onUpdateAvailable: (cb) => ipcRenderer.on('update:available', (_e, info) => cb(info)),
  onUpdateProgress:  (cb) => ipcRenderer.on('update:progress',  (_e, data) => cb(data)),
  onUpdateReady:     (cb) => ipcRenderer.on('update:ready',     () => cb()),
  downloadUpdate:    ()   => ipcRenderer.invoke('update:download'),
  installUpdate:     ()   => ipcRenderer.invoke('update:install'),
});
