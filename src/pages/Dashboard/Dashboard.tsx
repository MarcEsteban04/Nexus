import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Receipt,
  ShoppingBag,
  CreditCard,
  Wallet,
  CalendarDays,
  Gamepad2,
  Plus,
  Sparkles,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import StatCard from '@/components/StatCard';
import ProgressBar from '@/components/ProgressBar';
import { buttonSecondaryClass } from '@/components/ui';
import { useMoneyStore } from '@/store/moneyStore';
import { useShoppingStore } from '@/store/shoppingStore';
import { useCalendarStore } from '@/store/calendarStore';
import { useGamingStore } from '@/store/gamingStore';
import { usePayoneerStore } from '@/store/payoneerStore';
import { formatCurrency, toMonthlyFromFrequency } from '@/utils/money';
import { categoryPalette, expandRecurringEvents, formatFriendlyDate } from '@/utils/calendar';

export default function Dashboard() {
  const { transactions, bills, debts, recurringIncomes, savingsGoals } = useMoneyStore();
  const { items } = useShoppingStore();
  const { events } = useCalendarStore();
  const { games } = useGamingStore();
  const { midMarketRate, fetchMidMarketRate, effectiveRate } = usePayoneerStore();

  const hasUsdIncome = recurringIncomes.some((i) => i.currency === 'USD');

  useEffect(() => {
    if (hasUsdIncome && midMarketRate === null) fetchMidMarketRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUsdIncome, midMarketRate]);

  const now = new Date();
  const monthly = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const income = monthly.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expenses = monthly.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const unpaidBills = bills.filter((b) => !b.paid);
  const activeWishlist = items.filter((i) => !i.purchased);
  const totalDebt = debts.reduce((a, d) => a + d.remainingAmount, 0);

  const rate = effectiveRate();
  const monthlyRecurringIncome = recurringIncomes.reduce((a, i) => {
    const monthlyInOwnCurrency = toMonthlyFromFrequency(i.amount, i.frequency);
    return a + (i.currency === 'USD' ? monthlyInOwnCurrency * (rate ?? 0) : monthlyInOwnCurrency);
  }, 0);

  const weekAhead = new Date(now);
  weekAhead.setDate(weekAhead.getDate() + 7);
  const upcomingEvents = expandRecurringEvents(events, now, weekAhead)
    .sort((a, b) => (a.occurrenceDate + a.time).localeCompare(b.occurrenceDate + b.time))
    .slice(0, 5);

  const recentTransactions = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const topSavingsGoal = [...savingsGoals].sort((a, b) => b.currentAmount / b.targetAmount - a.currentAmount / a.targetAmount)[0];

  const featuredGame = [...games].sort((a, b) => {
    if (a.status === 'playing' && b.status !== 'playing') return -1;
    if (b.status === 'playing' && a.status !== 'playing') return 1;
    return (b.lastPlayed || '').localeCompare(a.lastPlayed || '');
  })[0];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      />
      <div className="p-8">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link to="/money/transactions" className={buttonSecondaryClass}>
            <Plus size={13} /> Add transaction
          </Link>
          <Link to="/calendar" className={buttonSecondaryClass}>
            <Plus size={13} /> Add event
          </Link>
          <Link to="/shopping" className={buttonSecondaryClass}>
            <Plus size={13} /> Add wishlist item
          </Link>
          <Link to="/ai" className={buttonSecondaryClass}>
            <Sparkles size={13} /> Ask Nexus AI
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Income (month)" value={formatCurrency(income)} icon={TrendingUp} tone="positive" />
          <StatCard label="Expenses (month)" value={formatCurrency(expenses)} icon={TrendingDown} tone="negative" />
          <StatCard label="Net savings" value={formatCurrency(income - expenses)} icon={PiggyBank} />
          <StatCard label="Recurring income / mo" value={formatCurrency(monthlyRecurringIncome)} icon={Wallet} tone="positive" />
          <StatCard label="Bills due" value={String(unpaidBills.length)} icon={Receipt} tone={unpaidBills.length ? 'negative' : 'default'} />
          <StatCard label="Total debt" value={formatCurrency(totalDebt)} icon={CreditCard} tone={totalDebt ? 'negative' : 'default'} />

          <Card className="md:col-span-2 xl:col-span-2" hover>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-surface-100">
                <CalendarDays size={15} className="text-accent-400" />
                Upcoming
              </h3>
              <Link
                to="/calendar"
                className="flex items-center gap-1 text-[12px] font-medium text-accent-400 hover:text-accent-300"
              >
                Manage <ArrowUpRight size={13} />
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="text-[13px] text-surface-400">Nothing on your calendar this week.</p>
            ) : (
              <ul className="space-y-2.5">
                {upcomingEvents.map((e) => (
                  <li key={e.occurrenceKey} className="flex items-center gap-2 text-[13px]">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${categoryPalette(e.category).dot}`} />
                    <span className="min-w-0 flex-1 truncate text-surface-200">{e.title}</span>
                    <span className="shrink-0 text-[12px] text-surface-400">
                      {formatFriendlyDate(e.occurrenceDate)}
                      {e.time && ` · ${e.time}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="md:col-span-2 xl:col-span-2" hover>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-surface-100">
                <Receipt size={15} className="text-accent-400" />
                Recent transactions
              </h3>
              <Link
                to="/money/transactions"
                className="flex items-center gap-1 text-[12px] font-medium text-accent-400 hover:text-accent-300"
              >
                Manage <ArrowUpRight size={13} />
              </Link>
            </div>
            {recentTransactions.length === 0 ? (
              <p className="text-[13px] text-surface-400">No transactions logged yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {recentTransactions.map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-[13px]">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-surface-200">{t.category}</p>
                      <p className="text-[11px] text-surface-500">{t.date}</p>
                    </div>
                    <span className={`shrink-0 font-medium ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.type === 'income' ? '+' : '-'}
                      {formatCurrency(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="md:col-span-2 xl:col-span-2" hover>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-surface-100">
                <PiggyBank size={15} className="text-accent-400" />
                Savings goal
              </h3>
              <Link
                to="/money/savings"
                className="flex items-center gap-1 text-[12px] font-medium text-accent-400 hover:text-accent-300"
              >
                Manage <ArrowUpRight size={13} />
              </Link>
            </div>
            {!topSavingsGoal ? (
              <p className="text-[13px] text-surface-400">No savings goals yet.</p>
            ) : (
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="text-surface-200">{topSavingsGoal.name}</span>
                  <span className="text-surface-400">
                    {formatCurrency(topSavingsGoal.currentAmount)} / {formatCurrency(topSavingsGoal.targetAmount)}
                  </span>
                </div>
                <ProgressBar value={(topSavingsGoal.currentAmount / topSavingsGoal.targetAmount) * 100} tone="positive" />
              </div>
            )}
          </Card>

          <Card className="md:col-span-2 xl:col-span-2" hover>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-surface-100">
                <Gamepad2 size={15} className="text-accent-400" />
                Gaming
              </h3>
              <Link
                to="/gaming"
                className="flex items-center gap-1 text-[12px] font-medium text-accent-400 hover:text-accent-300"
              >
                Manage <ArrowUpRight size={13} />
              </Link>
            </div>
            {!featuredGame ? (
              <p className="text-[13px] text-surface-400">No games tracked yet.</p>
            ) : (
              <div className="flex items-center gap-3">
                {featuredGame.iconDataUrl ? (
                  <img src={featuredGame.iconDataUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-800 text-surface-500">
                    <Gamepad2 size={18} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-surface-200">{featuredGame.title}</p>
                  <p className="text-[12px] text-surface-500">
                    {featuredGame.platform} · {featuredGame.hoursPlayed}h played
                    {featuredGame.status === 'playing' ? ' · Playing now' : ''}
                  </p>
                </div>
              </div>
            )}
          </Card>

          <Card className="md:col-span-2 xl:col-span-2" hover>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-surface-100">
                <ShoppingBag size={15} className="text-accent-400" />
                Wishlist
              </h3>
              <Link
                to="/shopping"
                className="flex items-center gap-1 text-[12px] font-medium text-accent-400 hover:text-accent-300"
              >
                Manage <ArrowUpRight size={13} />
              </Link>
            </div>
            {activeWishlist.length === 0 ? (
              <p className="text-[13px] text-surface-400">Nothing on your wishlist yet.</p>
            ) : (
              <ul className="space-y-2.5">
                {activeWishlist.slice(0, 5).map((i) => (
                  <li key={i.id} className="flex items-center justify-between text-[13px]">
                    <span className="text-surface-200">{i.name}</span>
                    {i.price != null && <span className="font-medium text-surface-300">{formatCurrency(i.price)}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="md:col-span-2 xl:col-span-4" hover>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-surface-100">
                <Receipt size={15} className="text-accent-400" />
                Bills due
              </h3>
              <Link
                to="/money"
                className="flex items-center gap-1 text-[12px] font-medium text-accent-400 hover:text-accent-300"
              >
                Manage <ArrowUpRight size={13} />
              </Link>
            </div>
            {unpaidBills.length === 0 ? (
              <p className="text-[13px] text-surface-400">No unpaid bills. Nice.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {unpaidBills.map((b) => (
                  <li key={b.id} className="flex items-center justify-between text-[13px]">
                    <span className="text-surface-200">{b.name}</span>
                    <span className="font-medium text-surface-300">{formatCurrency(b.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
