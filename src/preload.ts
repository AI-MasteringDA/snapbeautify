import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  captureRegion: () =>
    ipcRenderer.invoke('capture-region'),

  captureWindow: () =>
    ipcRenderer.invoke('capture-window'),

  captureScreen: () =>
    ipcRenderer.invoke('capture-screen'),

  saveImage: (dataURL: string) =>
    ipcRenderer.invoke('save-image', dataURL),

  copyToClipboard: (dataURL: string) =>
    ipcRenderer.invoke('copy-to-clipboard', dataURL),

  browseFile: () =>
    ipcRenderer.invoke('browse-file'),

  onScreenshotReady: (cb: (dataURL: string) => void) =>
    ipcRenderer.on('screenshot-ready', (_event, dataURL) => cb(dataURL)),

  removeScreenshotListener: () =>
    ipcRenderer.removeAllListeners('screenshot-ready'),

  minimizeWindow: () =>
    ipcRenderer.send('window-minimize'),

  maximizeWindow: () =>
    ipcRenderer.send('window-maximize'),

  closeWindow: () =>
    ipcRenderer.send('window-close'),

  getVersion: () =>
    ipcRenderer.invoke('get-version'),
});
