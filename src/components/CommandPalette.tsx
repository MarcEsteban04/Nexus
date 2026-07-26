import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { buildDataSearchIndex, STATIC_PAGES, SearchResult } from '@/utils/searchIndex';

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    const timer = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(timer);
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STATIC_PAGES.slice(0, 8);
    const pageMatches = STATIC_PAGES.filter((p) => p.title.toLowerCase().includes(q));
    const dataMatches = buildDataSearchIndex().filter(
      (r) => r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q),
    );
    return [...pageMatches, ...dataMatches].slice(0, 30);
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results.length]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  function select(item: SearchResult) {
    navigate(item.path);
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[activeIndex]) select(results[activeIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-8 pt-24"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-surface-800 bg-surface-900 shadow-card"
          >
            <div className="flex items-center gap-2.5 border-b border-surface-800 px-4 py-3.5">
              <Search size={16} className="shrink-0 text-surface-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search anything, or jump to a page…"
                className="flex-1 bg-transparent text-[14px] text-surface-100 outline-none placeholder:text-surface-500"
              />
              <kbd className="shrink-0 rounded border border-surface-700 px-1.5 py-0.5 text-[10px] text-surface-500">Esc</kbd>
            </div>
            <div ref={listRef} className="max-h-96 overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="p-6 text-center text-[13px] text-surface-500">No results.</p>
              ) : (
                results.map((r, i) => (
                  <button
                    key={r.id}
                    data-index={i}
                    onClick={() => select(r)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors ${
                      i === activeIndex ? 'bg-surface-800 text-surface-100' : 'text-surface-300'
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{r.title}</span>
                    <span className="shrink-0 text-[11px] text-surface-500">{r.subtitle}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
