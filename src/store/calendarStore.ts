import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CalendarEvent } from '@/types';
import { createId } from '@/utils/id';

interface CalendarState {
  events: CalendarEvent[];
  addEvent: (e: Omit<CalendarEvent, 'id' | 'createdAt'>) => void;
  updateEvent: (id: string, patch: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>) => void;
  removeEvent: (id: string) => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (e) =>
        set((state) => ({ events: [...state.events, { ...e, id: createId(), createdAt: new Date().toISOString() }] })),
      updateEvent: (id, patch) =>
        set((state) => ({ events: state.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      removeEvent: (id) => set((state) => ({ events: state.events.filter((e) => e.id !== id) })),
    }),
    { name: 'nexus:calendar' },
  ),
);
