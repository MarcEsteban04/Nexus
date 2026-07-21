import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WishlistItem } from '@/types';
import { createId } from '@/utils/id';

interface ShoppingState {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, 'id' | 'createdAt' | 'purchased'>) => void;
  togglePurchased: (id: string) => void;
  removeItem: (id: string) => void;
}

export const useShoppingStore = create<ShoppingState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({
          items: [
            { ...item, id: createId(), createdAt: new Date().toISOString(), purchased: false },
            ...state.items,
          ],
        })),
      togglePurchased: (id) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, purchased: !i.purchased } : i)),
        })),
      removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
    }),
    { name: 'nexus:shopping' },
  ),
);
