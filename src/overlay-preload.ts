import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('overlayAPI', {
  confirmRegion: (bounds: { x: number; y: number; w: number; h: number }) =>
    ipcRenderer.invoke('overlay-region-selected', bounds),

  cancelCapture: () =>
    ipcRenderer.invoke('overlay-cancel'),

  getScreenshot: () =>
    ipcRenderer.invoke('overlay-get-screenshot'),
});
