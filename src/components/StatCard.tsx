import { LucideIcon } from 'lucide-react';
import Card from './Card';

export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: 'default' | 'positive' | 'negative';
}) {
  const toneClasses = {
    default: 'text-surface-100',
    positive: 'text-emerald-400',
    negative: 'text-rose-400',
  }[tone];

  const iconToneClasses = {
    default: 'bg-accent-500/15 text-accent-400',
    positive: 'bg-emerald-500/15 text-emerald-400',
    negative: 'bg-rose-500/15 text-rose-400',
  }[tone];

  return (
    <Card hover className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-surface-400">{label}</p>
        <p className={`mt-2 text-[26px] font-semibold tracking-tight ${toneClasses}`}>{value}</p>
      </div>
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconToneClasses}`}>
        <Icon size={17} strokeWidth={2} />
      </div>
    </Card>
  );
}
