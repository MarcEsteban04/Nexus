import { BillingCycle, IncomeFrequency } from '@/types';

export function formatCurrency(n: number): string {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

const CYCLE_TO_MONTHLY: Record<BillingCycle, number> = {
  weekly: 52 / 12,
  monthly: 1,
  yearly: 1 / 12,
};

export function toMonthlyFromCycle(amount: number, cycle: BillingCycle): number {
  return amount * CYCLE_TO_MONTHLY[cycle];
}

const FREQUENCY_TO_MONTHLY: Record<IncomeFrequency, number> = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  semimonthly: 2,
  monthly: 1,
  yearly: 1 / 12,
};

export function toMonthlyFromFrequency(amount: number, frequency: IncomeFrequency): number {
  return amount * FREQUENCY_TO_MONTHLY[frequency];
}

export type SimpleRecurrence = BillingCycle | Exclude<IncomeFrequency, 'semimonthly'>;

export function advanceDate(dateStr: string, unit: SimpleRecurrence): string {
  const parsed = dateStr ? new Date(dateStr) : new Date();
  const base = isNaN(parsed.getTime()) ? new Date() : parsed;
  switch (unit) {
    case 'weekly':
      base.setDate(base.getDate() + 7);
      break;
    case 'biweekly':
      base.setDate(base.getDate() + 14);
      break;
    case 'monthly':
      base.setMonth(base.getMonth() + 1);
      break;
    case 'yearly':
      base.setFullYear(base.getFullYear() + 1);
      break;
  }
  return base.toISOString().slice(0, 10);
}

export function advanceSemiMonthly(dateStr: string, payDay1: number, payDay2: number): string {
  const parsed = dateStr ? new Date(dateStr) : new Date();
  const base = isNaN(parsed.getTime()) ? new Date() : parsed;
  const lo = Math.min(payDay1, payDay2);
  const hi = Math.max(payDay1, payDay2);
  const currentDay = base.getDate();
  if (currentDay < hi) {
    return new Date(base.getFullYear(), base.getMonth(), hi).toISOString().slice(0, 10);
  }
  return new Date(base.getFullYear(), base.getMonth() + 1, lo).toISOString().slice(0, 10);
}

export function nextOccurrenceForDay(day: number): string {
  const now = new Date();
  const clampedDay = Math.min(Math.max(day, 1), 31);
  let d = new Date(now.getFullYear(), now.getMonth(), clampedDay);
  if (d < now) d = new Date(now.getFullYear(), now.getMonth() + 1, clampedDay);
  return d.toISOString().slice(0, 10);
}

export function dayOfMonth(dateStr: string): number {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? 1 : d.getDate();
}
