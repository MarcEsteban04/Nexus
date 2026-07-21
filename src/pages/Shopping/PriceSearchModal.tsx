import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Star, ExternalLink, Plus, Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import Select from '@/components/Select';
import { inputClass, buttonPrimaryClass } from '@/components/ui';
import { ProductSearchResult } from '@/types';

type SortMode = 'price' | 'rating';

const LOADING_MESSAGES = [
  'Finding the best item…',
  'Finding the cheapest option…',
  'Checking ratings and reviews…',
  'Comparing prices across stores…',
  'Almost there…',
];

function SearchLoading() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % LOADING_MESSAGES.length), 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <Loader2 size={28} className="animate-spin text-accent-400" />
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="text-[13px] text-surface-400"
        >
          {LOADING_MESSAGES[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export default function PriceSearchModal({
  open,
  onClose,
  initialQuery = '',
  onAddToWishlist,
}: {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
  onAddToWishlist: (result: ProductSearchResult) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('price');

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setResults([]);
      setError(null);
    }
  }, [open, initialQuery]);

  async function runSearch() {
    if (!window.nexus) {
      setError('This search only works inside the Nexus desktop app.');
      return;
    }
    if (!query.trim()) {
      setError('Enter a product to search for.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    const res = await window.nexus.searchProductPrices(query);

    setLoading(false);
    setResults(res.results);
    setError(res.error);
  }

  const sortedResults = useMemo(() => {
    const list = [...results];
    if (sortMode === 'price') {
      list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    } else {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviews ?? 0) - (a.reviews ?? 0));
    }
    return list;
  }, [results, sortMode]);

  return (
    <Modal open={open} onClose={onClose} title="Find best price" width="max-w-3xl">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runSearch()}
          placeholder="What are you shopping for?"
          className={`min-w-0 flex-1 basis-48 ${inputClass}`}
        />
        <Select
          value={sortMode}
          onChange={(v) => setSortMode(v as SortMode)}
          options={[
            { value: 'price', label: 'Cheapest first' },
            { value: 'rating', label: 'Best rated first' },
          ]}
          className="w-40"
        />
        <button onClick={runSearch} disabled={loading} className={buttonPrimaryClass}>
          <Search size={14} /> Search
        </button>
      </div>

      {loading && <SearchLoading />}

      {!loading && error && <p className="mb-3 text-[12px] text-rose-400">{error}</p>}

      {!loading && sortedResults.length === 0 && !error && (
        <p className="text-[13px] text-surface-500">Search a product to compare prices and ratings across stores.</p>
      )}

      {!loading && (
        <div className="space-y-2">
          {sortedResults.map((r, i) => (
            <div key={`${r.link}-${i}`} className="flex items-center gap-3 rounded-xl border border-surface-800 p-3">
              {r.thumbnail ? (
                <img src={r.thumbnail} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="h-14 w-14 shrink-0 rounded-lg bg-surface-800" />
              )}
              <div className="min-w-0 flex-1">
                <a
                  href={r.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 truncate text-[13px] font-medium text-surface-100 hover:underline"
                >
                  <span className="truncate">{r.title}</span>
                  <ExternalLink size={11} className="shrink-0 text-surface-500" />
                </a>
                <div className="mt-0.5 flex items-center gap-2 text-[12px] text-surface-400">
                  <span>{r.source}</span>
                  {r.rating != null && (
                    <span className="flex items-center gap-0.5 text-amber-400">
                      <Star size={11} className="fill-amber-400" />
                      {r.rating.toFixed(1)}
                      {r.reviews != null && <span className="text-surface-500">({r.reviews})</span>}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-[14px] font-semibold text-surface-100">{r.priceDisplay ?? '—'}</span>
                <button onClick={() => onAddToWishlist(r)} title="Add to wishlist" className={buttonPrimaryClass}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
