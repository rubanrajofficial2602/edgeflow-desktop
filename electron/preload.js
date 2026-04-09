const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getVersion:    ()      => ipcRenderer.invoke("get-app-version"),
  getPlatform:   ()      => ipcRenderer.invoke("get-platform"),
  openExternal:  (url)   => ipcRenderer.invoke("open-external", url),
  isElectron:    true,
});
