import { FormEvent, useState } from 'react';
import { PiggyBank, Plus, X } from 'lucide-react';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import ProgressBar from '@/components/ProgressBar';
import { inputClass, buttonIconPrimaryClass, buttonGhostIconClass } from '@/components/ui';
import { useMoneyStore } from '@/store/moneyStore';
import { formatCurrency } from '@/utils/money';

export default function Savings() {
  const { savingsGoals, addSavingsGoal, contributeToSavingsGoal, removeSavingsGoal } = useMoneyStore();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [contributions, setContributions] = useState<Record<string, string>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    if (!target || !name) return;
    addSavingsGoal({ name, targetAmount: target, deadline });
    setName('');
    setTargetAmount('');
    setDeadline('');
  }

  return (
    <Card>
      <h3 className="mb-3 text-[13px] font-semibold text-surface-100">Savings goals</h3>
      <form onSubmit={submit} className="mb-4 flex flex-wrap items-center gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Goal name" className={`min-w-0 flex-1 basis-32 ${inputClass}`} />
        <input value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="Target" type="number" className={`w-28 ${inputClass}`} />
        <input value={deadline} onChange={(e) => setDeadline(e.target.value)} type="date" className={`w-36 ${inputClass}`} />
        <button type="submit" title="Add goal" className={buttonIconPrimaryClass}>
          <Plus size={16} />
        </button>
      </form>

      <div className="space-y-3">
        {savingsGoals.length === 0 && <EmptyState icon={PiggyBank} label="No savings goals yet." />}
        {savingsGoals.map((g) => (
          <div key={g.id} className="rounded-xl border border-surface-800 p-3">
            <div className="mb-1.5 flex items-center justify-between text-[13px]">
              <div>
                <span className="font-medium text-surface-100">{g.name}</span>
                {g.deadline && <span className="ml-2 text-surface-500">by {g.deadline}</span>}
              </div>
              <button onClick={() => removeSavingsGoal(g.id)} className={buttonGhostIconClass}>
                <X size={14} />
              </button>
            </div>
            <div className="mb-2 flex items-center justify-between text-[12px] text-surface-400">
              <span>{formatCurrency(g.currentAmount)} saved</span>
              <span>of {formatCurrency(g.targetAmount)}</span>
            </div>
            <ProgressBar value={(g.currentAmount / g.targetAmount) * 100} tone="positive" />
            <div className="mt-3 flex items-center gap-2">
              <input
                value={contributions[g.id] || ''}
                onChange={(e) => setContributions((c) => ({ ...c, [g.id]: e.target.value }))}
                placeholder="Add funds"
                type="number"
                className={`w-40 ${inputClass}`}
              />
              <button
                title="Add funds"
                disabled={!parseFloat(contributions[g.id] || '0')}
                onClick={() => {
                  const amt = parseFloat(contributions[g.id] || '0');
                  if (amt > 0) {
                    contributeToSavingsGoal(g.id, amt);
                    setContributions((c) => ({ ...c, [g.id]: '' }));
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
    </Card>
  );
}
