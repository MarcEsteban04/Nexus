import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createId } from '@/utils/id';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface AiAssistantState {
  messages: AssistantMessage[];
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  clearMessages: () => void;
}

export const useAiAssistantStore = create<AiAssistantState>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (role, content) =>
        set((state) => ({
          messages: [...state.messages, { id: createId(), role, content, createdAt: new Date().toISOString() }],
        })),
      clearMessages: () => set({ messages: [] }),
    }),
    { name: 'nexus:ai-assistant' },
  ),
);
