export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  date: string;
  accountId: string | null;
  receiptId: string | null;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  paid: boolean;
  paidTransactionId: string | null;
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

export type IncomeFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'yearly';
export type IncomeCurrency = 'PHP' | 'USD';

export interface RecurringIncome {
  id: string;
  name: string;
  amount: number;
  currency: IncomeCurrency;
  frequency: IncomeFrequency;
  nextDate: string;
  payDay1: number | null;
  payDay2: number | null;
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

export type GameStatus = 'wishlist' | 'installed' | 'playing' | 'completed';

export interface Game {
  id: string;
  title: string;
  platform: string;
  status: GameStatus;
  hoursPlayed: number;
  achievementsUnlocked: number;
  achievementsTotal: number;
  lastPlayed: string;
  notes: string;
  execPath: string | null;
  spawnPath: string | null;
  iconDataUrl: string | null;
  createdAt: string;
}

export interface DetectedShortcut {
  name: string;
  path: string;
  targetPath: string | null;
  spawnPath: string | null;
  icon: string | null;
}

export interface Receipt {
  id: string;
  store: string;
  product: string;
  amount: number;
  category: string;
  purchaseDate: string;
  warrantyExpiry: string;
  notes: string;
  imageDataUrl: string | null;
  transactionId: string | null;
  createdAt: string;
}

export interface ScannedReceipt {
  store: string;
  product: string;
  amount: number | null;
  category: string;
  purchaseDate: string;
}

export type EventRecurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  category: string;
  notes: string;
  recurrence: EventRecurrence;
  reminderMinutes: number | null;
  createdAt: string;
}
