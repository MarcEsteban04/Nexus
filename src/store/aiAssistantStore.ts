import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createId } from '@/utils/id';
import { ContextDomain } from '@/utils/assistantContext';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export type AssistantProvider = 'openai' | 'groq';

interface AiAssistantState {
  messages: AssistantMessage[];
  provider: AssistantProvider;
  enabledDomains: Record<ContextDomain, boolean>;
  lastDigestDate: string | null;
  addMessage: (role: 'user' | 'assistant', content: string) => void;
  clearMessages: () => void;
  setProvider: (provider: AssistantProvider) => void;
  toggleDomain: (domain: ContextDomain) => void;
  setLastDigestDate: (date: string) => void;
}

export const useAiAssistantStore = create<AiAssistantState>()(
  persist(
    (set) => ({
      messages: [],
      provider: 'openai',
      enabledDomains: { money: true, calendar: true, gaming: true, receipts: true, shopping: true },
      lastDigestDate: null,
      addMessage: (role, content) =>
        set((state) => ({
          messages: [...state.messages, { id: createId(), role, content, createdAt: new Date().toISOString() }],
        })),
      clearMessages: () => set({ messages: [] }),
      setProvider: (provider) => set({ provider }),
      toggleDomain: (domain) =>
        set((state) => ({ enabledDomains: { ...state.enabledDomains, [domain]: !state.enabledDomains[domain] } })),
      setLastDigestDate: (date) => set({ lastDigestDate: date }),
    }),
    { name: 'nexus:ai-assistant' },
  ),
);
