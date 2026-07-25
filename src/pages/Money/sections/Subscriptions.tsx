import { FormEvent, useState } from 'react';
import { Plus, Repeat, X } from 'lucide-react';
import Card from '@/components/Card';
import Drawer from '@/components/Drawer';
import EmptyState from '@/components/EmptyState';
import Select from '@/components/Select';
import { inputClass, buttonPrimaryClass, buttonGhostIconClass } from '@/components/ui';
import { useMoneyStore } from '@/store/moneyStore';
import { formatCurrency, toMonthlyFromCycle } from '@/utils/money';
import { BillingCycle } from '@/types';

export default function Subscriptions() {
  const { subscriptions, addSubscription, removeSubscription } = useMoneyStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [category, setCategory] = useState('');
  const [nextBillingDate, setNextBillingDate] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || !name) return;
    addSubscription({ name, amount: value, cycle, category, nextBillingDate: nextBillingDate || new Date().toISOString().slice(0, 10) });
    setName('');
    setAmount('');
    setCategory('');
    setNextBillingDate('');
  }

  const monthlyTotal = subscriptions.reduce((a, s) => a + toMonthlyFromCycle(s.amount, s.cycle), 0);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-surface-100">Subscriptions</h3>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-surface-400">{formatCurrency(monthlyTotal)} / mo</span>
          <button onClick={() => setOpen(true)} className={buttonPrimaryClass}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
      <ul className="space-y-1 text-[13px]">
        {subscriptions.length === 0 && <EmptyState icon={Repeat} label="No subscriptions tracked yet." />}
        {subscriptions.map((s) => (
          <li key={s.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface-800/50">
            <div className="flex items-center gap-2 text-surface-200">
              <span>{s.name}</span>
              {s.category && <span className="rounded-full bg-surface-800 px-2 py-0.5 text-[11px] text-surface-400">{s.category}</span>}
              <span className="text-surface-500">next {s.nextBillingDate}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-surface-400">
                {formatCurrency(s.amount)} / {s.cycle}
              </span>
              <button onClick={() => removeSubscription(s.id)} className={buttonGhostIconClass}>
                <X size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Drawer open={open} onClose={() => setOpen(false)} title="Add subscription">
        <form onSubmit={submit} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={`w-full ${inputClass}`} />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" type="number" className={`w-full ${inputClass}`} />
          <Select
            value={cycle}
            onChange={(v) => setCycle(v as BillingCycle)}
            options={[
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
            className="w-full"
          />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className={`w-full ${inputClass}`} />
          <input value={nextBillingDate} onChange={(e) => setNextBillingDate(e.target.value)} type="date" className={`w-full ${inputClass}`} />
          <button type="submit" className={`w-full ${buttonPrimaryClass}`}>
            <Plus size={14} /> Add subscription
          </button>
        </form>
      </Drawer>
    </Card>
  );
}
