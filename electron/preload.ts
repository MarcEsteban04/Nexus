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
  pickApp: () => ipcRenderer.invoke('apps:pick-app'),
  scanInstalledApps: () => ipcRenderer.invoke('apps:scan-installed'),
  launchApps: (paths: string[]) => ipcRenderer.invoke('apps:launch-many', { paths }),
  askAssistantStream: (
    requestId: string,
    messages: { role: 'user' | 'assistant'; content: string }[],
    context: string,
    provider: 'openai' | 'groq',
    tools?: unknown[],
  ) => ipcRenderer.send('assistant:ask-stream', { requestId, messages, context, provider, tools }),
  onAssistantStreamChunk: (cb: (payload: { requestId: string; delta: string }) => void) => {
    const listener = (_: unknown, payload: { requestId: string; delta: string }) => cb(payload);
    ipcRenderer.on('assistant:stream-chunk', listener);
    return () => ipcRenderer.removeListener('assistant:stream-chunk', listener);
  },
  onAssistantStreamDone: (
    cb: (payload: { requestId: string; content: string; toolCalls: { id: string; name: string; arguments: string }[] | null; error: string | null }) => void,
  ) => {
    const listener = (
      _: unknown,
      payload: { requestId: string; content: string; toolCalls: { id: string; name: string; arguments: string }[] | null; error: string | null },
    ) => cb(payload);
    ipcRenderer.on('assistant:stream-done', listener);
    return () => ipcRenderer.removeListener('assistant:stream-done', listener);
  },
});
