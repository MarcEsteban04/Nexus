import { ReactNode } from 'react';

export default function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between border-b border-surface-800/70 px-8 py-6">
      <div>
        <h2 className="text-[22px] font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-[13px] text-surface-300">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
