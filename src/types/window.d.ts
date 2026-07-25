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
    };
  }
}
