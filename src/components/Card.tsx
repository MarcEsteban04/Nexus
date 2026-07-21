import { ReactNode } from 'react';

export default function Card({
  children,
  className = '',
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-surface-800/80 bg-surface-900/70 p-5 shadow-card backdrop-blur-sm transition-all ${
        hover ? 'hover:-translate-y-0.5 hover:border-surface-700 hover:shadow-glow' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
