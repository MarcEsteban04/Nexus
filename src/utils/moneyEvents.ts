import { Bill, Debt, RecurringIncome, Subscription } from '@/types';
import { advanceDate } from '@/utils/money';
import { formatDateKey } from '@/utils/calendar';

export type MoneySource = 'bill' | 'subscription' | 'debt' | 'income';

export interface MoneyEvent {
  id: string;
  occurrenceKey: string;
  title: string;
  date: string;
  source: MoneySource;
}

function dateForDay(base: Date, day: number): Date {
  const lastDayOfMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  return new Date(base.getFullYear(), base.getMonth(), Math.min(Math.max(day, 1), lastDayOfMonth));
}

interface MoneySlice {
  bills: Bill[];
  subscriptions: Subscription[];
  debts: Debt[];
  recurringIncomes: RecurringIncome[];
}

export function getMoneyEvents(money: MoneySlice, rangeStart: Date, rangeEnd: Date): MoneyEvent[] {
  const events: MoneyEvent[] = [];

  for (const b of money.bills) {
    if (b.paid) continue;
    let cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
    let guard = 0;
    while (cursor <= rangeEnd && guard < 36) {
      const occ = dateForDay(cursor, b.dueDay);
      if (occ >= rangeStart && occ <= rangeEnd) {
        events.push({ id: b.id, occurrenceKey: `bill-${b.id}-${formatDateKey(occ)}`, title: `${b.name} due`, date: formatDateKey(occ), source: 'bill' });
      }
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      guard++;
    }
  }

  for (const d of money.debts) {
    let cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
    let guard = 0;
    while (cursor <= rangeEnd && guard < 36) {
      const occ = dateForDay(cursor, d.dueDay);
      if (occ >= rangeStart && occ <= rangeEnd) {
        events.push({ id: d.id, occurrenceKey: `debt-${d.id}-${formatDateKey(occ)}`, title: `${d.name} payment due`, date: formatDateKey(occ), source: 'debt' });
      }
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      guard++;
    }
  }

  for (const s of money.subscriptions) {
    let occDate = s.nextBillingDate;
    let guard = 0;
    while (occDate && guard < 60) {
      const occ = new Date(occDate);
      if (occ > rangeEnd) break;
      if (occ >= rangeStart) {
        events.push({ id: s.id, occurrenceKey: `sub-${s.id}-${occDate}`, title: `${s.name} renews`, date: occDate, source: 'subscription' });
      }
      occDate = advanceDate(occDate, s.cycle);
      guard++;
    }
  }

  for (const i of money.recurringIncomes) {
    let guard = 0;
    if (i.frequency === 'semimonthly') {
      if (i.payDay1 == null || i.payDay2 == null) continue;
      let cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
      while (cursor <= rangeEnd && guard < 36) {
        for (const day of [i.payDay1, i.payDay2]) {
          const occ = dateForDay(cursor, day);
          if (occ >= rangeStart && occ <= rangeEnd) {
            events.push({
              id: i.id,
              occurrenceKey: `income-${i.id}-${formatDateKey(occ)}`,
              title: `${i.name} payday`,
              date: formatDateKey(occ),
              source: 'income',
            });
          }
        }
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        guard++;
      }
    } else {
      let occDate = i.nextDate;
      while (occDate && guard < 60) {
        const occ = new Date(occDate);
        if (occ > rangeEnd) break;
        if (occ >= rangeStart) {
          events.push({ id: i.id, occurrenceKey: `income-${i.id}-${occDate}`, title: `${i.name} payday`, date: occDate, source: 'income' });
        }
        occDate = advanceDate(occDate, i.frequency);
        guard++;
      }
    }
  }

  return events;
}
