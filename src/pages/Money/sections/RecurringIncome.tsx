import { ChangeEvent, FormEvent, useState } from 'react';
import { Plus, Wallet, X, ImagePlus, CheckCircle2, ReceiptText } from 'lucide-react';
import Card from '@/components/Card';
import Drawer from '@/components/Drawer';
import EmptyState from '@/components/EmptyState';
import Select from '@/components/Select';
import { inputClass, buttonPrimaryClass, buttonSecondaryClass, buttonGhostIconClass } from '@/components/ui';
import { useMoneyStore } from '@/store/moneyStore';
import { useLinkedTransaction } from '@/hooks/useLinkedTransaction';
import { formatCurrency, toMonthlyFromFrequency, advanceDate } from '@/utils/money';
import { IncomeFrequency, RecurringIncome as RecurringIncomeType } from '@/types';

function LogIncomeDrawer({ income, onClose }: { income: RecurringIncomeType | null; onClose: () => void }) {
  const { accounts, lastAccountId, updateRecurringIncome } = useMoneyStore();
  const createLinkedTransaction = useLinkedTransaction();
  const [accountId, setAccountId] = useState(lastAccountId ?? '');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setReceiptImage(String(reader.result ?? ''));
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function confirm() {
    if (!income || !accountId) return;
    createLinkedTransaction({
      type: 'income',
      amount: income.amount,
      category: income.name,
      note: `Recurring income — ${income.name}`,
      date: new Date().toISOString().slice(0, 10),
      accountId,
      receiptImage,
    });
    updateRecurringIncome(income.id, { nextDate: advanceDate(income.nextDate, income.frequency) });
    setReceiptImage(null);
    onClose();
  }

  return (
    <Drawer open={!!income} onClose={onClose} title="Log income">
      {income && (
        <div className="space-y-3">
          <div className="rounded-xl border border-surface-800 p-3 text-[13px]">
            <p className="font-medium text-surface-100">{income.name}</p>
            <p className="mt-1 font-semibold text-emerald-400">+{formatCurrency(income.amount)}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-surface-400">
              Deposit to account
            </label>
            {accounts.length === 0 ? (
              <p className="text-[12px] text-surface-500">No accounts yet — add one in Accounts first.</p>
            ) : (
              <Select
                value={accountId}
                onChange={setAccountId}
                options={accounts.map((a) => ({ value: a.id, label: `${a.name} (${formatCurrency(a.balance)})` }))}
                className="w-full"
              />
            )}
          </div>
          <label className={`flex w-full cursor-pointer items-center justify-center gap-2 ${buttonSecondaryClass}`}>
            <ImagePlus size={13} /> {receiptImage ? 'Payslip attached' : 'Attach payslip (optional)'}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
          {receiptImage && <img src={receiptImage} alt="" className="h-24 w-full rounded-lg object-cover" />}
          <button onClick={confirm} disabled={!accountId} className={`w-full ${buttonPrimaryClass}`}>
            <CheckCircle2 size={14} /> Log this income
          </button>
        </div>
      )}
    </Drawer>
  );
}

export default function RecurringIncome() {
  const { recurringIncomes, addRecurringIncome, removeRecurringIncome } = useMoneyStore();
  const [open, setOpen] = useState(false);
  const [logTarget, setLogTarget] = useState<RecurringIncomeType | null>(null);
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
              <button onClick={() => setLogTarget(i)} title="Log income" className="text-surface-500 transition-colors hover:text-accent-400">
                <ReceiptText size={14} />
              </button>
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

      <LogIncomeDrawer income={logTarget} onClose={() => setLogTarget(null)} />
    </Card>
  );
}
