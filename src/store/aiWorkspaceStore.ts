import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AiBookmark, Prompt, Snippet } from '@/types';
import { createId } from '@/utils/id';

interface AiWorkspaceState {
  prompts: Prompt[];
  snippets: Snippet[];
  bookmarks: AiBookmark[];

  addPrompt: (p: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'favorite'>) => void;
  updatePrompt: (id: string, patch: Partial<Omit<Prompt, 'id' | 'createdAt'>>) => void;
  toggleFavoritePrompt: (id: string) => void;
  removePrompt: (id: string) => void;

  addSnippet: (s: Omit<Snippet, 'id' | 'createdAt'>) => void;
  removeSnippet: (id: string) => void;

  addBookmark: (b: Omit<AiBookmark, 'id' | 'createdAt'>) => void;
  removeBookmark: (id: string) => void;
}

export const useAiWorkspaceStore = create<AiWorkspaceState>()(
  persist(
    (set) => ({
      prompts: [],
      snippets: [],
      bookmarks: [],

      addPrompt: (p) =>
        set((state) => {
          const now = new Date().toISOString();
          return { prompts: [...state.prompts, { ...p, id: createId(), favorite: false, createdAt: now, updatedAt: now }] };
        }),
      updatePrompt: (id, patch) =>
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
          ),
        })),
      toggleFavoritePrompt: (id) =>
        set((state) => ({ prompts: state.prompts.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)) })),
      removePrompt: (id) => set((state) => ({ prompts: state.prompts.filter((p) => p.id !== id) })),

      addSnippet: (s) =>
        set((state) => ({ snippets: [...state.snippets, { ...s, id: createId(), createdAt: new Date().toISOString() }] })),
      removeSnippet: (id) => set((state) => ({ snippets: state.snippets.filter((s) => s.id !== id) })),

      addBookmark: (b) =>
        set((state) => ({ bookmarks: [...state.bookmarks, { ...b, id: createId(), createdAt: new Date().toISOString() }] })),
      removeBookmark: (id) => set((state) => ({ bookmarks: state.bookmarks.filter((b) => b.id !== id) })),
    }),
    { name: 'nexus:ai-workspace' },
  ),
);
