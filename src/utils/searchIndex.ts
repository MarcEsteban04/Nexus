import { useMoneyStore } from '@/store/moneyStore';
import { useCalendarStore } from '@/store/calendarStore';
import { useGamingStore } from '@/store/gamingStore';
import { useReceiptStore } from '@/store/receiptStore';
import { useShoppingStore } from '@/store/shoppingStore';
import { useVaultStore } from '@/store/vaultStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { formatCurrency } from '@/utils/money';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  group: string;
  path: string;
}

/**
 * Builds a search index from Nexus's own stored data — never the filesystem.
 * Password Vault entries are only included (title/username, never the password
 * itself) while the vault is unlocked for the current session.
 */
export function buildDataSearchIndex(): SearchResult[] {
  const results: SearchResult[] = [];
  const money = useMoneyStore.getState();
  const calendar = useCalendarStore.getState();
  const gaming = useGamingStore.getState();
  const receipts = useReceiptStore.getState();
  const shopping = useShoppingStore.getState();
  const vault = useVaultStore.getState();
  const workspace = useWorkspaceStore.getState();

  for (const a of money.accounts) {
    results.push({ id: `account-${a.id}`, title: a.name, subtitle: `Account · ${formatCurrency(a.balance)}`, group: 'Money', path: '/money/accounts' });
  }
  for (const t of money.transactions) {
    results.push({
      id: `tx-${t.id}`,
      title: t.category || 'Transaction',
      subtitle: `${t.date} · ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}${t.note ? ` — ${t.note}` : ''}`,
      group: 'Money',
      path: '/money/transactions',
    });
  }
  for (const b of money.bills) {
    results.push({ id: `bill-${b.id}`, title: b.name, subtitle: `Bill · ${formatCurrency(b.amount)} · ${b.paid ? 'paid' : 'unpaid'}`, group: 'Money', path: '/money/bills' });
  }
  for (const s of money.subscriptions) {
    results.push({ id: `sub-${s.id}`, title: s.name, subtitle: `Subscription · ${formatCurrency(s.amount)}/${s.cycle}`, group: 'Money', path: '/money/subscriptions' });
  }
  for (const d of money.debts) {
    results.push({ id: `debt-${d.id}`, title: d.name, subtitle: `Debt · ${formatCurrency(d.remainingAmount)} remaining`, group: 'Money', path: '/money/debt' });
  }
  for (const g of money.savingsGoals) {
    results.push({ id: `goal-${g.id}`, title: g.name, subtitle: `Savings goal · ${formatCurrency(g.currentAmount)}/${formatCurrency(g.targetAmount)}`, group: 'Money', path: '/money/savings' });
  }
  for (const i of money.recurringIncomes) {
    results.push({
      id: `income-${i.id}`,
      title: i.name,
      subtitle: `Recurring income · ${i.currency === 'USD' ? '$' : '₱'}${i.amount}/${i.frequency}`,
      group: 'Money',
      path: '/money/income',
    });
  }

  for (const e of calendar.events) {
    results.push({ id: `event-${e.id}`, title: e.title, subtitle: `Calendar · ${e.date}${e.time ? ` ${e.time}` : ''}`, group: 'Calendar', path: '/calendar' });
  }

  for (const g of gaming.games) {
    results.push({ id: `game-${g.id}`, title: g.title, subtitle: `Game · ${g.platform} · ${g.status}`, group: 'Gaming', path: '/gaming' });
  }

  for (const r of receipts.receipts) {
    results.push({ id: `receipt-${r.id}`, title: r.product || r.store, subtitle: `Receipt · ${r.store} · ${formatCurrency(r.amount)}`, group: 'Receipts', path: '/receipts' });
  }

  for (const i of shopping.items) {
    results.push({ id: `wishlist-${i.id}`, title: i.name, subtitle: `Wishlist${i.price != null ? ` · ₱${i.price}` : ''}`, group: 'Shopping', path: '/shopping' });
  }

  if (vault.isUnlocked) {
    for (const v of vault.entries) {
      results.push({ id: `vault-${v.id}`, title: v.title, subtitle: `Password Vault${v.username ? ` · ${v.username}` : ''}`, group: 'Vault', path: '/vault' });
    }
  }

  for (const w of workspace.workspaces) {
    results.push({ id: `workspace-${w.id}`, title: w.name, subtitle: `Workspace · ${w.apps.length} app${w.apps.length === 1 ? '' : 's'}`, group: 'Workspace', path: '/workspace' });
  }

  return results;
}

export const STATIC_PAGES: SearchResult[] = [
  { id: 'page-dashboard', title: 'Dashboard', subtitle: 'Page', group: 'Pages', path: '/' },
  { id: 'page-money-overview', title: 'Money Overview', subtitle: 'Page', group: 'Pages', path: '/money/overview' },
  { id: 'page-accounts', title: 'Accounts', subtitle: 'Page', group: 'Pages', path: '/money/accounts' },
  { id: 'page-transactions', title: 'Transactions', subtitle: 'Page', group: 'Pages', path: '/money/transactions' },
  { id: 'page-bills', title: 'Bills', subtitle: 'Page', group: 'Pages', path: '/money/bills' },
  { id: 'page-subscriptions', title: 'Subscriptions', subtitle: 'Page', group: 'Pages', path: '/money/subscriptions' },
  { id: 'page-debt', title: 'Debt', subtitle: 'Page', group: 'Pages', path: '/money/debt' },
  { id: 'page-savings', title: 'Savings', subtitle: 'Page', group: 'Pages', path: '/money/savings' },
  { id: 'page-income', title: 'Recurring Income', subtitle: 'Page', group: 'Pages', path: '/money/income' },
  { id: 'page-exchange', title: 'Exchange Rate', subtitle: 'Page', group: 'Pages', path: '/money/exchange' },
  { id: 'page-vault', title: 'Password Vault', subtitle: 'Page', group: 'Pages', path: '/vault' },
  { id: 'page-shopping', title: 'Shopping Hub', subtitle: 'Page', group: 'Pages', path: '/shopping' },
  { id: 'page-gaming', title: 'Gaming Dashboard', subtitle: 'Page', group: 'Pages', path: '/gaming' },
  { id: 'page-ai', title: 'Nexus AI', subtitle: 'Page', group: 'Pages', path: '/ai' },
  { id: 'page-receipts', title: 'Receipt Vault', subtitle: 'Page', group: 'Pages', path: '/receipts' },
  { id: 'page-calendar', title: 'Calendar', subtitle: 'Page', group: 'Pages', path: '/calendar' },
  { id: 'page-workspace', title: 'Workspace Manager', subtitle: 'Page', group: 'Pages', path: '/workspace' },
  { id: 'page-toolbox', title: 'Dev Toolbox', subtitle: 'Page', group: 'Pages', path: '/toolbox' },
];
