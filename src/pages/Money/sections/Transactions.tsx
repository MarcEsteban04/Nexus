import { ChangeEvent, FormEvent, useState } from 'react';
import { ArrowLeftRight, Download, Plus, X, ScanLine, Loader2, Receipt as ReceiptIcon } from 'lucide-react';
import Card from '@/components/Card';
import Drawer from '@/components/Drawer';
import EmptyState from '@/components/EmptyState';
import Select from '@/components/Select';
import { inputClass, buttonPrimaryClass, buttonSecondaryClass, buttonGhostIconClass } from '@/components/ui';
import { useMoneyStore } from '@/store/moneyStore';
import { useLinkedTransaction } from '@/hooks/useLinkedTransaction';
import { formatCurrency } from '@/utils/money';

function AddTransactionForm({ onDone }: { onDone: () => void }) {
  const { accounts, lastAccountId } = useMoneyStore();
  const createLinkedTransaction = useLinkedTransaction();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState(lastAccountId ?? '');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const dataUrl: string = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.readAsDataURL(file);
    });
    setReceiptImage(dataUrl);

    if (!window.nexus) {
      setScanError('Receipt scanning only works inside the Nexus desktop app.');
      return;
    }
    setScanning(true);
    setScanError(null);
    const res = await window.nexus.scanReceiptImage(dataUrl);
    setScanning(false);
    if (res.error || !res.result) {
      setScanError(res.error ?? "Couldn't read that receipt.");
      return;
    }
    setType('expense');
    if (res.result.amount != null) setAmount(String(res.result.amount));
    setCategory(res.result.category || res.result.store || '');
    setNote(res.result.product || res.result.store || '');
    if (res.result.purchaseDate) setDate(res.result.purchaseDate);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || !category || !accountId) return;

    createLinkedTransaction({ type, amount: value, category, note, date, accountId, receiptImage });

    setAmount('');
    setCategory('');
    setNote('');
    setDate(new Date().toISOString().slice(0, 10));
    setReceiptImage(null);
    setScanError(null);
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className={`flex w-full cursor-pointer items-center justify-center gap-2 ${buttonSecondaryClass}`}>
        {scanning ? <Loader2 size={14} className="animate-spin" /> : <ScanLine size={14} />}
        {scanning ? 'Reading receipt…' : receiptImage ? 'Receipt attached — rescan' : 'Scan a receipt photo'}
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" disabled={scanning} />
      </label>
      {receiptImage && !scanning && <img src={receiptImage} alt="" className="h-24 w-full rounded-lg object-cover" />}
      {scanError && <p className="text-[12px] text-rose-400">{scanError}</p>}

      <Select
        value={type}
        onChange={(v) => setType(v as 'income' | 'expense')}
        options={[
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
        ]}
        className="w-full"
      />
      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" type="number" className={`w-full ${inputClass}`} />
      <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className={`w-full ${inputClass}`} />
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" className={`w-full ${inputClass}`} />
      <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className={`w-full ${inputClass}`} />

      <div>
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-surface-400">
          Account (auto deducts/adds)
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

      <button type="submit" disabled={!accountId} className={`w-full ${buttonPrimaryClass}`}>
        <Plus size={14} /> Add transaction
      </button>
    </form>
  );
}

export default function Transactions() {
  const { transactions, accounts, removeTransaction } = useMoneyStore();
  const [open, setOpen] = useState(false);

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
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className={buttonSecondaryClass}>
            <Download size={13} /> Export CSV
          </button>
          <button onClick={() => setOpen(true)} className={buttonPrimaryClass}>
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
      <ul className="max-h-96 space-y-1 overflow-y-auto text-[13px]">
        {transactions.length === 0 && <EmptyState icon={ArrowLeftRight} label="No transactions yet." />}
        {transactions.map((t) => {
          const account = accounts.find((a) => a.id === t.accountId);
          return (
            <li key={t.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface-800/50">
              <div>
                <span className={t.type === 'income' ? 'font-medium text-emerald-400' : 'font-medium text-rose-400'}>
                  {t.type === 'income' ? '+' : '-'}
                  {formatCurrency(t.amount)}
                </span>{' '}
                <span className="text-surface-400">· {t.category}</span>
                {t.note && <span className="text-surface-500"> — {t.note}</span>}
                {account && <span className="text-surface-500"> · {account.name}</span>}
                {t.receiptId && <ReceiptIcon size={11} className="ml-1 inline text-surface-500" />}
              </div>
              <button onClick={() => removeTransaction(t.id)} className={buttonGhostIconClass}>
                <X size={14} />
              </button>
            </li>
          );
        })}
      </ul>

      <Drawer open={open} onClose={() => setOpen(false)} title="Add transaction">
        <AddTransactionForm onDone={() => setOpen(false)} />
      </Drawer>
    </Card>
  );
}
