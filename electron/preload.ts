import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('nexus', {
  platform: process.platform,
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleMaximize: () => ipcRenderer.send('window:toggle-maximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  onMaximizedChange: (cb: (maximized: boolean) => void) => {
    const listener = (_: unknown, maximized: boolean) => cb(maximized);
    ipcRenderer.on('window:maximized', listener);
    return () => ipcRenderer.removeListener('window:maximized', listener);
  },
});
