import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export default function Select({
  value,
  onChange,
  options,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-surface-800 bg-surface-850 px-3 py-2 text-[13px] text-surface-100 outline-none transition-colors focus:border-accent-500/60 focus:ring-2 focus:ring-accent-500/20"
      >
        <span className="truncate">{selected?.label ?? 'Select'}</span>
        <ChevronDown size={14} className={`shrink-0 text-surface-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-surface-800 bg-surface-900 p-1 shadow-card"
          >
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] transition-colors ${
                  o.value === value ? 'bg-surface-800 text-accent-400' : 'text-surface-300 hover:bg-surface-800/70 hover:text-surface-100'
                }`}
              >
                <span className="truncate">{o.label}</span>
                {o.value === value && <Check size={13} className="shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
