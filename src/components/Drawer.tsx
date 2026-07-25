import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className={`fixed right-0 top-0 z-50 flex h-full w-full ${width} flex-col border-l border-surface-800 bg-surface-900 shadow-card`}
          >
            <div className="flex items-start justify-between border-b border-surface-800 px-5 py-4">
              <div>
                <h3 className="text-[14px] font-semibold text-surface-100">{title}</h3>
                {subtitle && <p className="mt-0.5 text-[12px] text-surface-500">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="text-surface-500 transition-colors hover:text-surface-100">
                <X size={16} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
