export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  date: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  paid: boolean;
}

export type BillingCycle = 'weekly' | 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: BillingCycle;
  category: string;
  nextBillingDate: string;
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  minPayment: number;
  dueDay: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

export type IncomeFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface RecurringIncome {
  id: string;
  name: string;
  amount: number;
  frequency: IncomeFrequency;
  nextDate: string;
}

export type AccountType = 'bank' | 'ewallet' | 'cash' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution: string;
  balance: number;
  createdAt: string;
}

export interface ProductSearchResult {
  title: string;
  link: string;
  source: string;
  price: number | null;
  priceDisplay: string | null;
  rating: number | null;
  reviews: number | null;
  thumbnail: string | null;
}

export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type ExtractedCredential = Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt'>;

export interface WishlistItem {
  id: string;
  name: string;
  url?: string;
  price?: number;
  store?: string;
  note?: string;
  purchased: boolean;
  createdAt: string;
}
