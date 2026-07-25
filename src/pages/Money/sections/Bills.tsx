import { ChangeEvent, FormEvent, useState } from 'react';
import { Plus, Receipt, X, ImagePlus, CheckCircle2 } from 'lucide-react';
import Card from '@/components/Card';
import Drawer from '@/components/Drawer';
import EmptyState from '@/components/EmptyState';
import Select from '@/components/Select';
import { inputClass, buttonPrimaryClass, buttonSecondaryClass, buttonGhostIconClass } from '@/components/ui';
import { useMoneyStore } from '@/store/moneyStore';
import { useLinkedTransaction } from '@/hooks/useLinkedTransaction';
import { formatCurrency } from '@/utils/money';
import { Bill } from '@/types';

function PayBillDrawer({ bill, onClose }: { bill: Bill | null; onClose: () => void }) {
  const { accounts, lastAccountId, markBillPaid } = useMoneyStore();
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
    if (!bill || !accountId) return;
    const txId = createLinkedTransaction({
      type: 'expense',
      amount: bill.amount,
      category: bill.name,
      note: `Bill payment — ${bill.name}`,
      date: new Date().toISOString().slice(0, 10),
      accountId,
      receiptImage,
    });
    markBillPaid(bill.id, txId);
    setReceiptImage(null);
    onClose();
  }

  return (
    <Drawer open={!!bill} onClose={onClose} title="Pay bill">
      {bill && (
        <div className="space-y-3">
          <div className="rounded-xl border border-surface-800 p-3 text-[13px]">
            <p className="font-medium text-surface-100">{bill.name}</p>
            <p className="mt-1 font-semibold text-rose-400">-{formatCurrency(bill.amount)}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-surface-400">
              Deduct from account
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
          <button onClick={confirm} disabled={!accountId} className={`w-full ${buttonPrimaryClass}`}>
            <CheckCircle2 size={14} /> Mark as paid
          </button>
        </div>
      )}
    </Drawer>
  );
}

export default function Bills() {
  const { bills, addBill, removeBill, markBillUnpaid, removeTransaction } = useMoneyStore();
  const [open, setOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<Bill | null>(null);
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

  function toggleCheckbox(bill: Bill) {
    if (!bill.paid) {
      setPayTarget(bill);
      return;
    }
    if (bill.paidTransactionId) removeTransaction(bill.paidTransactionId);
    markBillUnpaid(bill.id);
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-surface-100">Bill reminders</h3>
        <button onClick={() => setOpen(true)} className={buttonPrimaryClass}>
          <Plus size={14} /> Add
        </button>
      </div>
      <ul className="space-y-1 text-[13px]">
        {bills.length === 0 && <EmptyState icon={Receipt} label="No bills yet — add one above." />}
        {bills.map((b) => (
          <li key={b.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface-800/50">
            <label className="flex items-center gap-2.5">
              <input type="checkbox" checked={b.paid} onChange={() => toggleCheckbox(b)} className="accent-accent-500" />
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

      <Drawer open={open} onClose={() => setOpen(false)} title="Add bill">
        <form onSubmit={submit} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bill name" className={`w-full ${inputClass}`} />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" type="number" className={`w-full ${inputClass}`} />
          <input value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="Due day" type="number" min={1} max={31} className={`w-full ${inputClass}`} />
          <button type="submit" className={`w-full ${buttonPrimaryClass}`}>
            <Plus size={14} /> Add bill
          </button>
        </form>
      </Drawer>

      <PayBillDrawer bill={payTarget} onClose={() => setPayTarget(null)} />
    </Card>
  );
}
