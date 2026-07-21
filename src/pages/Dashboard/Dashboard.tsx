import { Link } from 'react-router-dom';
import { ArrowUpRight, TrendingUp, TrendingDown, PiggyBank, Receipt, ShoppingBag, CreditCard } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import StatCard from '@/components/StatCard';
import { useMoneyStore } from '@/store/moneyStore';
import { useShoppingStore } from '@/store/shoppingStore';
import { formatCurrency } from '@/utils/money';

export default function Dashboard() {
  const { transactions, bills, debts } = useMoneyStore();
  const { items } = useShoppingStore();

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

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      />
      <div className="grid grid-cols-1 gap-4 p-8 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Income (month)" value={formatCurrency(income)} icon={TrendingUp} tone="positive" />
        <StatCard label="Expenses (month)" value={formatCurrency(expenses)} icon={TrendingDown} tone="negative" />
        <StatCard label="Net savings" value={formatCurrency(income - expenses)} icon={PiggyBank} />
        <StatCard label="Bills due" value={String(unpaidBills.length)} icon={Receipt} tone={unpaidBills.length ? 'negative' : 'default'} />
        <StatCard label="Total debt" value={formatCurrency(totalDebt)} icon={CreditCard} tone={totalDebt ? 'negative' : 'default'} />

        <Card className="md:col-span-2 xl:col-span-2" hover>
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
            <ul className="space-y-2.5">
              {unpaidBills.map((b) => (
                <li key={b.id} className="flex items-center justify-between text-[13px]">
                  <span className="text-surface-200">{b.name}</span>
                  <span className="font-medium text-surface-300">{formatCurrency(b.amount)}</span>
                </li>
              ))}
            </ul>
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
      </div>
    </div>
  );
}
