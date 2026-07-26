import { useEffect } from 'react';
import { useMoneyStore } from '@/store/moneyStore';
import { formatDateKey } from '@/utils/calendar';

const STORAGE_KEY = 'nexus:last-daily-notification';

/** Once per day, fires a single OS notification summarizing bills/subscriptions due soon. */
export function useDailyReminders() {
  const { bills, subscriptions } = useMoneyStore();

  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') Notification.requestPermission();

    const todayKey = formatDateKey(new Date());
    if (localStorage.getItem(STORAGE_KEY) === todayKey) return;

    const today = new Date();
    const dueSoonBills = bills.filter((b) => {
      if (b.paid) return false;
      const day = today.getDate();
      const daysUntilDue = b.dueDay >= day ? b.dueDay - day : 999;
      return daysUntilDue <= 3;
    });

    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 3);
    const weekEndKey = formatDateKey(weekEnd);
    const dueSoonSubs = subscriptions.filter((s) => s.nextBillingDate >= todayKey && s.nextBillingDate <= weekEndKey);

    localStorage.setItem(STORAGE_KEY, todayKey);

    if (Notification.permission !== 'granted') return;
    if (dueSoonBills.length === 0 && dueSoonSubs.length === 0) return;

    const parts: string[] = [];
    if (dueSoonBills.length) parts.push(`Bills due: ${dueSoonBills.map((b) => b.name).join(', ')}`);
    if (dueSoonSubs.length) parts.push(`Renewing soon: ${dueSoonSubs.map((s) => s.name).join(', ')}`);
    new Notification('Nexus — heads up', { body: parts.join('\n') });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
