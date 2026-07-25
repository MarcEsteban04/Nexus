import { FormEvent, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  Plus,
  X,
  Pencil,
  Receipt,
  Repeat,
  CreditCard,
  Wallet,
  BellRing,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Drawer from '@/components/Drawer';
import EmptyState from '@/components/EmptyState';
import Select from '@/components/Select';
import { inputClass, buttonPrimaryClass, buttonSecondaryClass, buttonGhostIconClass } from '@/components/ui';
import { useCalendarStore } from '@/store/calendarStore';
import { useMoneyStore } from '@/store/moneyStore';
import { categoryPalette, expandRecurringEvents, formatDateKey, formatFriendlyDate, getMonthGrid } from '@/utils/calendar';
import { getMoneyEvents, MoneySource } from '@/utils/moneyEvents';
import { CalendarEvent, EventRecurrence } from '@/types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Repeats daily' },
  { value: 'weekly', label: 'Repeats weekly' },
  { value: 'monthly', label: 'Repeats monthly' },
  { value: 'yearly', label: 'Repeats yearly' },
];

const REMINDER_OPTIONS = [
  { value: 'none', label: 'No reminder' },
  { value: '10', label: '10 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
  { value: '1440', label: '1 day before' },
];

const MONEY_SOURCE_META: Record<MoneySource, { label: string; icon: typeof Receipt; category: string }> = {
  bill: { label: 'Bill', icon: Receipt, category: 'Bill' },
  subscription: { label: 'Subscription', icon: Repeat, category: 'Subscription' },
  debt: { label: 'Debt', icon: CreditCard, category: 'Debt' },
  income: { label: 'Income', icon: Wallet, category: 'Income' },
};

function formatTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function EventForm({ date, initial, onDone }: { date: string; initial?: CalendarEvent; onDone: () => void }) {
  const { addEvent, updateEvent } = useCalendarStore();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [time, setTime] = useState(initial?.time ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [recurrence, setRecurrence] = useState<EventRecurrence>(initial?.recurrence ?? 'none');
  const [reminder, setReminder] = useState(initial?.reminderMinutes != null ? String(initial.reminderMinutes) : 'none');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title) return;
    const reminderMinutes = reminder === 'none' ? null : Number(reminder);
    if (initial) {
      updateEvent(initial.id, { title, time, category, recurrence, reminderMinutes });
    } else {
      addEvent({ title, date, time, category, notes: '', recurrence, reminderMinutes });
    }
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className={`w-full ${inputClass}`} />
      <input value={time} onChange={(e) => setTime(e.target.value)} type="time" className={`w-full ${inputClass}`} />
      <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className={`w-full ${inputClass}`} />
      <Select value={recurrence} onChange={(v) => setRecurrence(v as EventRecurrence)} options={RECURRENCE_OPTIONS} />
      <Select value={reminder} onChange={setReminder} options={REMINDER_OPTIONS} />
      <button type="submit" className={`w-full ${buttonPrimaryClass}`}>
        <Plus size={14} /> {initial ? 'Save changes' : 'Add event'}
      </button>
    </form>
  );
}

interface DisplayItem {
  key: string;
  title: string;
  date: string;
  time: string;
  category: string;
  reminderMinutes: number | null;
  readOnly: boolean;
  source: MoneySource | 'event';
  original?: CalendarEvent;
}

