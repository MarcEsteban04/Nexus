import { LucideIcon } from 'lucide-react';

export default function EmptyState({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-800 text-surface-500">
        <Icon size={16} />
      </div>
      <p className="text-[13px] text-surface-500">{label}</p>
    </div>
  );
}
