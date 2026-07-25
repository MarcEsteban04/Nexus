import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Game } from '@/types';
import { createId } from '@/utils/id';

interface GamingState {
  games: Game[];

  addGames: (list: Omit<Game, 'id' | 'createdAt'>[]) => void;
  updateGame: (id: string, patch: Partial<Omit<Game, 'id' | 'createdAt'>>) => void;
  logPlaytime: (id: string, hours: number) => void;
  removeGame: (id: string) => void;
}

export const useGamingStore = create<GamingState>()(
  persist(
    (set) => ({
      games: [],

      addGames: (list) =>
        set((state) => {
          const now = new Date().toISOString();
          return { games: [...state.games, ...list.map((g) => ({ ...g, id: createId(), createdAt: now }))] };
        }),
      updateGame: (id, patch) =>
        set((state) => ({ games: state.games.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      logPlaytime: (id, hours) =>
        set((state) => ({
          games: state.games.map((g) =>
            g.id === id
              ? { ...g, hoursPlayed: g.hoursPlayed + hours, lastPlayed: new Date().toISOString() }
              : g,
          ),
        })),
      removeGame: (id) => set((state) => ({ games: state.games.filter((g) => g.id !== id) })),
    }),
    { name: 'nexus:gaming' },
  ),
);
