import { FormEvent, useState } from 'react';
import { Plus, Receipt, X } from 'lucide-react';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import { inputClass, buttonIconPrimaryClass, buttonGhostIconClass } from '@/components/ui';
import { useMoneyStore } from '@/store/moneyStore';
import { formatCurrency } from '@/utils/money';

export default function Bills() {
  const { bills, addBill, toggleBillPaid, removeBill } = useMoneyStore();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || !name) return;
    addBill({ name, amount: value, dueDay: parseInt(dueDay, 10) || 1 });
    setName('');
    setAmount('');
    setDueDay('1');
  }

  return (
    <Card>
      <h3 className="mb-3 text-[13px] font-semibold text-surface-100">Bill reminders</h3>
      <form onSubmit={submit} className="mb-4 flex flex-wrap items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bill name" className={`min-w-0 flex-1 basis-40 ${inputClass}`} />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" type="number" className={`w-28 ${inputClass}`} />
        <input value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="Day" type="number" min={1} max={31} className={`w-20 ${inputClass}`} />
        <button type="submit" title="Add bill" className={buttonIconPrimaryClass}>
          <Plus size={16} />
        </button>
      </form>
      <ul className="space-y-1 text-[13px]">
        {bills.length === 0 && <EmptyState icon={Receipt} label="No bills yet — add one above." />}
        {bills.map((b) => (
          <li key={b.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface-800/50">
            <label className="flex items-center gap-2.5">
              <input type="checkbox" checked={b.paid} onChange={() => toggleBillPaid(b.id)} className="accent-accent-500" />
              <span className={b.paid ? 'text-surface-500 line-through' : 'text-surface-200'}>{b.name}</span>
              <span className="text-surface-500">Day {b.dueDay}</span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-surface-400">{formatCurrency(b.amount)}</span>
              <button onClick={() => removeBill(b.id)} className={buttonGhostIconClass}>
                <X size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
