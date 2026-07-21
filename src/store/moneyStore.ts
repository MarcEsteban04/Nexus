import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account, Bill, Debt, RecurringIncome, SavingsGoal, Subscription, Transaction } from '@/types';
import { createId } from '@/utils/id';

interface MoneyState {
  transactions: Transaction[];
  bills: Bill[];
  subscriptions: Subscription[];
  debts: Debt[];
  savingsGoals: SavingsGoal[];
  recurringIncomes: RecurringIncome[];
  accounts: Account[];

  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;

  addBill: (b: Omit<Bill, 'id' | 'paid'>) => void;
  toggleBillPaid: (id: string) => void;
  removeBill: (id: string) => void;

  addSubscription: (s: Omit<Subscription, 'id'>) => void;
  removeSubscription: (id: string) => void;

  addDebt: (d: Omit<Debt, 'id'>) => void;
  makeDebtPayment: (id: string, amount: number) => void;
  removeDebt: (id: string) => void;

  addSavingsGoal: (g: Omit<SavingsGoal, 'id' | 'currentAmount'>) => void;
  contributeToSavingsGoal: (id: string, amount: number) => void;
  removeSavingsGoal: (id: string) => void;

  addRecurringIncome: (i: Omit<RecurringIncome, 'id'>) => void;
  removeRecurringIncome: (id: string) => void;

  addAccount: (a: Omit<Account, 'id' | 'createdAt'>) => void;
  adjustAccountBalance: (id: string, delta: number) => void;
  removeAccount: (id: string) => void;
}

export const useMoneyStore = create<MoneyState>()(
  persist(
    (set) => ({
      transactions: [],
      bills: [],
      subscriptions: [],
      debts: [],
      savingsGoals: [],
      recurringIncomes: [],
      accounts: [],

      addTransaction: (t) =>
        set((state) => ({ transactions: [{ ...t, id: createId() }, ...state.transactions] })),
      removeTransaction: (id) =>
        set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) })),

      addBill: (b) =>
        set((state) => ({ bills: [...state.bills, { ...b, id: createId(), paid: false }] })),
      toggleBillPaid: (id) =>
        set((state) => ({
          bills: state.bills.map((b) => (b.id === id ? { ...b, paid: !b.paid } : b)),
        })),
      removeBill: (id) => set((state) => ({ bills: state.bills.filter((b) => b.id !== id) })),

      addSubscription: (s) =>
        set((state) => ({ subscriptions: [...state.subscriptions, { ...s, id: createId() }] })),
      removeSubscription: (id) =>
        set((state) => ({ subscriptions: state.subscriptions.filter((s) => s.id !== id) })),

      addDebt: (d) => set((state) => ({ debts: [...state.debts, { ...d, id: createId() }] })),
      makeDebtPayment: (id, amount) =>
        set((state) => ({
          debts: state.debts.map((d) =>
            d.id === id ? { ...d, remainingAmount: Math.max(0, d.remainingAmount - amount) } : d,
          ),
        })),
      removeDebt: (id) => set((state) => ({ debts: state.debts.filter((d) => d.id !== id) })),

      addSavingsGoal: (g) =>
        set((state) => ({ savingsGoals: [...state.savingsGoals, { ...g, id: createId(), currentAmount: 0 }] })),
      contributeToSavingsGoal: (id, amount) =>
        set((state) => ({
          savingsGoals: state.savingsGoals.map((g) =>
            g.id === id ? { ...g, currentAmount: Math.max(0, g.currentAmount + amount) } : g,
          ),
        })),
      removeSavingsGoal: (id) =>
        set((state) => ({ savingsGoals: state.savingsGoals.filter((g) => g.id !== id) })),

      addRecurringIncome: (i) =>
        set((state) => ({ recurringIncomes: [...state.recurringIncomes, { ...i, id: createId() }] })),
      removeRecurringIncome: (id) =>
        set((state) => ({ recurringIncomes: state.recurringIncomes.filter((i) => i.id !== id) })),

      addAccount: (a) =>
        set((state) => ({
          accounts: [...state.accounts, { ...a, id: createId(), createdAt: new Date().toISOString() }],
        })),
      adjustAccountBalance: (id, delta) =>
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === id ? { ...a, balance: a.balance + delta } : a)),
        })),
      removeAccount: (id) => set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) })),
    }),
    { name: 'nexus:money' },
  ),
);
