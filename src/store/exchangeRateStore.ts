import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const CURRENCIES = ['PHP', 'USD', 'EUR', 'JPY', 'GBP', 'AUD', 'CAD', 'SGD', 'KRW', 'CNY'] as const;
export type Currency = (typeof CURRENCIES)[number];

interface ExchangeRateState {
  base: Currency;
  quote: Currency;
  rate: number | null;
  updatedAt: string | null;
  isManual: boolean;
  loading: boolean;
  error: string | null;
  setBase: (c: Currency) => void;
  setQuote: (c: Currency) => void;
  swap: () => void;
  setManualRate: (rate: number) => void;
  fetchRate: () => Promise<void>;
}

export const useExchangeRateStore = create<ExchangeRateState>()(
  persist(
    (set, get) => ({
      base: 'PHP',
      quote: 'USD',
      rate: null,
      updatedAt: null,
      isManual: false,
      loading: false,
      error: null,

      setBase: (c) => set({ base: c }),
      setQuote: (c) => set({ quote: c }),
      swap: () => set((state) => ({ base: state.quote, quote: state.base })),
      setManualRate: (rate) => set({ rate, isManual: true, updatedAt: new Date().toISOString(), error: null }),

      fetchRate: async () => {
        const { base, quote } = get();
        set({ loading: true, error: null });
        try {
          const res = await fetch(`https://api.frankfurter.dev/v1/latest?amount=1&from=${base}&to=${quote}`);
          if (!res.ok) throw new Error('Request failed');
          const data = await res.json();
          const rate = data?.rates?.[quote];
          if (typeof rate !== 'number') throw new Error('Rate unavailable');
          set({ rate, updatedAt: new Date().toISOString(), isManual: false, loading: false });
        } catch {
          set({ loading: false, error: 'Could not fetch live rate. Check your connection or set one manually.' });
        }
      },
    }),
    { name: 'nexus:exchange-rate', partialize: (state) => ({ base: state.base, quote: state.quote, rate: state.rate, updatedAt: state.updatedAt, isManual: state.isManual }) },
  ),
);
