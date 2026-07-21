import { FormEvent, useState } from 'react';
import { Heart, ListChecks, Wallet2, CheckCircle2, Plus, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { inputClass, buttonPrimaryClass } from '@/components/ui';
import { useShoppingStore } from '@/store/shoppingStore';
import { WishlistItem } from '@/types';
import { formatCurrency } from '@/utils/money';

const SWATCHES = [
  'from-accent-500 to-accent-300',
  'from-sky-500 to-sky-300',
  'from-emerald-500 to-emerald-300',
  'from-violet-500 to-violet-300',
  'from-amber-500 to-amber-300',
];

function swatchFor(id: string) {
  const sum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return SWATCHES[sum % SWATCHES.length];
}

function ItemCard({ item }: { item: WishlistItem }) {
  const { togglePurchased, removeItem } = useShoppingStore();
  return (
    <div className="group overflow-hidden rounded-2xl border border-surface-800 bg-surface-900 shadow-card transition-all hover:-translate-y-0.5 hover:border-surface-700">
      <div className={`relative flex h-32 items-center justify-center bg-gradient-to-br ${swatchFor(item.id)}`}>
        {item.store && (
          <span className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
            {item.store}
          </span>
        )}
        <button
          onClick={() => removeItem(item.id)}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 group-hover:opacity-100"
        >
          <X size={13} />
        </button>
        <button
          onClick={() => togglePurchased(item.id)}
          className="absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
        >
          <Heart size={14} className={item.purchased ? 'fill-accent-400 text-accent-400' : ''} />
        </button>
        <span className="text-3xl font-bold text-white/90">{item.name.charAt(0).toUpperCase()}</span>
      </div>
      <div className="px-3 py-2.5">
        <p className={`truncate text-[13px] font-semibold ${item.purchased ? 'text-surface-500 line-through' : 'text-surface-100'}`}>
          {item.url ? (
            <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">
              {item.name}
            </a>
          ) : (
            item.name
          )}
        </p>
        {item.price != null && <p className="mt-0.5 text-[12px] text-surface-400">{formatCurrency(item.price)}</p>}
      </div>
    </div>
  );
}

export default function Shopping() {
  const { items, addItem } = useShoppingStore();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [store, setStore] = useState('');
  const [url, setUrl] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name) return;
    addItem({ name, price: price ? parseFloat(price) : undefined, store, url });
    setName('');
    setPrice('');
    setStore('');
    setUrl('');
  }

  const active = items.filter((i) => !i.purchased);
  const purchased = items.filter((i) => i.purchased);
  const budgetTotal = active.reduce((a, i) => a + (i.price || 0), 0);

  return (
    <div>
      <PageHeader title="Shopping Hub" subtitle="Keep track of everything you want to buy." />
      <div className="p-8">
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StatCard label="Wishlist items" value={String(active.length)} icon={ListChecks} />
          <StatCard label="Estimated budget" value={formatCurrency(budgetTotal)} icon={Wallet2} />
          <StatCard label="Purchased" value={String(purchased.length)} icon={CheckCircle2} tone="positive" />
        </div>

        <form
          onSubmit={submit}
          className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-surface-800 bg-surface-900 p-3 shadow-card"
        >
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" className={`flex-1 basis-40 ${inputClass}`} />
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" type="number" className={`w-28 ${inputClass}`} />
          <input value={store} onChange={(e) => setStore(e.target.value)} placeholder="Store" className={`w-32 ${inputClass}`} />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Link (optional)" className={`flex-1 basis-40 ${inputClass}`} />
          <button type="submit" className={buttonPrimaryClass}>
            <Plus size={14} /> Add
          </button>
        </form>

        {items.length === 0 ? (
          <p className="text-[13px] text-surface-400">Your wishlist is empty. Add your first item above.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
