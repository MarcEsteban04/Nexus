import { ExtractedCredential, ProductSearchResult } from '@/types';

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
    };
  }
}
