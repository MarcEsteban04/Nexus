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
  monthly: 1,
  yearly: 1 / 12,
};

export function toMonthlyFromFrequency(amount: number, frequency: IncomeFrequency): number {
  return amount * FREQUENCY_TO_MONTHLY[frequency];
}

export function advanceDate(dateStr: string, unit: BillingCycle | IncomeFrequency): string {
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