export default function Calendar() {
  const { events, removeEvent } = useCalendarStore();
  const money = useMoneyStore();
  const today = new Date();
  const todayKey = formatDateKey(today);

  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(todayKey);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);

  const grid = useMemo(() => getMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const monthRangeStart = grid[0];
  const monthRangeEnd = grid[grid.length - 1];

  const selectedDate = useMemo(() => {
    const [y, m, d] = selected.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [selected]);

  const weekRange = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }, [selectedDate]);

  function toDisplayItems(occStart: Date, occEnd: Date): DisplayItem[] {
    const real = expandRecurringEvents(events, occStart, occEnd).map((ev) => ({
      key: ev.occurrenceKey,
      title: ev.title,
      date: ev.occurrenceDate,
      time: ev.time,
      category: ev.category,
      reminderMinutes: ev.reminderMinutes,
      readOnly: false,
      source: 'event' as const,
      original: ev,
    }));
    const virtual = getMoneyEvents(money, occStart, occEnd).map((ev) => ({
      key: ev.occurrenceKey,
      title: ev.title,
      date: ev.date,
      time: '',
      category: MONEY_SOURCE_META[ev.source].category,
      reminderMinutes: null,
      readOnly: true,
      source: ev.source,
    }));
    return [...real, ...virtual];
  }

  const monthItems = useMemo(() => toDisplayItems(monthRangeStart, monthRangeEnd), [events, money, monthRangeStart, monthRangeEnd]);

  const viewRange = view === 'month' ? { start: monthRangeStart, end: monthRangeEnd } : view === 'week' ? weekRange : { start: selectedDate, end: selectedDate };
  const viewItems = useMemo(() => toDisplayItems(viewRange.start, viewRange.end), [events, money, viewRange.start, viewRange.end]);

  const upcomingRangeEnd = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 60);
    return d;
  }, []);
  const upcomingItems = useMemo(() => toDisplayItems(today, upcomingRangeEnd), [events, money, upcomingRangeEnd]);

  const eventsByDateMonth = useMemo(() => {
    const map = new Map<string, DisplayItem[]>();
    for (const it of monthItems) {
      const list = map.get(it.date) ?? [];
      list.push(it);
      map.set(it.date, list);
    }
    return map;
  }, [monthItems]);

  const eventsByDateView = useMemo(() => {
    const map = new Map<string, DisplayItem[]>();
    for (const it of viewItems) {
      const list = map.get(it.date) ?? [];
      list.push(it);
      map.set(it.date, list);
    }
    return map;
  }, [viewItems]);

  const selectedEvents = (eventsByDateView.get(selected) ?? []).sort((a, b) => a.time.localeCompare(b.time));

  const upcoming = upcomingItems
    .filter((e) => e.date >= todayKey)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 8);

  function renderEventRow(item: DisplayItem) {
    const palette = categoryPalette(item.category);
    const SourceIcon = item.source === 'event' ? null : MONEY_SOURCE_META[item.source].icon;
    return (
      <div
        key={item.key}
        className={`group flex items-center justify-between gap-2 rounded-lg border-l-2 bg-surface-800/40 py-1.5 pl-2.5 pr-1.5 ${palette.border}`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 truncate text-[13px] text-surface-200">
            {SourceIcon && <SourceIcon size={12} className="shrink-0 text-surface-500" />}
            <span className="truncate">{item.title}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            {item.time && (
              <span className="flex items-center gap-1 text-[11px] text-surface-500">
                <Clock size={10} /> {formatTime(item.time)}
              </span>
            )}
            {item.reminderMinutes != null && (
              <span className="flex items-center gap-1 text-[11px] text-surface-500">
                <BellRing size={10} />
              </span>
            )}
            {item.category && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${palette.badge}`}>{item.category}</span>
            )}
          </div>
        </div>
        {!item.readOnly && item.original && (
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button onClick={() => setEditing(item.original!)} className={buttonGhostIconClass}>
              <Pencil size={13} />
            </button>
            <button onClick={() => removeEvent(item.original!.id)} className={buttonGhostIconClass}>
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Calendar" subtitle="Plan your days." />
      <div className="p-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-surface-100">
                {view === 'day'
                  ? formatFriendlyDate(selected)
                  : view === 'week'
                    ? `${weekRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                    : cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-1">
                <div className="mr-2 flex items-center gap-0.5 rounded-lg bg-surface-800 p-0.5">
                  {(['month', 'week', 'day'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`rounded-md px-2 py-1 text-[11px] font-medium capitalize transition-colors ${
                        view === v ? 'bg-accent-gradient text-white shadow-glow' : 'text-surface-400 hover:text-surface-100'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {view === 'month' && (
                  <>
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
                  </>
                )}
                {view === 'week' && (
                  <>
                    <button
                      onClick={() => setSelected(formatDateKey(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - 7)))}
                      className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-800 hover:text-surface-100"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <button onClick={() => setSelected(todayKey)} className={buttonSecondaryClass}>
                      Today
                    </button>
                    <button
                      onClick={() => setSelected(formatDateKey(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 7)))}
                      className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-800 hover:text-surface-100"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </>
                )}
                {view === 'day' && (
                  <>
                    <button
                      onClick={() => setSelected(formatDateKey(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - 1)))}
                      className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-800 hover:text-surface-100"
                    >
                      <ChevronLeft size={15} />
                    </button>
                    <button onClick={() => setSelected(todayKey)} className={buttonSecondaryClass}>
                      Today
                    </button>
                    <button
                      onClick={() => setSelected(formatDateKey(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1)))}
                      className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-800 hover:text-surface-100"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {view === 'month' && (
              <>
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
                    const dayEvents = eventsByDateMonth.get(key) ?? [];
                    const dotEvents = dayEvents.slice(0, 3);
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
                          <span className="flex items-center gap-0.5">
                            {dotEvents.map((ev) => (
                              <span
                                key={ev.key}
                                className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : categoryPalette(ev.category).dot}`}
                              />
                            ))}
                            {dayEvents.length > 3 && (
                              <span className={`text-[8px] leading-none ${isSelected ? 'text-white' : 'text-surface-500'}`}>
                                +{dayEvents.length - 3}
                              </span>
                            )}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {view === 'week' && (
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date(weekRange.start);
                  d.setDate(weekRange.start.getDate() + i);
                  const key = formatDateKey(d);
                  const isToday = key === todayKey;
                  const isSelected = key === selected;
                  const dayItems = (eventsByDateView.get(key) ?? []).sort((a, b) => a.time.localeCompare(b.time));
                  return (
                    <button
                      key={key}
                      onClick={() => setSelected(key)}
                      className={`flex min-h-[9rem] flex-col items-stretch gap-1 rounded-lg border p-1.5 text-left transition-colors ${
                        isSelected ? 'border-accent-500/60 bg-accent-500/10' : 'border-surface-800 hover:bg-surface-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-surface-500">{WEEKDAYS[d.getDay()]}</span>
                        <span className={`font-semibold ${isToday ? 'text-accent-400' : 'text-surface-300'}`}>{d.getDate()}</span>
                      </div>
                      <div className="flex-1 space-y-1 overflow-hidden">
                        {dayItems.slice(0, 3).map((it) => (
                          <div key={it.key} className={`truncate rounded px-1 py-0.5 text-[10px] ${categoryPalette(it.category).badge}`}>
                            {it.title}
                          </div>
                        ))}
                        {dayItems.length > 3 && <div className="text-[10px] text-surface-500">+{dayItems.length - 3} more</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {view === 'day' && (
              <div className="space-y-1.5">
                {selectedEvents.length === 0 ? (
                  <EmptyState icon={CalendarDays} label="Nothing scheduled this day." />
                ) : (
                  selectedEvents.map(renderEventRow)
                )}
              </div>
            )}
          </Card>

          <div className="space-y-4">
            {view !== 'day' && (
              <Card>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-surface-100">{formatFriendlyDate(selected)}</h3>
                  <button onClick={() => setAddOpen(true)} className={buttonPrimaryClass}>
                    <Plus size={13} /> Add event
                  </button>
                </div>
                <div className="space-y-1.5">
                  {selectedEvents.length === 0 ? (
                    <p className="text-[12px] text-surface-500">No events this day.</p>
                  ) : (
                    selectedEvents.map(renderEventRow)
                  )}
                </div>
              </Card>
            )}

            {view === 'day' && (
              <Card>
                <button onClick={() => setAddOpen(true)} className={`w-full ${buttonPrimaryClass}`}>
                  <Plus size={13} /> Add event
                </button>
              </Card>
            )}

            <Card>
              <h3 className="mb-3 text-[13px] font-semibold text-surface-100">Upcoming</h3>
              {upcoming.length === 0 ? (
                <EmptyState icon={CalendarDays} label="Nothing upcoming." />
              ) : (
                <div className="space-y-1.5">
                  {upcoming.map((item) => {
                    const palette = categoryPalette(item.category);
                    const SourceIcon = item.source === 'event' ? null : MONEY_SOURCE_META[item.source].icon;
                    return (
                      <div key={item.key} className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-surface-800/40">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${palette.dot}`} />
                        {SourceIcon && <SourceIcon size={11} className="shrink-0 text-surface-500" />}
                        <span className="min-w-0 flex-1 truncate text-[13px] text-surface-200">{item.title}</span>
                        <span className="shrink-0 whitespace-nowrap text-[11px] text-surface-500">
                          {formatFriendlyDate(item.date)}
                          {item.time && ` · ${formatTime(item.time)}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <Drawer open={addOpen} onClose={() => setAddOpen(false)} title="Add event" subtitle={selected}>
        <EventForm date={selected} onDone={() => setAddOpen(false)} />
      </Drawer>

      <Drawer open={!!editing} onClose={() => setEditing(null)} title="Edit event" subtitle={editing?.date}>
        {editing && <EventForm date={editing.date} initial={editing} onDone={() => setEditing(null)} />}
      </Drawer>
    </div>
  );
}
