import { FormEvent, useState } from 'react';
import { Plus, Wallet, X } from 'lucide-react';
import Card from '@/components/Card';
import Drawer from '@/components/Drawer';
import EmptyState from '@/components/EmptyState';
import Select from '@/components/Select';
import { inputClass, buttonPrimaryClass, buttonGhostIconClass } from '@/components/ui';
import { useMoneyStore } from '@/store/moneyStore';
import { formatCurrency, toMonthlyFromFrequency } from '@/utils/money';
import { IncomeFrequency } from '@/types';

export default function RecurringIncome() {
  const { recurringIncomes, addRecurringIncome, removeRecurringIncome } = useMoneyStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<IncomeFrequency>('monthly');
  const [nextDate, setNextDate] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || !name) return;
    addRecurringIncome({ name, amount: value, frequency, nextDate: nextDate || new Date().toISOString().slice(0, 10) });
    setName('');
    setAmount('');
    setNextDate('');
  }

  const monthlyTotal = recurringIncomes.reduce((a, i) => a + toMonthlyFromFrequency(i.amount, i.frequency), 0);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-surface-100">Recurring income</h3>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-emerald-400">{formatCurrency(monthlyTotal)} / mo</span>
          <button onClick={() => setOpen(true)} className={buttonPrimaryClass}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
      <ul className="space-y-1 text-[13px]">
        {recurringIncomes.length === 0 && <EmptyState icon={Wallet} label="No recurring income sources yet." />}
        {recurringIncomes.map((i) => (
          <li key={i.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface-800/50">
            <div>
              <span className="text-surface-200">{i.name}</span>
              <span className="text-surface-500"> · next {i.nextDate}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-medium text-emerald-400">
                +{formatCurrency(i.amount)} / {i.frequency}
              </span>
              <button onClick={() => removeRecurringIncome(i.id)} className={buttonGhostIconClass}>
                <X size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Drawer open={open} onClose={() => setOpen(false)} title="Add recurring income">
        <form onSubmit={submit} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Source (e.g. Salary)" className={`w-full ${inputClass}`} />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" type="number" className={`w-full ${inputClass}`} />
          <Select
            value={frequency}
            onChange={(v) => setFrequency(v as IncomeFrequency)}
            options={[
              { value: 'weekly', label: 'Weekly' },
              { value: 'biweekly', label: 'Biweekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
            className="w-full"
          />
          <input value={nextDate} onChange={(e) => setNextDate(e.target.value)} type="date" className={`w-full ${inputClass}`} />
          <button type="submit" className={`w-full ${buttonPrimaryClass}`}>
            <Plus size={14} /> Add income source
          </button>
        </form>
      </Drawer>
    </Card>
  );
}
