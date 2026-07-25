import { FormEvent, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Plus, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Drawer from '@/components/Drawer';
import EmptyState from '@/components/EmptyState';
import { inputClass, buttonPrimaryClass, buttonSecondaryClass, buttonGhostIconClass } from '@/components/ui';
import { useCalendarStore } from '@/store/calendarStore';
import { formatDateKey, getMonthGrid } from '@/utils/calendar';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function AddEventForm({ date }: { date: string }) {
  const { addEvent } = useCalendarStore();
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title) return;
    addEvent({ title, date, time, category, notes: '' });
    setTitle('');
    setTime('');
    setCategory('');
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className={`w-full ${inputClass}`} />
      <input value={time} onChange={(e) => setTime(e.target.value)} type="time" className={`w-full ${inputClass}`} />
      <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className={`w-full ${inputClass}`} />
      <button type="submit" className={`w-full ${buttonPrimaryClass}`}>
        <Plus size={14} /> Add event
      </button>
    </form>
  );
}

export default function Calendar() {
  const { events, removeEvent } = useCalendarStore();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(formatDateKey(today));
  const [addOpen, setAddOpen] = useState(false);

  const grid = useMemo(() => getMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const todayKey = formatDateKey(today);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const ev of events) {
      const list = map.get(ev.date) ?? [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return map;
  }, [events]);

  const selectedEvents = (eventsByDate.get(selected) ?? []).sort((a, b) => a.time.localeCompare(b.time));

  const upcoming = [...events]
    .filter((e) => e.date >= todayKey)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 5);

  return (
    <div>
      <PageHeader title="Calendar" subtitle="Plan your days." />
      <div className="p-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-surface-100">
                {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                  className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-800 hover:text-surface-100"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
                  className={buttonSecondaryClass}
                >
                  Today
                </button>
                <button
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                  className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-800 hover:text-surface-100"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium uppercase tracking-wider text-surface-500">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-1.5">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((date) => {
                const key = formatDateKey(date);
                const inMonth = date.getMonth() === cursor.getMonth();
                const isToday = key === todayKey;
                const isSelected = key === selected;
                const dayEvents = eventsByDate.get(key) ?? [];
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(key)}
                    className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-[13px] transition-colors ${
                      isSelected
                        ? 'bg-accent-gradient text-white shadow-glow'
                        : inMonth
                          ? 'text-surface-200 hover:bg-surface-800'
                          : 'text-surface-600 hover:bg-surface-800/50'
                    } ${isToday && !isSelected ? 'ring-1 ring-accent-500/60' : ''}`}
                  >
                    <span>{date.getDate()}</span>
                    {dayEvents.length > 0 && (
                      <span className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-accent-400'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-surface-100">{selected}</h3>
                <button onClick={() => setAddOpen(true)} className={buttonPrimaryClass}>
                  <Plus size={13} /> Add event
                </button>
              </div>
              <div className="space-y-1">
                {selectedEvents.length === 0 ? (
                  <p className="text-[12px] text-surface-500">No events this day.</p>
                ) : (
                  selectedEvents.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface-800/50">
                      <div className="text-[13px] text-surface-200">
                        {ev.time && <span className="mr-2 text-surface-500">{ev.time}</span>}
                        {ev.title}
                        {ev.category && <span className="ml-2 text-[11px] text-surface-500">{ev.category}</span>}
                      </div>
                      <button onClick={() => removeEvent(ev.id)} className={buttonGhostIconClass}>
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <h3 className="mb-3 text-[13px] font-semibold text-surface-100">Upcoming</h3>
              {upcoming.length === 0 ? (
                <EmptyState icon={CalendarDays} label="Nothing upcoming." />
              ) : (
                <div className="space-y-1">
                  {upcoming.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between text-[13px]">
                      <span className="text-surface-200">{ev.title}</span>
                      <span className="text-surface-500">{ev.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <Drawer open={addOpen} onClose={() => setAddOpen(false)} title="Add event" subtitle={selected}>
        <AddEventForm date={selected} />
      </Drawer>
    </div>
  );
}
