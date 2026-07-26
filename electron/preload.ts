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
  searchProductPrices: (query: string) => ipcRenderer.invoke('shopping:search-prices', { query }),
  parseImportText: (text: string) => ipcRenderer.invoke('vault:parse-import', { text }),
  scanDesktopGames: () => ipcRenderer.invoke('games:scan-desktop'),
  launchGame: (gameId: string, execPath: string, spawnPath: string | null) =>
    ipcRenderer.invoke('games:launch', { gameId, execPath, spawnPath }),
  onGameSessionEnded: (cb: (payload: { gameId: string; hours: number }) => void) => {
    const listener = (_: unknown, payload: { gameId: string; hours: number }) => cb(payload);
    ipcRenderer.on('games:session-ended', listener);
    return () => ipcRenderer.removeListener('games:session-ended', listener);
  },
  scanReceiptImage: (imageDataUrl: string) => ipcRenderer.invoke('receipts:scan', { imageDataUrl }),
  askAssistant: (messages: { role: 'user' | 'assistant'; content: string }[], context: string) =>
    ipcRenderer.invoke('assistant:ask', { messages, context }),
});
