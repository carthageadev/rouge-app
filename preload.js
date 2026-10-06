const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('rouge', {
  on: (channel, fn) => ipcRenderer.on(channel, (_e, data) => fn(data)),
  send: (channel, data) => ipcRenderer.send(channel, data),
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  pathForFile: file => { try { return webUtils.getPathForFile(file) || ''; } catch { return ''; } },
});
