import { FormEvent, useState } from 'react';
import { ArrowLeftRight, Download, Plus, X } from 'lucide-react';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import Select from '@/components/Select';
import { inputClass, buttonIconPrimaryClass, buttonSecondaryClass, buttonGhostIconClass } from '@/components/ui';
import { useMoneyStore } from '@/store/moneyStore';
import { formatCurrency } from '@/utils/money';

export default function Transactions() {
  const { transactions, addTransaction, removeTransaction } = useMoneyStore();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');

  function submitTransaction(e: FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || !category) return;
    addTransaction({ type, amount: value, category, note, date: new Date().toISOString() });
    setAmount('');
    setCategory('');
    setNote('');
  }

  function exportCsv() {
    const header = 'type,amount,category,note,date\n';
    const rows = transactions
      .map((t) => [t.type, t.amount, t.category, t.note.replace(/,/g, ';'), t.date].join(','))
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-surface-100">Transactions</h3>
        <button onClick={exportCsv} className={buttonSecondaryClass}>
          <Download size={13} /> Export CSV
        </button>
      </div>
      <form onSubmit={submitTransaction} className="mb-4 flex flex-wrap items-center gap-2">
        <Select
          value={type}
          onChange={(v) => setType(v as 'income' | 'expense')}
          options={[
            { value: 'expense', label: 'Expense' },
            { value: 'income', label: 'Income' },
          ]}
          className="w-28"
        />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" type="number" className={`w-28 ${inputClass}`} />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className={`min-w-0 flex-1 basis-28 ${inputClass}`} />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" className={`min-w-0 flex-1 basis-28 ${inputClass}`} />
        <button type="submit" title="Add transaction" className={buttonIconPrimaryClass}>
          <Plus size={16} />
        </button>
      </form>
      <ul className="max-h-96 space-y-1 overflow-y-auto text-[13px]">
        {transactions.length === 0 && <EmptyState icon={ArrowLeftRight} label="No transactions yet." />}
        {transactions.map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface-800/50">
            <div>
              <span className={t.type === 'income' ? 'font-medium text-emerald-400' : 'font-medium text-rose-400'}>
                {t.type === 'income' ? '+' : '-'}
                {formatCurrency(t.amount)}
              </span>{' '}
              <span className="text-surface-400">· {t.category}</span>
              {t.note && <span className="text-surface-500"> — {t.note}</span>}
            </div>
            <button onClick={() => removeTransaction(t.id)} className={buttonGhostIconClass}>
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
