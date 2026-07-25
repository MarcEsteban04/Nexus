import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Receipt } from '@/types';
import { createId } from '@/utils/id';

interface ReceiptState {
  receipts: Receipt[];
  addReceipt: (r: Omit<Receipt, 'id' | 'createdAt'>) => void;
  removeReceipt: (id: string) => void;
}

export const useReceiptStore = create<ReceiptState>()(
  persist(
    (set) => ({
      receipts: [],
      addReceipt: (r) =>
        set((state) => ({ receipts: [{ ...r, id: createId(), createdAt: new Date().toISOString() }, ...state.receipts] })),
      removeReceipt: (id) => set((state) => ({ receipts: state.receipts.filter((r) => r.id !== id) })),
    }),
    { name: 'nexus:receipts' },
  ),
);
