import { CalendarEvent, EventRecurrence } from '@/types';

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const start = new Date(firstOfMonth);
  start.setDate(start.getDate() - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export interface CategoryPalette {
  dot: string;
  badge: string;
  border: string;
}

const CATEGORY_PALETTES: CategoryPalette[] = [
  { dot: 'bg-accent-400', badge: 'bg-accent-500/15 text-accent-300', border: 'border-accent-500/40' },
  { dot: 'bg-sky-400', badge: 'bg-sky-500/15 text-sky-300', border: 'border-sky-500/40' },
  { dot: 'bg-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300', border: 'border-emerald-500/40' },
  { dot: 'bg-violet-400', badge: 'bg-violet-500/15 text-violet-300', border: 'border-violet-500/40' },
  { dot: 'bg-amber-400', badge: 'bg-amber-500/15 text-amber-300', border: 'border-amber-500/40' },
  { dot: 'bg-rose-400', badge: 'bg-rose-500/15 text-rose-300', border: 'border-rose-500/40' },
  { dot: 'bg-cyan-400', badge: 'bg-cyan-500/15 text-cyan-300', border: 'border-cyan-500/40' },
];

const DEFAULT_PALETTE: CategoryPalette = {
  dot: 'bg-surface-500',
  badge: 'bg-surface-700 text-surface-400',
  border: 'border-surface-700',
};

export function categoryPalette(category: string): CategoryPalette {
  if (!category.trim()) return DEFAULT_PALETTE;
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  return CATEGORY_PALETTES[hash % CATEGORY_PALETTES.length];
}

export function formatFriendlyDate(dateKey: string): string {
  const today = new Date();
  const todayKey = formatDateKey(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = formatDateKey(tomorrow);

  if (dateKey === todayKey) return 'Today';
  if (dateKey === tomorrowKey) return 'Tomorrow';

  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const sameYear = date.getFullYear() === today.getFullYear();
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  });
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function stepByRecurrence(date: Date, recurrence: EventRecurrence): Date {
  const d = new Date(date);
  switch (recurrence) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      // Unrecognized/missing recurrence — advance by a day so callers never spin on a fixed date.
      d.setDate(d.getDate() + 1);
      break;
  }
  return d;
}

export interface EventOccurrence extends CalendarEvent {
  occurrenceKey: string;
  occurrenceDate: string;
}

export function expandRecurringEvents(events: CalendarEvent[], rangeStart: Date, rangeEnd: Date): EventOccurrence[] {
  const start = startOfDay(rangeStart);
  const end = endOfDay(rangeEnd);
  const result: EventOccurrence[] = [];

  for (const ev of events) {
    const recurrence: EventRecurrence = ev.recurrence ?? 'none';
    const [y, m, d] = ev.date.split('-').map(Number);
    let occ = new Date(y, m - 1, d);

    if (recurrence === 'none') {
      if (occ >= start && occ <= end) {
        result.push({ ...ev, recurrence, occurrenceKey: ev.id, occurrenceDate: formatDateKey(occ) });
      }
      continue;
    }

    let guard = 0;
    while (occ < start && guard < 2000) {
      occ = stepByRecurrence(occ, recurrence);
      guard++;
    }
    guard = 0;
    while (occ <= end && guard < 2000) {
      result.push({ ...ev, recurrence, occurrenceKey: `${ev.id}-${formatDateKey(occ)}`, occurrenceDate: formatDateKey(occ) });
      occ = stepByRecurrence(occ, recurrence);
      guard++;
    }
  }

  return result;
}
