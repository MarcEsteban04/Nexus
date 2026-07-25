import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { Receipt as ReceiptIcon, Search, ShieldAlert, Wallet2, Plus, X, ImagePlus, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Drawer from '@/components/Drawer';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import Select from '@/components/Select';
import { inputClass, buttonPrimaryClass, buttonSecondaryClass, buttonGhostIconClass } from '@/components/ui';
import { useReceiptStore } from '@/store/receiptStore';
import { useMoneyStore } from '@/store/moneyStore';
import { formatCurrency } from '@/utils/money';
import { Receipt } from '@/types';

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function AddReceiptForm() {
  const { addReceipt } = useReceiptStore();
  const [store, setStore] = useState('');
  const [product, setProduct] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(String(reader.result ?? ''));
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!product || !amount) return;
    addReceipt({
      store,
      product,
      amount: parseFloat(amount) || 0,
      category,
      purchaseDate: purchaseDate || new Date().toISOString().slice(0, 10),
      warrantyExpiry,
      notes: '',
      imageDataUrl,
      transactionId: null,
    });
    setStore('');
    setProduct('');
    setAmount('');
    setCategory('');
    setPurchaseDate('');
    setWarrantyExpiry('');
    setImageDataUrl(null);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Product" className={`w-full ${inputClass}`} />
      <input value={store} onChange={(e) => setStore(e.target.value)} placeholder="Store" className={`w-full ${inputClass}`} />
      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" type="number" className={`w-full ${inputClass}`} />
      <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className={`w-full ${inputClass}`} />
      <label className="block text-[11px] text-surface-500">
        Purchase date
        <input value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} type="date" className={`mt-1 w-full ${inputClass}`} />
      </label>
      <label className="block text-[11px] text-surface-500">
        Warranty expiry
        <input value={warrantyExpiry} onChange={(e) => setWarrantyExpiry(e.target.value)} type="date" className={`mt-1 w-full ${inputClass}`} />
      </label>
      <label className={`w-full cursor-pointer ${buttonSecondaryClass}`}>
        <ImagePlus size={13} /> {imageDataUrl ? 'Photo added' : 'Add photo'}
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </label>
      <button type="submit" className={`w-full ${buttonPrimaryClass}`}>
        <Plus size={14} /> Add receipt
      </button>
    </form>
  );
}

function ConvertToTransactionDrawer({ receipt, onClose }: { receipt: Receipt | null; onClose: () => void }) {
  const { accounts, addTransaction } = useMoneyStore();
  const { linkTransaction } = useReceiptStore();
  const [accountId, setAccountId] = useState('');

  function confirm() {
    if (!receipt || !accountId) return;
    const txId = addTransaction({
      type: 'expense',
      amount: receipt.amount,
      category: receipt.category || receipt.store || 'Uncategorized',
      note: receipt.product,
      date: receipt.purchaseDate,
      accountId,
      receiptId: receipt.id,
    });
    linkTransaction(receipt.id, txId);
    setAccountId('');
    onClose();
  }

  return (
    <Drawer open={!!receipt} onClose={onClose} title="Convert to transaction">
      {receipt && (
        <div className="space-y-3">
          <div className="rounded-xl border border-surface-800 p-3 text-[13px]">
            <p className="font-medium text-surface-100">{receipt.product}</p>
            <p className="text-surface-500">{receipt.store}</p>
            <p className="mt-1 font-semibold text-rose-400">-{formatCurrency(receipt.amount)}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-surface-400">
              Deduct from account
            </label>
            {accounts.length === 0 ? (
              <p className="text-[12px] text-surface-500">
                No accounts yet — add one in Money Manager → Accounts first.
              </p>
            ) : (
              <Select
                value={accountId}
                onChange={setAccountId}
                options={accounts.map((a) => ({ value: a.id, label: `${a.name} (${formatCurrency(a.balance)})` }))}
                className="w-full"
              />
            )}
          </div>
          <button onClick={confirm} disabled={!accountId} className={`w-full ${buttonPrimaryClass}`}>
            <ArrowLeftRight size={14} /> Create transaction
          </button>
        </div>
      )}
    </Drawer>
  );
}

export default function Receipts() {
  const { receipts, removeReceipt } = useReceiptStore();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [convertTarget, setConvertTarget] = useState<Receipt | null>(null);

  const now = new Date();
  const totalSpentThisMonth = receipts
    .filter((r) => {
      const d = new Date(r.purchaseDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((a, r) => a + r.amount, 0);

  const expiringSoon = receipts.filter((r) => {
    const d = daysUntil(r.warrantyExpiry);
    return d !== null && d >= 0 && d <= 30;
  });

  const filtered = useMemo(() => {
    if (!query.trim()) return receipts;
    const q = query.toLowerCase();
    return receipts.filter((r) => r.product.toLowerCase().includes(q) || r.store.toLowerCase().includes(q));
  }, [receipts, query]);

  return (
    <div>
      <PageHeader
        title="Receipt Vault"
        subtitle="Never lose a receipt again."
        actions={
          <button onClick={() => setOpen(true)} className={buttonPrimaryClass}>
            <Plus size={14} /> Add receipt
          </button>
        }
      />
      <div className="p-8">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Receipts saved" value={String(receipts.length)} icon={ReceiptIcon} />
          <StatCard label="Spent this month" value={formatCurrency(totalSpentThisMonth)} icon={Wallet2} />
          <StatCard
            label="Warranty expiring soon"
            value={String(expiringSoon.length)}
            icon={ShieldAlert}
            tone={expiringSoon.length ? 'negative' : 'default'}
          />
        </div>

        <div className="relative mb-4">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product or store…"
            className={`w-full pl-9 ${inputClass}`}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={ReceiptIcon} label="No receipts match. Click Add receipt above." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => {
              const expiry = daysUntil(r.warrantyExpiry);
              return (
                <div key={r.id} className="overflow-hidden rounded-xl border border-surface-800">
                  {r.imageDataUrl && <img src={r.imageDataUrl} alt="" className="h-32 w-full object-cover" />}
                  <div className="p-3">
                    <div className="mb-1 flex items-start justify-between">
                      <div>
                        <p className="text-[13px] font-semibold text-surface-100">{r.product}</p>
                        <p className="text-[11px] text-surface-500">
                          {r.store} {r.category && `· ${r.category}`}
                        </p>
                      </div>
                      <button onClick={() => removeReceipt(r.id)} className={buttonGhostIconClass}>
                        <X size={14} />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[12px]">
                      <span className="font-medium text-surface-200">{formatCurrency(r.amount)}</span>
                      <span className="text-surface-500">{r.purchaseDate}</span>
                    </div>
                    {r.warrantyExpiry && (
                      <p className={`mt-1 text-[11px] ${expiry !== null && expiry <= 30 ? 'text-rose-400' : 'text-surface-500'}`}>
                        Warranty until {r.warrantyExpiry}
                      </p>
                    )}
                    {r.transactionId ? (
                      <p className="mt-2 flex items-center gap-1 text-[11px] text-emerald-400">
                        <CheckCircle2 size={12} /> Linked to a transaction
                      </p>
                    ) : (
                      <button
                        onClick={() => setConvertTarget(r)}
                        className={`mt-2 w-full ${buttonSecondaryClass}`}
                      >
                        <ArrowLeftRight size={13} /> Convert to transaction
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Drawer open={open} onClose={() => setOpen(false)} title="Add receipt">
        <AddReceiptForm />
      </Drawer>

      <ConvertToTransactionDrawer receipt={convertTarget} onClose={() => setConvertTarget(null)} />
    </div>
  );
}
