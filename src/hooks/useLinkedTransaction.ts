import { useMoneyStore } from '@/store/moneyStore';
import { useReceiptStore } from '@/store/receiptStore';

interface LinkedTransactionInput {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  date: string;
  accountId: string;
  receiptImage?: string | null;
}

export function useLinkedTransaction() {
  const addTransaction = useMoneyStore((s) => s.addTransaction);
  const linkReceipt = useMoneyStore((s) => s.linkReceipt);
  const addReceipt = useReceiptStore((s) => s.addReceipt);

  return function createLinkedTransaction(input: LinkedTransactionInput): string {
    const txId = addTransaction({
      type: input.type,
      amount: input.amount,
      category: input.category,
      note: input.note,
      date: input.date,
      accountId: input.accountId,
      receiptId: null,
    });

    if (input.receiptImage) {
      const receiptId = addReceipt({
        store: input.category,
        product: input.note || input.category,
        amount: input.amount,
        category: input.category,
        purchaseDate: input.date,
        warrantyExpiry: '',
        notes: '',
        imageDataUrl: input.receiptImage,
        transactionId: txId,
      });
      linkReceipt(txId, receiptId);
    }

    return txId;
  };
}
