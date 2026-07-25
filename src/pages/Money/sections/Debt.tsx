import { FormEvent, useState } from 'react';
import { CreditCard, Plus, X } from 'lucide-react';
import Card from '@/components/Card';
import Drawer from '@/components/Drawer';
import EmptyState from '@/components/EmptyState';
import ProgressBar from '@/components/ProgressBar';
import { inputClass, buttonPrimaryClass, buttonIconPrimaryClass, buttonGhostIconClass } from '@/components/ui';
import { useMoneyStore } from '@/store/moneyStore';
import { formatCurrency } from '@/utils/money';

export default function Debt() {
  const { debts, addDebt, makeDebtPayment, removeDebt } = useMoneyStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minPayment, setMinPayment] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [paymentInputs, setPaymentInputs] = useState<Record<string, string>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const total = parseFloat(totalAmount);
    if (!total || !name) return;
    addDebt({
      name,
      totalAmount: total,
      remainingAmount: total,
      interestRate: parseFloat(interestRate) || 0,
      minPayment: parseFloat(minPayment) || 0,
      dueDay: parseInt(dueDay, 10) || 1,
    });
    setName('');
    setTotalAmount('');
    setInterestRate('');
    setMinPayment('');
    setDueDay('1');
  }

  const totalRemaining = debts.reduce((a, d) => a + d.remainingAmount, 0);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-surface-100">Debt tracker</h3>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-surface-400">{formatCurrency(totalRemaining)} remaining</span>
          <button onClick={() => setOpen(true)} className={buttonPrimaryClass}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {debts.length === 0 && <EmptyState icon={CreditCard} label="No debts tracked. Add one above, or enjoy the silence." />}
        {debts.map((d) => (
          <div key={d.id} className="rounded-xl border border-surface-800 p-3">
            <div className="mb-1.5 flex items-center justify-between text-[13px]">
              <div>
                <span className="font-medium text-surface-100">{d.name}</span>
                <span className="ml-2 text-surface-500">
                  {d.interestRate}% APR · min {formatCurrency(d.minPayment)} · due day {d.dueDay}
                </span>
              </div>
              <button onClick={() => removeDebt(d.id)} className={buttonGhostIconClass}>
                <X size={14} />
              </button>
            </div>
            <div className="mb-2 flex items-center justify-between text-[12px] text-surface-400">
              <span>{formatCurrency(d.remainingAmount)} remaining</span>
              <span>of {formatCurrency(d.totalAmount)}</span>
            </div>
            <ProgressBar value={((d.totalAmount - d.remainingAmount) / d.totalAmount) * 100} />
            <div className="mt-3 flex items-center gap-2">
              <input
                value={paymentInputs[d.id] || ''}
                onChange={(e) => setPaymentInputs((p) => ({ ...p, [d.id]: e.target.value }))}
                placeholder="Log a payment"
                type="number"
                className={`w-40 ${inputClass}`}
              />
              <button
                title="Log payment"
                disabled={!parseFloat(paymentInputs[d.id] || '0')}
                onClick={() => {
                  const amt = parseFloat(paymentInputs[d.id] || '0');
                  if (amt > 0) {
                    makeDebtPayment(d.id, amt);
                    setPaymentInputs((p) => ({ ...p, [d.id]: '' }));
                  }
                }}
                className={buttonIconPrimaryClass}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title="Add debt">
        <form onSubmit={submit} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Debt name" className={`w-full ${inputClass}`} />
          <input value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="Total amount" type="number" className={`w-full ${inputClass}`} />
          <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="Interest rate (APR %)" type="number" className={`w-full ${inputClass}`} />
          <input value={minPayment} onChange={(e) => setMinPayment(e.target.value)} placeholder="Minimum payment" type="number" className={`w-full ${inputClass}`} />
          <input value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="Due day" type="number" min={1} max={31} className={`w-full ${inputClass}`} />
          <button type="submit" className={`w-full ${buttonPrimaryClass}`}>
            <Plus size={14} /> Add debt
          </button>
        </form>
      </Drawer>
    </Card>
  );
}
