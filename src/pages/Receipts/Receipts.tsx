import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { Receipt as ReceiptIcon, Search, ShieldAlert, Wallet2, Plus, X, ImagePlus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import StatCard from '@/components/StatCard';
import EmptyState from '@/components/EmptyState';
import { inputClass, buttonIconPrimaryClass, buttonSecondaryClass, buttonGhostIconClass } from '@/components/ui';
import { useReceiptStore } from '@/store/receiptStore';
import { formatCurrency } from '@/utils/money';

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
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2">
      <input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Product" className={`min-w-0 flex-1 basis-32 ${inputClass}`} />
      <input value={store} onChange={(e) => setStore(e.target.value)} placeholder="Store" className={`w-32 ${inputClass}`} />
      <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" type="number" className={`w-28 ${inputClass}`} />
      <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className={`w-28 ${inputClass}`} />
      <label className="flex flex-col gap-1 text-[11px] text-surface-500">
        Purchase date
        <input value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} type="date" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-[11px] text-surface-500">
        Warranty expiry
        <input value={warrantyExpiry} onChange={(e) => setWarrantyExpiry(e.target.value)} type="date" className={inputClass} />
      </label>
      <label className={`${buttonSecondaryClass} cursor-pointer`}>
        <ImagePlus size={13} /> {imageDataUrl ? 'Photo added' : 'Add photo'}
        <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </label>
      <button type="submit" title="Add receipt" className={buttonIconPrimaryClass}>
        <Plus size={16} />
      </button>
    </form>
  );
}

export default function Receipts() {
  const { receipts, removeReceipt } = useReceiptStore();
  const [query, setQuery] = useState('');

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
      <PageHeader title="Receipt Vault" subtitle="Never lose a receipt again." />
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

        <Card className="mb-4">
          <h3 className="mb-3 text-[13px] font-semibold text-surface-100">Add receipt</h3>
          <AddReceiptForm />
        </Card>

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
          <EmptyState icon={ReceiptIcon} label="No receipts match. Add one above." />
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
