import { useMoneyStore } from '@/store/moneyStore';
import { useCalendarStore } from '@/store/calendarStore';
import { useGamingStore } from '@/store/gamingStore';
import { useReceiptStore } from '@/store/receiptStore';
import { useShoppingStore } from '@/store/shoppingStore';
import { formatCurrency } from '@/utils/money';
import { expandRecurringEvents, formatDateKey } from '@/utils/calendar';

export type ContextDomain = 'money' | 'calendar' | 'gaming' | 'receipts' | 'shopping';

export const CONTEXT_DOMAIN_LABELS: Record<ContextDomain, string> = {
  money: 'Money',
  calendar: 'Calendar',
  gaming: 'Gaming',
  receipts: 'Receipts',
  shopping: 'Shopping',
};

function section(title: string, lines: string[]): string {
  if (lines.length === 0) return `## ${title}\n(none)`;
  return `## ${title}\n${lines.join('\n')}`;
}

export function buildAssistantContext(enabledDomains: Record<ContextDomain, boolean>): string {
  const sections: string[] = [`# Nexus data snapshot (generated at request time)`];

  if (enabledDomains.money) {
    const money = useMoneyStore.getState();
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

    sections.push(
      section('Accounts', [`Total balance across all accounts: ${formatCurrency(totalBalance)}`, ...accountsLines]),
      section('Recent transactions (most recent 25)', recentTransactions),
      section('Bills', billsLines),
      section('Subscriptions', subscriptionsLines),
      section('Debts', debtsLines),
      section('Savings goals', savingsLines),
      section('Recurring income', incomeLines),
    );
  }

  if (enabledDomains.calendar) {
    const calendar = useCalendarStore.getState();
    const upcomingEvents = [...calendar.events]
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .slice(0, 40)
      .map((e) => `- ${e.date}${e.time ? ` ${e.time}` : ''}: ${e.title}${e.category ? ` [${e.category}]` : ''}${e.recurrence !== 'none' ? ` (repeats ${e.recurrence})` : ''}`);
    sections.push(section('Calendar events (next 40)', upcomingEvents));
  }

  if (enabledDomains.gaming) {
    const gaming = useGamingStore.getState();
    const gamesLines = gaming.games.map(
      (g) => `- ${g.title} (${g.platform}): ${g.status}, ${g.hoursPlayed}h played, last played ${g.lastPlayed || 'never'}, achievements ${g.achievementsUnlocked}/${g.achievementsTotal}`,
    );
    sections.push(section('Games', gamesLines));
  }

  if (enabledDomains.receipts) {
    const receipts = useReceiptStore.getState();
    const receiptsLines = [...receipts.receipts]
      .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate))
      .slice(0, 25)
      .map((r) => `- ${r.purchaseDate}: ${r.store} — ${r.product}, ${formatCurrency(r.amount)}, category ${r.category || 'n/a'}`);
    sections.push(section('Receipts (most recent 25)', receiptsLines));
  }

  if (enabledDomains.shopping) {
    const shopping = useShoppingStore.getState();
    const wishlistLines = shopping.items
      .filter((i) => !i.purchased)
      .map((i) => `- ${i.name}${i.price != null ? ` — ₱${i.price}` : ''}${i.store ? ` at ${i.store}` : ''}`);
    sections.push(section('Shopping wishlist (not yet purchased)', wishlistLines));
  }

  return sections.join('\n\n');
}

/** Deterministic, no-AI-call daily summary: bills/subscriptions due soon and today's calendar events. */
export function buildDailyDigest(): string | null {
  const money = useMoneyStore.getState();
  const calendar = useCalendarStore.getState();
  const today = new Date();
  const todayKey = formatDateKey(today);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const lines: string[] = [];

  const dueSoonBills = money.bills.filter((b) => {
    if (b.paid) return false;
    const day = today.getDate();
    const daysUntilDue = b.dueDay >= day ? b.dueDay - day : 999;
    return daysUntilDue <= 7;
  });
  if (dueSoonBills.length) {
    lines.push(`💸 **Bills due soon:** ${dueSoonBills.map((b) => `${b.name} (day ${b.dueDay})`).join(', ')}`);
  }

  const dueSoonSubs = money.subscriptions.filter((s) => s.nextBillingDate >= todayKey && s.nextBillingDate <= formatDateKey(weekEnd));
  if (dueSoonSubs.length) {
    lines.push(`🔁 **Renewing soon:** ${dueSoonSubs.map((s) => `${s.name} (${s.nextBillingDate})`).join(', ')}`);
  }

  const todaysEvents = expandRecurringEvents(calendar.events, today, today).sort((a, b) => a.time.localeCompare(b.time));
  if (todaysEvents.length) {
    lines.push(`📅 **Today:** ${todaysEvents.map((e) => `${e.title}${e.time ? ` at ${e.time}` : ''}`).join(', ')}`);
  }

  if (lines.length === 0) return null;
  return `Morning! Here's what's on deck today:\n\n${lines.join('\n')}`;
}
