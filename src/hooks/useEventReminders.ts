import { useEffect, useRef } from 'react';
import { useCalendarStore } from '@/store/calendarStore';
import { expandRecurringEvents } from '@/utils/calendar';

export function useEventReminders() {
  const events = useCalendarStore((s) => s.events);
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    function check() {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getFullYear(), todayStart.getMonth(), todayStart.getDate(), 23, 59, 59, 999);
      const occurrences = expandRecurringEvents(events, todayStart, todayEnd);

      for (const ev of occurrences) {
        if (ev.reminderMinutes == null || !ev.time) continue;
        const [y, m, d] = ev.occurrenceDate.split('-').map(Number);
        const [h, min] = ev.time.split(':').map(Number);
        const eventTime = new Date(y, m - 1, d, h, min);
        const fireTime = new Date(eventTime.getTime() - ev.reminderMinutes * 60000);
        const key = `${ev.occurrenceKey}`;
        if (now >= fireTime && now <= eventTime && !firedRef.current.has(key)) {
          firedRef.current.add(key);
          new Notification(ev.title, {
            body: `Today at ${ev.time}${ev.category ? ` · ${ev.category}` : ''}`,
          });
        }
      }
    }

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [events]);
}
