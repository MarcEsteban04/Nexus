import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Receipt } from '@/types';
import { createId } from '@/utils/id';
import { fileStorage } from '@/utils/fileStorage';

interface ReceiptState {
  receipts: Receipt[];
  addReceipt: (r: Omit<Receipt, 'id' | 'createdAt'>) => string;
  removeReceipt: (id: string) => void;
  linkTransaction: (receiptId: string, transactionId: string) => void;
}

export const useReceiptStore = create<ReceiptState>()(
  persist(
    (set) => ({
      receipts: [],
      addReceipt: (r) => {
        const id = createId();
        set((state) => ({ receipts: [{ ...r, id, createdAt: new Date().toISOString() }, ...state.receipts] }));
        return id;
      },
      removeReceipt: (id) => set((state) => ({ receipts: state.receipts.filter((r) => r.id !== id) })),
      linkTransaction: (receiptId, transactionId) =>
        set((state) => ({
          receipts: state.receipts.map((r) => (r.id === receiptId ? { ...r, transactionId } : r)),
        })),
    }),
    { name: 'nexus:receipts', storage: createJSONStorage(() => fileStorage) },
  ),
);
