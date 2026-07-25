import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import { buttonSecondaryClass } from './ui';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} width="max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
          <AlertTriangle size={16} />
        </div>
        <p className="text-[13px] text-surface-300">{message}</p>
      </div>
      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={onConfirm}
          className="flex-1 rounded-xl bg-rose-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-rose-400"
        >
          {confirmLabel}
        </button>
        <button onClick={onCancel} className={`flex-1 ${buttonSecondaryClass}`}>
          Cancel
        </button>
      </div>
    </Modal>
  );
}
