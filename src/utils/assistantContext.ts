import { useMoneyStore } from '@/store/moneyStore';
import { useCalendarStore } from '@/store/calendarStore';
import { useGamingStore } from '@/store/gamingStore';
import { useReceiptStore } from '@/store/receiptStore';
import { useShoppingStore } from '@/store/shoppingStore';
import { formatCurrency } from '@/utils/money';

function section(title: string, lines: string[]): string {
  if (lines.length === 0) return `## ${title}\n(none)`;
  return `## ${title}\n${lines.join('\n')}`;
}

export function buildAssistantContext(): string {
  const money = useMoneyStore.getState();
  const calendar = useCalendarStore.getState();
  const gaming = useGamingStore.getState();
  const receipts = useReceiptStore.getState();
  const shopping = useShoppingStore.getState();

  const accountsLines = money.accounts.map(
    (a) => `- ${a.name} (${a.institution || a.type}): ${formatCurrency(a.balance)}`,
  );
  const totalBalance = money.accounts.reduce((sum, a) => sum + a.balance, 0);

  const recentTransactions = [...money.transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 25)
    .map((t) => `- ${t.date} | ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)} | ${t.category}${t.note ? ` — ${t.note}` : ''}`);

  const billsLines = money.bills.map(
    (b) => `- ${b.name}: ${formatCurrency(b.amount)}, due day ${b.dueDay}, ${b.paid ? 'paid' : 'UNPAID'}`,
  );

  const subscriptionsLines = money.subscriptions.map(
    (s) => `- ${s.name}: ${formatCurrency(s.amount)} / ${s.cycle}, next billing ${s.nextBillingDate}, category ${s.category || 'n/a'}`,
  );

  const debtsLines = money.debts.map(
    (d) =>
      `- ${d.name}: ${formatCurrency(d.remainingAmount)} remaining of ${formatCurrency(d.totalAmount)}, ${d.interestRate}% interest, min payment ${formatCurrency(d.minPayment)}, due day ${d.dueDay}`,
  );

  const savingsLines = money.savingsGoals.map(
    (g) => `- ${g.name}: ${formatCurrency(g.currentAmount)} / ${formatCurrency(g.targetAmount)}, deadline ${g.deadline || 'none'}`,
  );

  const incomeLines = money.recurringIncomes.map(
    (i) =>
      `- ${i.name}: ${i.currency === 'USD' ? '$' : '₱'}${i.amount} / ${i.frequency}${
        i.payDay1 != null && i.payDay2 != null ? ` (cutoffs ${i.payDay1} & ${i.payDay2})` : ''
      }, next ${i.nextDate}`,
  );

  const upcomingEvents = [...calendar.events]
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 40)
    .map((e) => `- ${e.date}${e.time ? ` ${e.time}` : ''}: ${e.title}${e.category ? ` [${e.category}]` : ''}${e.recurrence !== 'none' ? ` (repeats ${e.recurrence})` : ''}`);

  const gamesLines = gaming.games.map(
    (g) => `- ${g.title} (${g.platform}): ${g.status}, ${g.hoursPlayed}h played, last played ${g.lastPlayed || 'never'}, achievements ${g.achievementsUnlocked}/${g.achievementsTotal}`,
  );

  const receiptsLines = [...receipts.receipts]
    .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate))
    .slice(0, 25)
    .map((r) => `- ${r.purchaseDate}: ${r.store} — ${r.product}, ${formatCurrency(r.amount)}, category ${r.category || 'n/a'}`);

  const wishlistLines = shopping.items
    .filter((i) => !i.purchased)
    .map((i) => `- ${i.name}${i.price != null ? ` — ₱${i.price}` : ''}${i.store ? ` at ${i.store}` : ''}`);

  return [
    `# Nexus data snapshot (generated at request time)`,
    section('Accounts', [`Total balance across all accounts: ${formatCurrency(totalBalance)}`, ...accountsLines]),
    section('Recent transactions (most recent 25)', recentTransactions),
    section('Bills', billsLines),
    section('Subscriptions', subscriptionsLines),
    section('Debts', debtsLines),
    section('Savings goals', savingsLines),
    section('Recurring income', incomeLines),
    section('Calendar events (next 40)', upcomingEvents),
    section('Games', gamesLines),
    section('Receipts (most recent 25)', receiptsLines),
    section('Shopping wishlist (not yet purchased)', wishlistLines),
  ].join('\n\n');
}
