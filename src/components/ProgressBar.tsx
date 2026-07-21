export default function ProgressBar({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'positive' }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-800">
      <div
        className={`h-full rounded-full ${tone === 'positive' ? 'bg-emerald-500' : 'bg-accent-gradient'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
