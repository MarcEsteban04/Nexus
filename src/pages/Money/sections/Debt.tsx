import { ChangeEvent, FormEvent, useState } from 'react';
import { CreditCard, Plus, X, ImagePlus, CheckCircle2 } from 'lucide-react';
import Card from '@/components/Card';
import Drawer from '@/components/Drawer';
import EmptyState from '@/components/EmptyState';
import ProgressBar from '@/components/ProgressBar';
import Select from '@/components/Select';
import { inputClass, buttonPrimaryClass, buttonSecondaryClass, buttonGhostIconClass } from '@/components/ui';
import { useMoneyStore } from '@/store/moneyStore';
import { useLinkedTransaction } from '@/hooks/useLinkedTransaction';
import { formatCurrency } from '@/utils/money';
import { Debt as DebtType } from '@/types';

function LogPaymentDrawer({ debt, onClose }: { debt: DebtType | null; onClose: () => void }) {
  const { accounts, lastAccountId, makeDebtPayment } = useMoneyStore();
  const createLinkedTransaction = useLinkedTransaction();
  const [amount, setAmount] = useState('');
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
    const value = parseFloat(amount);
    if (!debt || !value || !accountId) return;
    createLinkedTransaction({
      type: 'expense',
      amount: value,
      category: debt.name,
      note: `Debt payment — ${debt.name}`,
      date: new Date().toISOString().slice(0, 10),
      accountId,
      receiptImage,
    });
    makeDebtPayment(debt.id, value);
    setAmount('');
    setReceiptImage(null);
    onClose();
  }

  return (
    <Drawer open={!!debt} onClose={onClose} title="Log a payment">
      {debt && (
        <div className="space-y-3">
          <div className="rounded-xl border border-surface-800 p-3 text-[13px]">
            <p className="font-medium text-surface-100">{debt.name}</p>
            <p className="text-surface-500">{formatCurrency(debt.remainingAmount)} remaining</p>
          </div>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Payment amount" type="number" className={`w-full ${inputClass}`} />
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-surface-400">
              Pay from account
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
            <ImagePlus size={13} /> {receiptImage ? 'Receipt attached' : 'Attach receipt (optional)'}
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
          {receiptImage && <img src={receiptImage} alt="" className="h-24 w-full rounded-lg object-cover" />}
          <button onClick={confirm} disabled={!accountId || !parseFloat(amount || '0')} className={`w-full ${buttonPrimaryClass}`}>
            <CheckCircle2 size={14} /> Log payment
          </button>
        </div>
      )}
    </Drawer>
  );
}

export default function Debt() {
  const { debts, addDebt, removeDebt } = useMoneyStore();
  const [open, setOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<DebtType | null>(null);
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minPayment, setMinPayment] = useState('');
  const [dueDay, setDueDay] = useState('1');

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
            <button onClick={() => setPayTarget(d)} className={`mt-3 w-full ${buttonSecondaryClass}`}>
              <Plus size={13} /> Log payment
            </button>
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

      <LogPaymentDrawer debt={payTarget} onClose={() => setPayTarget(null)} />
    </Card>
  );
}
