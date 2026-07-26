import { DetectedShortcut, ExtractedCredential, ProductSearchResult, ScannedReceipt } from '@/types';

export {};

declare global {
  interface Window {
    nexus?: {
      platform: string;
      minimize: () => void;
      toggleMaximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      onMaximizedChange: (cb: (maximized: boolean) => void) => () => void;
      searchProductPrices: (query: string) => Promise<{ results: ProductSearchResult[]; error: string | null }>;
      parseImportText: (text: string) => Promise<{ results: ExtractedCredential[]; error: string | null }>;
      scanDesktopGames: () => Promise<{ results: DetectedShortcut[]; error: string | null }>;
      launchGame: (
        gameId: string,
        execPath: string,
        spawnPath: string | null,
      ) => Promise<{ error: string | null; tracked: boolean }>;
      onGameSessionEnded: (cb: (payload: { gameId: string; hours: number }) => void) => () => void;
      scanReceiptImage: (imageDataUrl: string) => Promise<{ result: ScannedReceipt | null; error: string | null }>;
      pickApp: () => Promise<{ path: string; name: string; icon: string | null } | null>;
      scanInstalledApps: () => Promise<{ results: { name: string; path: string; icon: string | null }[]; error: string | null }>;
      launchApps: (paths: string[]) => Promise<{ errors: string[] }>;
      askAssistantStream: (
        requestId: string,
        messages: { role: 'user' | 'assistant'; content: string }[],
        context: string,
        provider: 'openai' | 'groq',
        tools?: unknown[],
      ) => void;
      onAssistantStreamChunk: (cb: (payload: { requestId: string; delta: string }) => void) => () => void;
      onAssistantStreamDone: (
        cb: (payload: {
          requestId: string;
          content: string;
          toolCalls: { id: string; name: string; arguments: string }[] | null;
          error: string | null;
        }) => void,
      ) => () => void;
    };
  }
}
