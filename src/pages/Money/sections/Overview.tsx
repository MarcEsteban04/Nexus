import { TrendingUp, TrendingDown, PiggyBank, Receipt, CreditCard, Repeat, Wallet, Landmark } from 'lucide-react';
import StatCard from '@/components/StatCard';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import ProgressBar from '@/components/ProgressBar';
import { useMoneyStore } from '@/store/moneyStore';
import { formatCurrency, toMonthlyFromCycle, toMonthlyFromFrequency } from '@/utils/money';

export default function Overview() {
  const { transactions, bills, subscriptions, debts, savingsGoals, recurringIncomes, accounts } = useMoneyStore();

  const now = new Date();
  const monthly = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const income = monthly.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expenses = monthly.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);

  const monthlySubscriptionCost = subscriptions.reduce((a, s) => a + toMonthlyFromCycle(s.amount, s.cycle), 0);
  const monthlyRecurringIncome = recurringIncomes.reduce((a, i) => a + toMonthlyFromFrequency(i.amount, i.frequency), 0);
  const totalDebt = debts.reduce((a, d) => a + d.remainingAmount, 0);
  const unpaidBills = bills.filter((b) => !b.paid);
  const totalBalance = accounts.reduce((a, acc) => a + acc.balance, 0);

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total balance" value={formatCurrency(totalBalance)} icon={Landmark} tone="positive" />
        <StatCard label="Income (month)" value={formatCurrency(income)} icon={TrendingUp} tone="positive" />
        <StatCard label="Expenses (month)" value={formatCurrency(expenses)} icon={TrendingDown} tone="negative" />
        <StatCard label="Net savings" value={formatCurrency(income - expenses)} icon={PiggyBank} />
        <StatCard label="Total debt" value={formatCurrency(totalDebt)} icon={CreditCard} tone={totalDebt ? 'negative' : 'default'} />
        <StatCard label="Bills due" value={String(unpaidBills.length)} icon={Receipt} tone={unpaidBills.length ? 'negative' : 'default'} />
        <StatCard label="Subscriptions / mo" value={formatCurrency(monthlySubscriptionCost)} icon={Repeat} />
        <StatCard label="Recurring income / mo" value={formatCurrency(monthlyRecurringIncome)} icon={Wallet} tone="positive" />
      </div>

      <Card>
        <h3 className="mb-4 text-[13px] font-semibold text-surface-100">Savings goals</h3>
        {savingsGoals.length === 0 ? (
          <EmptyState icon={PiggyBank} label="No savings goals yet. Add one in the Savings tab." />
        ) : (
          <div className="space-y-4">
            {savingsGoals.map((g) => (
              <div key={g.id}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="text-surface-200">{g.name}</span>
                  <span className="text-surface-400">
                    {formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}
                  </span>
                </div>
                <ProgressBar value={(g.currentAmount / g.targetAmount) * 100} tone="positive" />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
