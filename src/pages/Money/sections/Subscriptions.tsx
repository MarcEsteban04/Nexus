import { ChangeEvent, FormEvent, useState } from 'react';
import { Plus, Repeat, X, ImagePlus, CheckCircle2, ReceiptText } from 'lucide-react';
import Card from '@/components/Card';
import Drawer from '@/components/Drawer';
import EmptyState from '@/components/EmptyState';
import Select from '@/components/Select';
import { inputClass, buttonPrimaryClass, buttonSecondaryClass, buttonGhostIconClass } from '@/components/ui';
import { useMoneyStore } from '@/store/moneyStore';
import { useLinkedTransaction } from '@/hooks/useLinkedTransaction';
import { formatCurrency, toMonthlyFromCycle, advanceDate } from '@/utils/money';
import { BillingCycle, Subscription } from '@/types';

function LogChargeDrawer({ subscription, onClose }: { subscription: Subscription | null; onClose: () => void }) {
  const { accounts, lastAccountId, updateSubscription } = useMoneyStore();
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
    if (!subscription || !accountId) return;
    createLinkedTransaction({
      type: 'expense',
      amount: subscription.amount,
      category: subscription.category || subscription.name,
      note: `Subscription — ${subscription.name}`,
      date: new Date().toISOString().slice(0, 10),
      accountId,
      receiptImage,
    });
    updateSubscription(subscription.id, { nextBillingDate: advanceDate(subscription.nextBillingDate, subscription.cycle) });
    setReceiptImage(null);
    onClose();
  }

  return (
    <Drawer open={!!subscription} onClose={onClose} title="Log charge">
      {subscription && (
        <div className="space-y-3">
          <div className="rounded-xl border border-surface-800 p-3 text-[13px]">
            <p className="font-medium text-surface-100">{subscription.name}</p>
            <p className="mt-1 font-semibold text-rose-400">-{formatCurrency(subscription.amount)}</p>
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
            <CheckCircle2 size={14} /> Log this charge
          </button>
        </div>
      )}
    </Drawer>
  );
}

export default function Subscriptions() {
  const { subscriptions, addSubscription, removeSubscription } = useMoneyStore();
  const [open, setOpen] = useState(false);
  const [chargeTarget, setChargeTarget] = useState<Subscription | null>(null);
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
              <button onClick={() => setChargeTarget(s)} title="Log charge" className="text-surface-500 transition-colors hover:text-accent-400">
                <ReceiptText size={14} />
              </button>
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

      <LogChargeDrawer subscription={chargeTarget} onClose={() => setChargeTarget(null)} />
    </Card>
  );
}
