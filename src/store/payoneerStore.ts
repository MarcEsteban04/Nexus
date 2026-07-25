import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PayoneerState {
  marginPercent: number;
  midMarketRate: number | null;
  updatedAt: string | null;
  loading: boolean;
  error: string | null;
  setMarginPercent: (v: number) => void;
  fetchMidMarketRate: () => Promise<void>;
  effectiveRate: () => number | null;
}

export const usePayoneerStore = create<PayoneerState>()(
  persist(
    (set, get) => ({
      marginPercent: 1.5,
      midMarketRate: null,
      updatedAt: null,
      loading: false,
      error: null,

      setMarginPercent: (v) => set({ marginPercent: v }),

      fetchMidMarketRate: async () => {
        set({ loading: true, error: null });
        try {
          const res = await fetch('https://api.frankfurter.dev/v1/latest?amount=1&from=USD&to=PHP');
          if (!res.ok) throw new Error('Request failed');
          const data = await res.json();
          const rate = data?.rates?.PHP;
          if (typeof rate !== 'number') throw new Error('Rate unavailable');
          set({ midMarketRate: rate, updatedAt: new Date().toISOString(), loading: false });
        } catch {
          set({ loading: false, error: 'Could not fetch live USD/PHP rate. You can still enter a rate manually.' });
        }
      },

      effectiveRate: () => {
        const { midMarketRate, marginPercent } = get();
        return midMarketRate != null ? midMarketRate * (1 - marginPercent / 100) : null;
      },
    }),
    {
      name: 'nexus:payoneer',
      partialize: (state) => ({ marginPercent: state.marginPercent, midMarketRate: state.midMarketRate, updatedAt: state.updatedAt }),
    },
  ),
);
